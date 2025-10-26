<?php
// contact.php (DIAGNÓSTICO)
declare(strict_types=1);

$TO        = 'contacto@ebenimeli.org';
$SUBJECT   = '[Formulario de contacto]';
$FROM      = 'no-reply@ebenimeli.org';     // usa tu dominio (SPF/DKIM)
$THANK_YOU_URL = null;                      // <-- deja null mientras pruebas (sin redirección)
$RATE_LIMIT_MAX   = 5;
$MIN_FORM_MS      = 3000;
$MAX_FORM_MS      = 60 * 60 * 1000;
$ALLOW_URLS_IN_MESSAGE = false;
$SILENT_ON_SPAM   = true;                   // ok dejarlo en true, pero NO silencamos fallo de mail()
$LOG_FILE         = rtrim(sys_get_temp_dir(), '/').'/contact.log';
$MAIL_PARAMS      = '-f'.$FROM;             // Return-Path

function log_line(string $m){global $LOG_FILE;@file_put_contents($LOG_FILE,'['.date('c')."] $m\n",FILE_APPEND);}
function ok($url){ if($url){header('Location: '.$url, true, 303);exit;} header('Content-Type: application/json; charset=UTF-8'); echo json_encode(['ok'=>true]); exit;}
function err(int $c,string $m){ http_response_code($c); header('Content-Type: application/json; charset=UTF-8'); echo json_encode(['ok'=>false,'error'=>$m],JSON_UNESCAPED_UNICODE); exit; }

// GET ?ping=1  -> salud
if ($_SERVER['REQUEST_METHOD']==='GET' && isset($_GET['ping'])) {
  $w = @file_put_contents($LOG_FILE,'['.date('c')."] PING\n",FILE_APPEND)!==false;
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['ok'=>true,'log_write'=>$w,'tmp_dir'=>sys_get_temp_dir(),'cookie_present'=>isset($_COOKIE['csrf_token'])]); exit;
}
// GET ?token=1 -> set cookie CSRF
if ($_SERVER['REQUEST_METHOD']==='GET' && isset($_GET['token'])) {
  $csrf = bin2hex(random_bytes(32));
  setcookie('csrf_token',$csrf,['expires'=>time()+3600,'path'=>'/','secure'=>!empty($_SERVER['HTTPS']),'httponly'=>false,'samesite'=>'Lax']);
  http_response_code(204); exit;
}

if ($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); header('Allow: POST'); exit('Method Not Allowed'); }

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
log_line("POST IP=$ip UA=$ua");

// Honeypot / JS / tiempo
$hp = trim((string)($_POST['website'] ?? ''));
if ($hp!==''){ log_line("SPAM honeypot='$hp'"); if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(400,'Spam (honeypot)'); }
$jsok = (string)($_POST['jsok'] ?? '0');
if ($jsok!=='1'){ log_line("SPAM jsok='$jsok'"); if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(400,'Spam (jsok)'); }
$started = (int)($_POST['started'] ?? 0);
$nowMs   = (int)floor(microtime(true)*1000);
$elapsed = $nowMs - $started;
if ($started===0 || $elapsed < $MIN_FORM_MS || $elapsed > $MAX_FORM_MS){
  log_line("SPAM tiempo started=$started elapsedMs=$elapsed");
  if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(400,'Spam (tiempo)');
}

// CSRF
$csrf_field  = (string)($_POST['csrf'] ?? '');
$csrf_cookie = (string)($_COOKIE['csrf_token'] ?? '');
if ($csrf_field==='' || $csrf_cookie==='' || !hash_equals($csrf_cookie,$csrf_field)){
  log_line("CSRF inválido fieldLen=".strlen($csrf_field)." cookieLen=".strlen($csrf_cookie));
  if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(400,'CSRF inválido');
}

// Rate-limit 1h
$bucket = rtrim(sys_get_temp_dir(),'/').'/contact_rate_'.md5($ip).'.json';
$now = time(); $events=[];
if (is_file($bucket)) {
  $raw=@file_get_contents($bucket); $events=json_decode($raw?:'[]',true); if(!is_array($events)) $events=[];
  $events=array_values(array_filter($events,fn($t)=>($now-(int)$t)<=3600));
}
if (count($events) >= $RATE_LIMIT_MAX){ log_line("Rate-limit $ip ".count($events)."/$RATE_LIMIT_MAX"); if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(429,'Demasiadas solicitudes'); }
$events[]=$now; @file_put_contents($bucket,json_encode($events),LOCK_EX);

// Datos
$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$phone   = trim((string)($_POST['phone']   ?? ''));
$consent = isset($_POST['consent']);

$errors=[];
if ($name==='' || mb_strlen($name)>120)       $errors[]='Nombre inválido';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))$errors[]='Email inválido';
if ($subject==='' || mb_strlen($subject)>120)  $errors[]='Asunto inválido';
$len=mb_strlen($message); if ($len<10 || $len>5000) $errors[]='Mensaje inválido';
if (!$consent) $errors[]='Falta consentimiento';
foreach([$name,$email,$subject,$phone] as $v){ if(preg_match('/[\r\n]/',$v)){ $errors[]='Entrada inválida (CRLF)'; break; } }
if (!$ALLOW_URLS_IN_MESSAGE && preg_match('/https?:\/\/|www\./i',$message)) $errors[]='El mensaje no puede contener enlaces';
if ($errors){ log_line('Errores: '.implode(' | ',$errors)); if($SILENT_ON_SPAM) ok($THANK_YOU_URL); err(422,implode('; ',$errors)); }

// Correo
$host = $_SERVER['HTTP_HOST'] ?? 'sitio';
$body = implode("\n",[
  "Nombre: $name",
  "Email: $email",
  "Teléfono: ".($phone!==''?$phone:'—'),
  "IP: $ip",
  "UA: $ua",
  "",
  "Mensaje:",
  $message
]);
$fullSubject = sprintf('[%s] %s: %s',$host,$SUBJECT,$subject);
$headers=[];
$headers[]='MIME-Version: 1.0';
$headers[]='Content-Type: text/plain; charset=UTF-8';
$headers[]='From: '.$FROM;
$headers[]='Reply-To: '.sprintf('"%s" <%s>', addslashes($name), $email);
$headers_str=implode("\r\n",$headers);

log_line("mail() TO=$TO FROM=$FROM Subject='$fullSubject'");
$sent = @mail($TO, $fullSubject, $body, $headers_str, $MAIL_PARAMS);
log_line('mail() => '.($sent?'OK':'FAIL'));

if ($sent) ok($THANK_YOU_URL);
err(500,'No se pudo enviar el correo. Revisa /tmp/contact.log y SPF/DKIM/DMARC.');