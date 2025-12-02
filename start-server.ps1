<#
.SYNOPSIS
    English Freetalk App - Local HTTP Server
.DESCRIPTION
    이 스크립트는 로컬 HTTP 서버를 시작합니다.
    마이크 권한을 한 번만 허용하면 계속 사용할 수 있습니다.
#>

$port = 8000
$path = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  English Freetalk App Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server at http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Process "http://localhost:$port"

# Create HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server is running..." -ForegroundColor Green
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path $path $localPath.TrimStart('/')
        
        if (Test-Path $filePath) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # Set content type
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".json" { "application/json" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif" { "image/gif" }
                ".svg" { "image/svg+xml" }
                ".ico" { "image/x-icon" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            
            Write-Host "$(Get-Date -Format 'HH:mm:ss') [200] $($request.Url.LocalPath)" -ForegroundColor Gray
        } else {
            $response.StatusCode = 404
            $message = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found: $localPath")
            $response.OutputStream.Write($message, 0, $message.Length)
            
            Write-Host "$(Get-Date -Format 'HH:mm:ss') [404] $($request.Url.LocalPath)" -ForegroundColor Red
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
