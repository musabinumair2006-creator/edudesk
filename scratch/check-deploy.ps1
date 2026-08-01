$configPath = "$env:USERPROFILE\.config\netlify\config.json"
if (-not (Test-Path $configPath)) {
    $configPath = "$env:LOCALAPPDATA\netlify\config.json"
}
$config = Get-Content $configPath | ConvertFrom-Json
$token = $config.users.PSObject.Properties.Value.auth.token

$uri = "https://api.netlify.com/api/v1/sites/f11e7a9a-1f04-4e64-a4e3-30bbacb91467/deploys?per_page=3"
$headers = @{ Authorization = "Bearer $token" }
$response = Invoke-WebRequest -Uri $uri -Headers $headers
$deploys = $response.Content | ConvertFrom-Json

foreach ($d in $deploys) {
    Write-Host "ID: $($d.id)"
    Write-Host "State: $($d.state)"
    Write-Host "Branch: $($d.branch)"
    Write-Host "Created: $($d.created_at)"
    Write-Host "Error: $($d.error_message)"
    Write-Host "---"
}
