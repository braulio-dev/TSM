# TSM DNS Configuration Script for Windows
# Run this script as Administrator to configure DNS settings

param(
    [string]$ServerIP = "10.0.0.100",
    [string]$SecondaryDNS = "8.8.8.8"
)

Write-Host "TSM DNS Configuration Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "Configuring DNS settings..." -ForegroundColor Yellow
Write-Host "Primary DNS: $ServerIP" -ForegroundColor Cyan
Write-Host "Secondary DNS: $SecondaryDNS" -ForegroundColor Cyan

try {
    # Get active network adapters
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.InterfaceType -eq 6}
    
    if ($adapters.Count -eq 0) {
        Write-Host "No active Ethernet adapters found." -ForegroundColor Red
        exit 1
    }
    
    foreach ($adapter in $adapters) {
        Write-Host "Configuring adapter: $($adapter.Name)" -ForegroundColor Yellow
        
        # Set DNS servers
        Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses $ServerIP, $SecondaryDNS
        
        Write-Host "DNS configured for adapter: $($adapter.Name)" -ForegroundColor Green
    }
    
    # Flush DNS cache
    Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
    Clear-DnsClientCache
    
    Write-Host "DNS configuration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing DNS resolution..." -ForegroundColor Yellow
    
    # Test DNS resolution
    try {
        $result = Resolve-DnsName -Name "tsm.com" -Server $ServerIP -ErrorAction Stop
        Write-Host "SUCCESS: tsm.com resolves to $($result.IPAddress)" -ForegroundColor Green
    }
    catch {
        Write-Host "WARNING: Could not resolve tsm.com. DNS server may not be running yet." -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "You can now access your services at:" -ForegroundColor Cyan
    Write-Host "  - http://tsm.com (Main web application)" -ForegroundColor White
    Write-Host "  - http://api.tsm.com:3001 (Backend API)" -ForegroundColor White
    Write-Host "  - http://stream.tsm.com:8080 (Streaming server)" -ForegroundColor White
    Write-Host "  - ftp://ftp.tsm.com (FTP server)" -ForegroundColor White
    
}
catch {
    Write-Host "Error configuring DNS: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configuration complete. Press any key to exit..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 