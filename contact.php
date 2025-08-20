<?php
// contact.php
declare(strict_types=1);

// Configuración
$TO      = 'contacto@ebenimeli.org';
$SUBJECT = '[Formulario de contacto]';
$FROM    = 'no-reply@ebenimeli.org'; // Usa tu propio dominio (SPF/DKIM)
$THANK_YOU_URL = 'pages/thanks.html';     // o null si quieres responder JSON

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  exit('Method Not Allowed');
}

// Honeypot
if (!empty($_POST['website'] ?? '')) {
  http_response_code(200); // Finge OK para bots
  exit('OK');
}

// Recoge y sanea
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');
$phone   = trim($_POST['phone']   ?? '');

// Validación básica
$errors = [];
if ($name === '' || mb_strlen($name) > 120) $errors[] = 'Nombre inválido';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email inválido';
if ($subject === '' || mb_strlen($subject) > 120) $errors[] = 'Asunto inválido';
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) $errors[] = 'Mensaje inválido';

// Evita inyección en cabeceras
foreach ([$name,$email,$subject,$phone] as $v) {
  if (preg_match('/[\r\n]/', $v)) { $errors[] = 'Entrada inválida'; break; }
}

if ($errors) {
  http_response_code(422);
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['ok'=>false,'errors'=>$errors], JSON_UNESCAPED_UNICODE);
  exit;
}

// Construye el cuerpo
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$body = "Nombre: $name\nEmail: $email\nTeléfono: $phone\nIP: $ip\nUA: $ua\n\nMensaje:\n$message\n";

// Cabeceras
$headers = [];
$headers[] = "From: $FROM";
$headers[] = "Reply-To: $name <$email>";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers_str = implode("\r\n", $headers);

// Envía (mail() usa sendmail/relay del servidor)
$sent = @mail($TO, "[$_SERVER[HTTP_HOST]] $SUBJECT: $subject", $body, $headers_str);

if ($sent) {
  if ($THANK_YOU_URL) {
    header('Location: ' . $THANK_YOU_URL, true, 303);
  } else {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok'=>true], JSON_UNESCAPED_UNICODE);
  }
} else {
  http_response_code(500);
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['ok'=>false,'error'=>'No se pudo enviar el correo'], JSON_UNESCAPED_UNICODE);
}
