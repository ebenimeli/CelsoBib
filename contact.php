<?php
// contact.php
declare(strict_types=1);

/**
 * Endpoint con defensas antispam:
 * - GET ?token=1  -> emite cookie CSRF (double-submit) y responde 204.
 * - POST          -> valida honeypot, jsok, tiempo, CSRF, rate-limit y datos; envía email.
 */

// =====================
// Configuración
// =====================
$TO        = 'contacto@ebenimeli.org';
$SUBJECT   = '[Formulario de contacto]';
$FROM      = 'no-reply@ebenimeli.org'; // Mismo dominio que tu web (SPF/DKIM)
$THANK_YOU_URL = 'pages/thanks.html';  // Redirección tras envío correcto (303). Pon null para JSON.

$RATE_LIMIT_MAX   = 5;                  // máx. envíos por IP en la última hora
$MIN_FORM_MS      = 3000;               // mínimo 3 s en el formulario
$MAX_FORM_MS      = 60 * 60 * 1000;     // máximo 60 min
$ALLOW_URLS_IN_MESSAGE = false;         // bloquear URLs en el texto
$SILENT_ON_SPAM   = true;               // responde como si todo OK para no dar pistas
$TMP_DIR          = sys_get_temp_dir(); // almacenamiento rate-limit

// =====================
// Utilidades de respuesta
// =====================
function respond_ok(?string $thankUrl) {
  if ($thankUrl) {
    header('Location: ' . $thankUrl, true, 303);
    exit;
  }
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
  exit;
}

function respond_error(int $code, string $msg = 'Error') {
  http_response_code($code);
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

// =====================
// 1) Emisión cookie CSRF con GET ?token=1
// =====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['token'])) {
  $csrf = bin2hex(random_bytes(32));
  setcookie('csrf_token', $csrf, [
    'expires'  => time() + 3600,
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']),
    'httponly' => false,      // debe ser legible por JS para double-submit
    'samesite' => 'Lax'
  ]);
  http_response_code(204);    // No Content
  exit;
}

// =====================
// 2) Solo POST para procesar envíos
// =====================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  exit('Method Not Allowed');
}

// =====================
// 3) Trampas antispam (silenciosas)
// =====================
$honeypot = trim((string)($_POST['website'] ?? ''));
if ($honeypot !== '') {
  // Bot típico: fingimos OK
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(400, 'Spam detectado');
}

$jsok = (string)($_POST['jsok'] ?? '0');
if ($jsok !== '1') {
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(400, 'Spam detectado');
}

$started = (int)($_POST['started'] ?? 0);
$nowMs   = (int) floor(microtime(true) * 1000);
$elapsed = $nowMs - $started;
if ($started === 0 || $elapsed < $MIN_FORM_MS || $elapsed > $MAX_FORM_MS) {
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(400, 'Spam detectado');
}

// CSRF double-submit cookie
$csrf_field  = (string)($_POST['csrf'] ?? '');
$csrf_cookie = (string)($_COOKIE['csrf_token'] ?? '');
if ($csrf_field === '' || $csrf_cookie === '' || !hash_equals($csrf_cookie, $csrf_field)) {
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(400, 'CSRF inválido');
}

// =====================
// 4) Rate limiting por IP (ventana de 1 hora)
// =====================
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = $TMP_DIR . '/contact_rate_' . md5($ip) . '.json';
$now = time();
$events = [];

if (is_file($bucket)) {
  $raw = @file_get_contents($bucket);
  $events = json_decode($raw ?: '[]', true);
  if (!is_array($events)) $events = [];
  // Purga: sólo última hora
  $events = array_values(array_filter($events, fn($t) => ($now - (int)$t) <= 3600));
}

if (count($events) >= $RATE_LIMIT_MAX) {
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(429, 'Demasiadas solicitudes');
}

// Resérvalo ya para evitar carreras
$events[] = $now;
@file_put_contents($bucket, json_encode($events), LOCK_EX);

// =====================
// 5) Recogida y validación de datos
// =====================
$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$phone   = trim((string)($_POST['phone']   ?? ''));
$consent = isset($_POST['consent']); // checkbox RGPD

$errors = [];

// Longitudes y formatos
if ($name === '' || mb_strlen($name) > 120)        $errors[] = 'Nombre inválido';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    $errors[] = 'Email inválido';
if ($subject === '' || mb_strlen($subject) > 120)  $errors[] = 'Asunto inválido';
$len = mb_strlen($message);
if ($len < 10 || $len > 5000)                      $errors[] = 'Mensaje inválido';
if (!$consent)                                     $errors[] = 'Falta consentimiento';

// Evitar inyección en cabeceras
foreach ([$name, $email, $subject, $phone] as $v) {
  if (preg_match('/[\r\n]/', $v)) { $errors[] = 'Entrada inválida'; break; }
}

// Bloquear URLs si se desea
if (!$ALLOW_URLS_IN_MESSAGE && preg_match('/https?:\/\/|www\./i', $message)) {
  $errors[] = 'El mensaje no puede contener enlaces';
}

if ($errors) {
  // NO damos pistas a bots; fingimos OK si está activado
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(422, implode('; ', $errors));
}

// =====================
// 6) Construcción del correo
// =====================
$host = $_SERVER['HTTP_HOST'] ?? 'sitio';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

$bodyLines = [
  "Nombre: $name",
  "Email: $email",
  "Teléfono: " . ($phone !== '' ? $phone : '—'),
  "IP: $ip",
  "UA: $ua",
  "",
  "Mensaje:",
  $message
];
$body = implode("\n", $bodyLines);

$fullSubject = sprintf('[%s] %s: %s', $host, $SUBJECT, $subject);

// Cabeceras (recomendado migrar a PHPMailer + SMTP)
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . $FROM;
$headers[] = 'Reply-To: ' . sprintf('"%s" <%s>', addslashes($name), $email);
$headers_str = implode("\r\n", $headers);

// =====================
// 7) Envío
// =====================
$sent = @mail($TO, $fullSubject, $body, $headers_str);

// =====================
// 8) Respuesta al cliente
// =====================
if ($sent) {
  respond_ok($THANK_YOU_URL);
} else {
  // Incluso si falla, puedes responder OK para no dar señales a bots:
  if ($SILENT_ON_SPAM) respond_ok($THANK_YOU_URL);
  respond_error(500, 'No se pudo enviar el correo');
}