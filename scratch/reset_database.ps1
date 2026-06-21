$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080"

Write-Host "1. Logging in as Admin (admin@velora.example)..."
$loginBody = @{
    email = "admin@velora.example"
    password = "Password@123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.accessToken
    Write-Host "Successfully authenticated. Token retrieved."
} catch {
    Write-Host "Authentication failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n2. Triggering manual database reset and seeding..."
try {
    $resetRes = Invoke-WebRequest -Uri "$baseUrl/api/v1/admin/reset-database" -Method Post -Headers @{ Authorization = "Bearer $token" }
    if ($resetRes.StatusCode -eq 200) {
        Write-Host "Database reset and seeding completed successfully!"
    } else {
        Write-Host "Database reset returned status code: $($resetRes.StatusCode)"
    }
} catch {
    Write-Host "Database reset request failed: $($_.Exception.Message)"
    exit 1
}
