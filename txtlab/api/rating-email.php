<?php
// rating-email.php
declare(strict_types=1);

// --- CONFIG ---
$ALLOWED_ORIGINS = [
  'https://www.ebenimeli.org',
  'https://ebenimeli.org',
  'https://www.ebenimeli.org/txtlab',
  'https://www.ebenimeli.org/txtlab-beta'
];
$TO_EMAIL   = 'contacto@ejemplo.com';            // <- fija destinatario
$FROM_EMAIL = 'noreply@ebenimeli.org';            // dominio tuyo con SPF/DKIM
$SUBJECT    = 'Nueva valoración de txtlab';
$RATE_LIMIT_SECONDS = 60;                         // 1/min por IP
// -------------

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  exit('Method Not Allowed');
}

// Requiere HTTPS (si estás detrás de proxy, revisa X-Forwarded-Proto)
if (
  empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off'
) {
  http_response_code(400);
  exit('Require HTTPS');
}

// Comprobar ORIGIN/REFERER contra allowlist
function origin_allowed(array $allowed): ?string {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin && in_array(rtrim($origin, '/'), $allowed, true)) return $origin;

  // Fallback a Referer (parsea host + esquema)
  $ref = $_SERVER['HTTP_REFERER'] ?? '';
  if ($ref) {
    $parts = parse_url($ref);
    if (!empty($parts['scheme']) && !empty($parts['host'])) {
      $base = $parts['scheme'].'://'.$parts['host'].(!empty($parts['port']) ? ':'.$parts['port'] : '');
      if (in_array($base, $allowed, true)) return $base;
    }
  }
  return null;
}

$okOrigin = origin_allowed($ALLOWED_ORIGINS);
if (!$okOrigin) {
  http_response_code(403);
  exit('Forbidden');
}

// CORS (solo tu origen) — útil si cambias de subruta
header('Vary: Origin');
header('Access-Control-Allow-Origin: '.$okOrigin);
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json; charset=UTF-8');

// Rate limit muy simple por IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rlKey = sys_get_temp_dir() . '/rating_' . preg_replace('/[^0-9a-fA-F:.\-]/', '_', $ip) . '.lock';
$now = time();
if (file_exists($rlKey)) {
  $last = (int) @file_get_contents($rlKey);
  if ($now - $last < $RATE_LIMIT_SECONDS) {
    http_response_code(429);
    echo json_encode(['ok'=>false,'err'=>'Too Many Requests']);
    exit;
  }
}
@file_put_contents($rlKey, (string)$now);

// Sanitizado helpers
function trim_nl(string $s): string {
  // evita inyección de cabeceras
  return preg_replace("/\r|\n/", '', $s);
}
function safe_text(string $s, int $max = 200): string {
  $s = strip_tags($s);
  $s = trim($s);
  $s = substr($s, 0, $max);
  return trim_nl($s);
}

// Inputs
$rating = filter_input(INPUT_POST, 'rating', FILTER_VALIDATE_INT, [
  'options' => ['min_range' => 1, 'max_range' => 5]
]);
$source = safe_text($_POST['source'] ?? '', 50);
$page   = safe_text($_POST['page']   ?? '', 300);

// Validación
if (!$rating) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'err'=>'Invalid rating']);
  exit;
}

// (Opcional) allowlist de sources
$allowedSources = ['welcome-dialog'];
if ($source && !in_array($source, $allowedSources, true)) {
  $source = 'other';
}

// Construir cuerpo (texto plano)
$lines = [
  'Nueva valoración de txtlab',
  '--------------------------',
  'Rating: ' . $rating . ' / 5',
  'Source: ' . ($source ?: '—'),
  'Page:   ' . ($page ?: '—'),
  'IP:     ' . $ip,
  'When:   ' . gmdate('c') . 'Z'
];
$body = implode("\n", $lines);

// Cabeceras seguras (sin datos del usuario)
$headers = [];
$headers[] = 'From: txtlab <'.$FROM_EMAIL.'>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: php-rating';

$ok = @mail($TO_EMAIL, $SUBJECT, $body, implode("\r\n", $headers));

if ($ok) {
  echo json_encode(['ok'=>true]);
} else {
  http_response_code(500);
  echo json_encode(['ok'=>false,'err'=>'Mail failed']);
}
