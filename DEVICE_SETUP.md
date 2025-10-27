# Photobooth Device Setup Guide

This guide explains how to set up a Raspberry Pi or Arduino device as a photobooth client that communicates with the central dashboard server.

## Prerequisites

### For Raspberry Pi
- Raspberry Pi 4 (Model B recommended) or higher
- Raspberry Pi OS (Bullseye or newer)
- 4GB RAM minimum, 8GB recommended
- 32GB microSD card or larger
- Cellular modem (LTE/4G) with USB connection or Hat module
- Temperature and humidity sensor (DHT22 recommended)
- Battery level sensor (via GPIO ADC)

### For Arduino
- Arduino MKR WiFi 1010 or Arduino MKR GSM 1400
- MKR IoT Carrier (optional, for sensors)
- Cellular modem module
- Temperature/humidity sensor (DHT22 or BME280)
- Power monitoring module

## Hardware Setup

### Raspberry Pi

1. **Install OS**
   ```bash
   # Download Raspberry Pi Imager
   # https://www.raspberrypi.com/software/
   # Write Raspberry Pi OS (Lite recommended) to microSD card
   ```

2. **Initial Setup**
   ```bash
   # SSH into Pi
   ssh pi@<pi-ip-address>

   # Update system
   sudo apt-get update
   sudo apt-get upgrade -y
   ```

3. **Install Python and Dependencies**
   ```bash
   sudo apt-get install -y python3-pip python3-dev
   sudo apt-get install -y python3-requests python3-gpiozero python3-adafruit-circuitpython-dht

   # Install required packages
   pip3 install requests adafruit-circuitpython-dht adafruit-circuitpython-ads1x15
   ```

4. **Enable Required Interfaces**
   ```bash
   sudo raspi-config
   # Enable: I2C, SPI, Serial
   # Enable: Remote GPIO (for sensor access)
   ```

5. **Setup Cellular Modem**
   - For USB modems: Device should be automatically detected
   - For HAT modules: Follow manufacturer installation instructions
   - Test connectivity: `ping google.com`

### Arduino

1. **Install Arduino IDE**
   - Download from https://www.arduino.cc/en/software

2. **Install Board Support**
   - Add MKR board support via Board Manager
   - Install required libraries:
     - MKRGSM (for GSM boards)
     - Adafruit DHT22
     - Adafruit MQTT

3. **Upload Basic Sketch**
   - See `arduino/photobooth-client.ino` for example code

## Software Installation

### Python Client (Raspberry Pi)

Create `/home/pi/photobooth-client/config.py`:

```python
# Configuration
SERVER_URL = "http://your-server-ip:3001/api"
DEVICE_TYPE = "raspberrypi"
FIRMWARE_VERSION = "1.0.0"
HARDWARE_ID = "RPI-001"  # Unique identifier
LOCATION_ADDRESS = "123 Main Street"
LOCATION_REGION = "Downtown"

# Hardware Pins (GPIO)
DHT_PIN = 17  # GPIO 17 for temperature/humidity
BATTERY_PIN = 0  # ADC pin 0 for battery level
SIGNAL_CHECK_INTERVAL = 30  # seconds
HEALTH_CHECK_INTERVAL = 30  # seconds
```

Create `/home/pi/photobooth-client/client.py`:

