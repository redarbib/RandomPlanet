<?php
header("Content-Type: application/json; charset=utf-8");

$query = "select top 80 pl_name,pl_rade,pl_bmasse,pl_eqt,pl_orbper from ps where pl_name is not null and lower(pl_name) not like 'kepler-%'";
$url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" . urlencode($query) . "&format=json";

$context = stream_context_create([
    "http" => [
        "timeout" => 20
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        "error" => "Exoplanet request failed"
    ]);
    exit;
}

$decoded = json_decode($response, true);
if ($decoded === null) {
    http_response_code(502);
    echo json_encode([
        "error" => "Exoplanet request returned invalid JSON"
    ]);
    exit;
}

echo $response;