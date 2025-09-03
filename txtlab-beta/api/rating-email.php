<?php
// /api/rating-email.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$rating = isset($data['rating']) ? intval($data['rating']) : 0;
if ($rating < 1 || $rating > 5) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Bad rating']);
  exit;
}

$path = isset($data['path']) ? substr($data['path'], 0, 512) : '';
$lang = isset($data['lang']) ? substr($data['lang'], 0, 32) : '';
$tz   = isset($data['tz'])   ? substr($data['tz'],   0, 64) : '';
$ts   = isset($data['ts'])   ? substr($data['ts'],   0, 64) : date('c');

$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? '';

$to      = 'contacto@ebenimeli.org';   // ← CAMBIA ESTA DIRECCIÓN
$subject = 'Nueva valoración txtlab: ' . $rating . '/5';
$body    = "Nueva valoración recibida:\n\n" .
           "⭐ Rating: {$rating}/5\n" .
           "Ruta: {$path}\n" .
           "Idioma: {$lang}\n" .
           "Zona horaria: {$tz}\n" .
           "Fecha (ISO): {$ts}\n\n" .
           "IP: {$ip}\n" .
           "Agente: {$ua}\n";

$headers = [];
$headers[] = 'From: txtlab <no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'localhost') . '>';
$headers[] = 'Reply-To: no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'localhost');
$headers[] = 'X-Mailer: PHP/' . phpversion();

$ok = @mail($to, $subject, $body, implode("\r\n", $headers));

if ($ok) {
  http_response_code(201);
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'mail() failed']);
}