```python
#!/usr/bin/env python3
import requests
import json
import time
import board
import adafruit_dht
from datetime import datetime
import subprocess
import re
import config

class PhotoboothClient:
    def __init__(self):
        self.dht = adafruit_dht.DHT22(board.D17)
        self.booth_id = None
        self.registered = False

    def get_signal_strength(self):
        """Get cellular signal strength"""
        try:
            result = subprocess.run(
                ['sudo', 'cat', '/sys/class/net/wwan0/statistics/rx_bytes'],
                capture_output=True, text=True
            )
            # Placeholder - actual implementation depends on modem type
            return -85
        except:
            return None

    def get_battery_level(self):
        """Read battery level from ADC"""
        try:
            # Placeholder - actual implementation depends on ADC module
            # This would read from I2C ADC or GPIO
            return 85
        except:
            return 0

    def get_temperature_humidity(self):
        """Read temperature and humidity"""
        try:
            temp = self.dht.temperature
            humidity = self.dht.humidity
            return temp, humidity
        except RuntimeError as e:
            print(f"DHT error: {e}")
            return None, None

    def get_uptime_seconds(self):
        """Get system uptime in seconds"""
        try:
            with open('/proc/uptime', 'r') as f:
                uptime = int(float(f.readline().split()[0]))
            return uptime
        except:
            return 0

    def register(self):
        """Register booth with central server"""
        try:
            payload = {
                "device_type": config.DEVICE_TYPE,
                "firmware_version": config.FIRMWARE_VERSION,
                "hardware_id": config.HARDWARE_ID,
                "location": {
                    "address": config.LOCATION_ADDRESS,
                    "region": config.LOCATION_REGION
                }
            }

            response = requests.post(
                f"{config.SERVER_URL}/booths/register",
                json=payload,
                timeout=10
            )

            if response.status_code == 201:
                self.booth_id = response.json()['booth_id']
                self.registered = True
                print(f"Registered booth: {self.booth_id}")
                return True
            else:
                print(f"Registration failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"Registration error: {e}")
            return False

    def send_health_check(self):
        """Send health check to server"""
        if not self.registered or not self.booth_id:
            return False

        try:
            temp, humidity = self.get_temperature_humidity()

            payload = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "battery_level": self.get_battery_level(),
                "temperature": temp or 0,
                "humidity": humidity or 0,
                "storage_used_percent": self.get_storage_percent(),
                "signal_strength": self.get_signal_strength() or -100,
                "uptime_seconds": self.get_uptime_seconds(),
                "session_count": 0,  # Track from your app
                "photos_count": 0    # Track from your app
            }

            response = requests.post(
                f"{config.SERVER_URL}/booths/{self.booth_id}/health",
                json=payload,
                timeout=10
            )

            if response.status_code == 201:
                print(f"Health check sent: {datetime.now().strftime('%H:%M:%S')}")
                return True
            else:
                print(f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"Health check error: {e}")
            return False

    def get_storage_percent(self):
        """Get disk usage percentage"""
        try:
            result = subprocess.run(
                ['df', '/'],
                capture_output=True, text=True
            )
            lines = result.stdout.split('\n')
            usage = lines[1].split()[4].rstrip('%')
            return int(usage)
        except:
            return 0

    def run(self):
        """Main client loop"""
        print("Starting photobooth client...")

        # Register with server
        while not self.registered:
            print("Attempting to register...")
            if self.register():
                break
            time.sleep(5)

        # Main loop - send health checks periodically
        while True:
            try:
                self.send_health_check()
                time.sleep(config.HEALTH_CHECK_INTERVAL)
            except KeyboardInterrupt:
                print("Shutting down...")
                break
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(5)

if __name__ == "__main__":
    client = PhotoboothClient()
    client.run()
```

### Systemd Service (Raspberry Pi)

Create `/etc/systemd/system/photobooth-client.service`:

```ini
[Unit]
Description=Photobooth Client Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/photobooth-client
ExecStart=/usr/bin/python3 /home/pi/photobooth-client/client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable photobooth-client
sudo systemctl start photobooth-client

# Check status
sudo systemctl status photobooth-client

# View logs
sudo journalctl -u photobooth-client -f
```

## Network Configuration

### Cellular Connectivity

**For USB Modems:**
```bash
# Install connection manager
sudo apt-get install modemmanager network-manager

# Check device
mmcli -L

# Connect to network
nmcli device
nmcli connection add type gsm ifname wwan0 con-name cellular apn <YOUR_APN>
```

**For HAT Modules:**
Follow manufacturer documentation for Sixfab, Waveshare, or other modules.

### Redundancy

- Implement local buffering when offline
- Queue health checks to local SQLite database
- Sync when connection restored
- Implement retry logic with exponential backoff

## Testing

```bash
# Test registration
curl -X POST http://localhost:3001/api/booths/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "raspberrypi",
    "firmware_version": "1.0.0",
    "hardware_id": "RPI-TEST-001",
    "location": {"address": "Test", "region": "Test"}
  }'

# Test health check
curl -X POST http://localhost:3001/api/booths/{BOOTH_ID}/health \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-10-27T10:30:00Z",
    "battery_level": 85,
    "temperature": 22.5,
    "humidity": 45,
    "storage_used_percent": 65,
    "signal_strength": -95,
    "uptime_seconds": 345600,
    "session_count": 125,
    "photos_count": 284
  }'
```

## Troubleshooting

### Connection Issues
- Verify cellular connectivity: `mmcli -m 0`
- Check APN configuration
- Monitor signal strength: `mmcli -m 0 --signal-get`

### Sensor Not Reading
- Check GPIO connections
- Test with: `python3 -c "import board; print(board.D17)"`
- Verify sensor wiring (3.3V, GND, Data)

### Server Communication
- Check firewall rules on server
- Verify API endpoint: `curl http://server-ip:3001/health`
- Monitor logs: `sudo journalctl -u photobooth-client -f`

### Performance
- Monitor CPU: `top`
- Check memory: `free -h`
- Verify network: `iftop`

## Firmware Updates

1. Backup current configuration
2. Pull latest code from repository
3. Restart service: `sudo systemctl restart photobooth-client`
4. Monitor logs for errors

## Security Considerations

- Use HTTPS in production (configure reverse proxy)
- Implement API key authentication
- Restrict network access to necessary ports
- Keep OS and dependencies updated
- Rotate security credentials regularly

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u photobooth-client`
2. Verify network connectivity
3. Test API endpoints manually
4. Check dashboard for booth status
