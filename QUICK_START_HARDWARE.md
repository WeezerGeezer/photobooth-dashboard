# Quick Start: Hardware Deployment

This guide gets you up and running with the photobooth hardware in 30 minutes.

## Prerequisites (5 minutes)

Before starting, you'll need:

- **Arduino Mega 2560** with USB cable
- **Raspberry Pi 4** (2GB+ RAM) with power supply
- **HC-05 Bluetooth module**
- **PiCamera2** connected to CSI port
- **Photo printer** connected via USB
- **Momentary push button**
- **LED + 220Ω resistor** (status indicator)
- **2x relay modules** (camera & flash triggers)
- **4 AA battery pack** or suitable power supply

## Step 1: Flash Arduino (5 minutes)

```bash
# 1. Download Arduino IDE from https://www.arduino.cc/en/software
# 2. Connect Arduino Mega 2560 via USB
# 3. Open photobooth_controller.ino in Arduino IDE
# 4. Select: Tools → Board → Arduino Mega 2560
# 5. Select: Tools → Port → COM/TTY port
# 6. Click Upload button
# 7. Wait for "Upload complete" message
# 8. Open Serial Monitor (Tools → Serial Monitor, 9600 baud)
# 9. Verify: "Photobooth Arduino Controller Initialized" message

echo "✓ Arduino flashed"
```

## Step 2: Setup Raspberry Pi (10 minutes)

```bash
# SSH into Raspberry Pi
ssh pi@raspberrypi.local

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies (all in one command)
sudo apt install -y python3-picamera2 python3-pil python3-numpy \
  python3-serial python3-bluetooth cups cups-client \
  build-essential python3-dev git

# Enable camera
sudo raspi-config
# Navigate to: Interfacing Options → Camera → Enable
# Exit and reboot when prompted

# Clone photobooth project
cd ~
git clone https://github.com/WeezerGeezer/photobooth-dashboard.git
cd photobooth-dashboard

# Create Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r raspberry_pi/requirements.txt

echo "✓ Raspberry Pi setup complete"
```

## Step 3: Connect Bluetooth (3 minutes)

```bash
# On Raspberry Pi
sudo bluetoothctl

# In bluetoothctl:
power on
discoverable on
scan on

# Find HC-05 in list, note MAC address (format: XX:XX:XX:XX:XX:XX)
# Then:
pair [MAC_ADDRESS]
trust [MAC_ADDRESS]
connect [MAC_ADDRESS]
exit

# Verify connection
hcitool con

# Create RFCOMM binding
sudo rfcomm bind /dev/rfcomm0 [MAC_ADDRESS] 1

# Test Bluetooth
minicom -D /dev/rfcomm0 -b 9600
# Should connect; send "READY" from Arduino Serial Monitor
# Type Ctrl+A, then Ctrl+X to exit

echo "✓ Bluetooth configured"
```

## Step 4: Configure Printer (3 minutes)

```bash
# Start CUPS
sudo systemctl start cups
sudo systemctl enable cups

# Test printer connection
lsusb
# Look for printer in list

# Configure printer via web interface
# Open http://raspberrypi.local:631 in browser
# Administration → Add Printer
# Configure for 4x6 photo paper

# OR command line setup:
lpstat -p  # List printers
# lpadmin -p PhotoPrinter -E -v usb://... -m everywhere

# Test print
echo "Test" | lp

echo "✓ Printer configured"
```

## Step 5: Wiring (5 minutes)

### Button
```
5V → 10kΩ Resistor → GND
                  ↓
              Arduino Pin 2
```

### LED Status Indicator
```
5V → 220Ω Resistor → LED Cathode → Pin 5 → GND
```

### Camera Relay
```
Arduino Pin 3 → Relay Signal
Relay 5V → Power
Relay GND → Ground
Relay NO → Camera Trigger
```

### Flash Relay
```
Arduino Pin 4 → Relay Signal
Relay 5V → Power
Relay GND → Ground
Relay NO → Flash PC Sync
```

## Step 6: Test System (3 minutes)

```bash
# Start photobooth application
cd ~/photobooth-dashboard
source venv/bin/activate
python3 raspberry_pi/photobooth_main.py

# In another terminal, test
minicom -D /dev/rfcomm0 -b 9600

# Send from Arduino Serial Monitor:
# Type: READY

# You should see in Python console:
# "Photobooth system initialized successfully"

# Press the physical button on Arduino

# You should see:
# - Arduino LED blinks (countdown)
# - Camera captures flash
# - Python logs "Capturing photo"
# - File appears in ~/photobooth/photos/

echo "✓ System operational"
```

## Success Indicators

When working correctly, you'll see:

```
Arduino Serial Monitor:
  "Photobooth Arduino Controller Initialized"
  "Button pressed - Starting photobooth"

Python Console:
  "Photobooth system initialized successfully"
  "Photobooth main loop started"
  "Capturing photo 1 to /home/pi/photobooth/photos/..."

Printer:
  "Test" document prints successfully
```

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Arduino won't upload | Check COM port, install CH340 drivers |
| Button doesn't work | Check GPIO pin, verify button wiring |
| Camera not detected | `sudo raspi-config` enable, then reboot |
| Bluetooth disconnects | Rerun `rfcomm bind` command |
| Printer not found | `lpstat -p`, verify USB connection |
| Python import errors | Run `pip install -r requirements.txt` again |

## Next Steps

1. **Register Booth with Dashboard**
   ```python
   python3
   from raspberry_pi.dashboard_integration import DashboardClient
   client = DashboardClient(server_url="http://[DASHBOARD_IP]:5000")
   client.register_booth()
   ```

2. **Setup Auto-Start Service**
   ```bash
   sudo cp raspberry_pi/photobooth.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable photobooth
   sudo systemctl start photobooth
   ```

3. **Monitor in Production**
   ```bash
   sudo journalctl -u photobooth -f
   ```

## Full Documentation

- [ARDUINO_SETUP.md](./ARDUINO_SETUP.md) - Detailed Arduino guide
- [RASPBERRYPI_SETUP.md](./RASPBERRYPI_SETUP.md) - Detailed Raspberry Pi guide
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Complete system overview
- [TESTING_AND_DEPLOYMENT.md](./TESTING_AND_DEPLOYMENT.md) - Testing procedures

## Support

For issues, check the troubleshooting guides above or review the complete documentation.
