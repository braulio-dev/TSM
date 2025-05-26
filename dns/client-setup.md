 # DNS Client Configuration for TSM Intranet

This document explains how to configure client devices to use the TSM DNS server and resolve `tsm.com` to your server.

## DNS Server Information
- **DNS Server IP**: `10.0.0.100` (or the IP where your Docker host is running)
- **Domain**: `tsm.com`
- **Available subdomains**:
  - `tsm.com` - Main web application (port 80)
  - `www.tsm.com` - Same as main domain
  - `api.tsm.com` - Backend API (port 3001)
  - `stream.tsm.com` - Streaming server (port 8080)
  - `ftp.tsm.com` - FTP server (port 21)
  - `smtp.tsm.com` - SMTP server (port 25)

## Client Configuration

### Windows
1. Open Network and Sharing Center
2. Click on your network connection
3. Click "Properties"
4. Select "Internet Protocol Version 4 (TCP/IPv4)"
5. Click "Properties"
6. Select "Use the following DNS server addresses"
7. Set Primary DNS server to: `10.0.0.100`
8. Set Secondary DNS server to: `8.8.8.8` (Google DNS as fallback)
9. Click "OK" to save

### Windows (PowerShell - Administrative)
```powershell
# Set DNS server for the active network adapter
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.InterfaceType -eq 6}
Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses "10.0.0.100","8.8.8.8"
```

### Linux
Edit `/etc/resolv.conf`:
```bash
sudo nano /etc/resolv.conf
```
Add these lines:
```
nameserver 10.0.0.100
nameserver 8.8.8.8
```

Or for permanent configuration on Ubuntu/Debian with systemd-resolved:
```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
sudo nano /etc/resolv.conf
```

### macOS
1. Go to System Preferences > Network
2. Select your network connection
3. Click "Advanced"
4. Go to the "DNS" tab
5. Click "+" and add `10.0.0.100`
6. Add `8.8.8.8` as a secondary DNS
7. Click "OK" and "Apply"

### Router Configuration (Recommended)
For automatic configuration of all devices on your network:
1. Access your router's admin panel (usually http://192.168.1.1 or http://192.168.0.1)
2. Look for DHCP settings
3. Set Primary DNS to: `10.0.0.100`
4. Set Secondary DNS to: `8.8.8.8`
5. Save and restart the router

## Testing DNS Resolution

### Windows
```cmd
nslookup tsm.com
ping tsm.com
```

### Linux/macOS
```bash
dig tsm.com
nslookup tsm.com
ping tsm.com
```

## Troubleshooting

1. **DNS not resolving**: 
   - Check if the DNS container is running: `docker ps | grep dns-server`
   - Check DNS server logs: `docker logs dns-server`

2. **Can't reach services**:
   - Verify the server IP address in the zone file matches your actual server IP
   - Check firewall settings on the server

3. **Slow resolution**:
   - The DNS server forwards unknown queries to public DNS servers
   - Check network connectivity to 8.8.8.8

## Security Notes
- This DNS server is configured for internal use only
- It only accepts queries from private IP ranges
- External queries are forwarded to public DNS servers
- Consider adding firewall rules to restrict access to port 53