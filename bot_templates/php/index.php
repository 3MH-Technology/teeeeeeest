<?php
$token = getenv('BOT_TOKEN');
if (!$token) {
    die("No TOKEN provided");
}

// Receive update from webhook
$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (!$update) {
    echo "OK. Engine is running.";
    exit;
}

$chatId = $update["message"]["chat"]["id"] ?? null;
$text = $update["message"]["text"] ?? null;

if ($chatId && $text == "/start") {
    $url = "https://api.telegram.org/bot" . $token . "/sendMessage";
    $data = [
        "chat_id" => $chatId,
        "text" => "Hello from Wolf Hosting Isolated PHP Engine! Running lightning fast."
    ];
    
    $options = [
        "http" => [
            "header"  => "Content-type: application/x-www-form-urlencoded\r\n",
            "method"  => "POST",
            "content" => http_build_query($data)
        ]
    ];
    $context  = stream_context_create($options);
    file_get_contents($url, false, $context);
}

echo "OK";
