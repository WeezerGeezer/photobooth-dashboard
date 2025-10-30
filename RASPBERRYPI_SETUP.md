# Raspberry Pi Photobooth Setup Guide

## Hardware Requirements

- **Raspberry Pi 4** (2GB RAM minimum, 4GB+ recommended)
- **Picamera 2 or compatible CSI camera module**
- **HC-05 Bluetooth Module** (paired with Arduino)
- **16GB+ microSD card** (SSD recommended for production)
- **USB Photo Printer** (CUPS-compatible)
- **Power Supply** (5.1V, 3A minimum for Raspberry Pi 4)
- **Heatsink and Fan** (optional but recommended for continuous operation)

## Initial Setup

### 1. Install Raspberry Pi OS

```bash
# Download Raspberry Pi Imager from https://www.raspberrypi.com/software/
# Write Raspberry Pi OS (64-bit) to microSD card
# Enable SSH and WiFi during setup
```

### 2. Boot and Connect

```bash
# SSH into Raspberry Pi
ssh pi@raspberrypi.local

# Update system
sudo apt update && sudo apt upgrade -y
```

### 3. Install Required System Dependencies

```bash
# Camera support
sudo apt install -y python3-picamera2

# Image processing
sudo apt install -y python3-pil python3-numpy

# Serial/Bluetooth
sudo apt install -y python3-serial python3-bluetooth

# Printing support
sudo apt install -y cups cups-client libcups2-dev

# Networking tools
sudo apt install -y wireless-tools wpasupplicant

# Build tools (for any C extensions)
sudo apt install -y build-essential python3-dev
```

### 4. Configure Bluetooth for Arduino Communication

```bash
# Set up Bluetooth device
sudo bluetoothctl

# In bluetoothctl prompt:
# > power on
# > discoverable on
# > scan on
# (Find HC-05 device, note the MAC address)
# > pair <MAC>
# > trust <MAC>
# > connect <MAC>
# > exit

# Create Bluetooth serial connection
sudo rfcomm bind /dev/rfcomm0 <MAC> 1
```

### 5. Configure CUPS Printer

```bash
# Start CUPS service
sudo systemctl start cups
sudo systemctl enable cups

# Add printer via web interface
# Open http://raspberrypi.local:631 in browser
# Administration → Add Printer
# Configure for 4x6 photo paper

# Alternatively, add via command line
lpstat -p  # List connected printers
lpadmin -p PhotoPrinter -E -v usb://... -m everywhere

# Test printer
echo "Test" | lp -d PhotoPrinter
```

### 6. Create Photobooth Directory Structure

```bash
# Create application directory
mkdir -p ~/photobooth/{photos,processing,output,logs,config}
cd ~/photobooth

# Clone or copy the project files
git clone https://github.com/WeezerGeezer/photobooth-dashboard.git
cd photobooth-dashboard

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r raspberry_pi/requirements.txt
```

### 7. Configure Camera

```bash
# Enable camera in raspi-config
sudo raspi-config

# Navigate to: Interfacing Options → Camera → Enable
# Reboot when prompted

# Test camera
libcamera-still -o test.jpg
```

### 8. Create Configuration File

Create `/home/pi/photobooth/config/photobooth.conf`:

```ini
[camera]
resolution=1920,1080
framerate=30
iso=200
brightness=0
contrast=0

[image_processing]
flash_brightness=1.2
contrast=1.5
saturation=0.0

[photostrip]
width=600
height=800
padding=20

[bluetooth]
port=/dev/rfcomm0
baudrate=9600

[printer]
name=PhotoPrinter
media=4x6
quality=high

[paths]
photos_dir=/home/pi/photobooth/photos
processing_dir=/home/pi/photobooth/processing
output_dir=/home/pi/photobooth/output
log_dir=/home/pi/photobooth/logs

[logging]
level=INFO
max_size=10485760
backup_count=5
```

## Systemd Service Configuration

Create `/etc/systemd/system/photobooth.service`:

```ini
[Unit]
Description=Photobooth Application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/photobooth
ExecStart=/home/pi/photobooth/venv/bin/python3 /home/pi/photobooth/raspberry_pi/photobooth_main.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Resource limits
CPUQuota=75%
MemoryLimit=512M
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable photobooth
sudo systemctl start photobooth

# Check status
sudo systemctl status photobooth

# View logs
sudo journalctl -u photobooth -f
```

## Testing

### Test Bluetooth Connection

```bash
# List available Bluetooth devices
hcitool scan

# Connect to Arduino
sudo rfcomm connect /dev/rfcomm0 <MAC>

# In another terminal, test communication
minicom -D /dev/rfcomm0 -b 9600

# Send "READY" to Arduino
# Should receive response messages
```

### Test Camera

```bash
cd ~/photobooth
source venv/bin/activate

python3 << 'EOF'
from picamera2 import Picamera2
import time

picam2 = Picamera2()
picam2.start()
time.sleep(2)
picam2.capture_file("/tmp/test.jpg")
print("Photo saved to /tmp/test.jpg")
EOF
```

### Test Image Processing

```bash
python3 << 'EOF'
from PIL import Image, ImageOps, ImageEnhance

# Load test image
img = Image.open("/tmp/test.jpg")

# Convert to B&W
img = ImageOps.grayscale(img)

# Enhance contrast
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(1.5)

# Save
img.save("/tmp/test_bw.jpg")
print("Processed image saved to /tmp/test_bw.jpg")
EOF
```

### Test Printer

```bash
# Test print queue
lpstat -p

# Print test image
lp -d PhotoPrinter /tmp/test.jpg

# Check print job status
lpq
```

### Test Full Application

```bash
# Run application manually (with debugging)
cd ~/photobooth
source venv/bin/activate
python3 raspberry_pi/photobooth_main.py

# You should see:
# "Photobooth System initialized successfully"
# "Photobooth main loop started"
```

## Logging

View application logs:

```bash
# Live tail of logs
sudo journalctl -u photobooth -f

# View specific date
sudo journalctl -u photobooth --since "2024-01-01" --until "2024-01-02"

# Parse logs for errors
sudo journalctl -u photobooth -p err
```

## Network Configuration

### Set Static IP

Edit `/etc/dhcpcd.conf`:

```bash
sudo nano /etc/dhcpcd.conf

# Add:
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 1.1.1.1
```

## Performance Optimization

### Enable GPU Memory Split

Edit `/boot/config.txt`:

```bash
sudo nano /boot/config.txt

# Add/modify:
gpu_mem=128
dtoverlay=gpio-poweroff
```

### Optimize Storage

```bash
# Move photos to external SSD (if available)
ln -s /mnt/ssd/photos ~/photobooth/photos

# Enable read-ahead for faster disk I/O
echo 'read_ahead_kb = 2048' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Troubleshooting

### Bluetooth Connection Issues

```bash
# Restart Bluetooth service
sudo systemctl restart bluetooth

# Check HC-05 connection
hcitool con

# Reconnect if needed
sudo rfcomm bind /dev/rfcomm0 <MAC> 1

# Check for permission issues
groups pi
# Should include 'dialout'
sudo usermod -a -G dialout pi
```

### Camera Not Found

```bash
# Check camera connection
libcamera-hello

# If not detected:
sudo raspi-config  # Re-enable camera
sudo reboot

# Check camera module:
vcgencmd get_camera
```

### Printer Not Found

```bash
# List USB devices
lsusb

# Restart CUPS
sudo systemctl restart cups

# Check printer connection
lpstat -p -d

# Add printer manually
lpadmin -p PhotoPrinter -E -v usb://... -m everywhere
```

### Out of Memory

```bash
# Check memory usage
free -h

# Monitor processes
top

# Increase swap space
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean old photos (keep last 30 days)
find ~/photobooth/photos -type f -mtime +30 -delete

# Clean temp files
sudo apt autoclean
sudo apt autoremove
```

## Next Steps

1. Deploy Arduino to booth
2. Start photobooth service
3. Test button and capture workflow
4. Validate image processing quality
5. Verify printer output
6. Set up monitoring and logging

## Additional Resources

- Raspberry Pi Documentation: https://www.raspberrypi.com/documentation/
- PiCamera2 Documentation: https://datasheets.raspberrypi.com/camera/picamera2-manual.pdf
- CUPS Documentation: https://www.cups.org/doc/overview.html
