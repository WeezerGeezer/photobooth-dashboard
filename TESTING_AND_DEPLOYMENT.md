# Photobooth Testing & Deployment Guide

## Pre-Deployment Checklist

### Hardware Verification

- [ ] Arduino Mega 2560 detected on USB port
- [ ] HC-05 Bluetooth module powers on (LED blinking)
- [ ] Button mechanically connected and responds to press
- [ ] LED lights when triggered
- [ ] Camera module connected and detected by Raspberry Pi
- [ ] Flash unit connected and fires (test with multimeter)
- [ ] Photo printer connected via USB and detected
- [ ] All power supplies rated adequately (see requirements)

### Software Prerequisites

- [ ] Arduino IDE installed with Mega 2560 board support
- [ ] Raspberry Pi OS 64-bit installed and up to date
- [ ] Python 3.9+ available on Raspberry Pi
- [ ] Git cloned to `/home/pi/photobooth`
- [ ] Virtual environment created and activated
- [ ] All Python dependencies installed
- [ ] Dashboard server running and accessible
- [ ] PostgreSQL database initialized

## Unit Testing

### Arduino Unit Tests

#### Test 1: Button Debouncing

```bash
# Open Serial Monitor at 9600 baud
# Press button rapidly (10+ times)
# Expected: Each press logged once, no false triggers
# Result: PASS / FAIL
```

#### Test 2: LED Feedback

```bash
# Run serial monitor test
# Observe LED behavior for each state:
#   Initialization (3 blinks)
#   Button press (2 blinks)
#   Countdown (rapid blinking)
#   Photo capture (on during capture)
# Result: PASS / FAIL
```

#### Test 3: Relay Triggering

```bash
# Use multimeter to test relay outputs
# Connect multimeter in series with relay
# Press button and observe:
#   Camera trigger pin goes HIGH for 300ms
#   Flash trigger pin goes HIGH for 200ms
# Result: PASS / FAIL

Test Points:
- Pin 3 (Camera): Should pulse to 5V for 300ms
- Pin 4 (Flash): Should pulse to 5V for 200ms
```

#### Test 4: Bluetooth Communication

```bash
# In Arduino Serial Monitor:
# Type: READY
# Expected: "Received from Pi: READY"

# Type: PRINTING
# Expected: Arduino processes and responds

# Result: PASS / FAIL
```

### Raspberry Pi Unit Tests

#### Test 5: Camera Module

```python
#!/usr/bin/env python3
# Test: Camera initialization and capture

from picamera2 import Picamera2
import time

try:
    picam2 = Picamera2()
    picam2.start()
    time.sleep(2)

    picam2.capture_file("/tmp/camera_test.jpg")
    print("✓ Camera capture successful")

    picam2.close()
except Exception as e:
    print(f"✗ Camera test failed: {e}")

# Expected: /tmp/camera_test.jpg created, readable image
# Result: PASS / FAIL
```

#### Test 6: Image Processing

```python
#!/usr/bin/env python3
# Test: B&W conversion and enhancement

from PIL import Image, ImageOps, ImageEnhance

try:
    # Load test image
    img = Image.open("/tmp/camera_test.jpg")

    # Convert to grayscale
    img = ImageOps.grayscale(img)

    # Enhance
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # Save
    img.save("/tmp/processed_test.jpg")
    print("✓ Image processing successful")

except Exception as e:
    print(f"✗ Image processing failed: {e}")

# Expected: /tmp/processed_test.jpg grayscale image
# Result: PASS / FAIL
```

#### Test 7: Photostrip Generation

```python
#!/usr/bin/env python3
# Test: Create 4-photo strip

from PIL import Image

try:
    # Create test images
    test_images = []
    for i in range(4):
        img = Image.new('L', (280, 280), color=100+i*30)
        img.save(f"/tmp/test_photo_{i+1}.jpg")
        test_images.append(f"/tmp/test_photo_{i+1}.jpg")

    # Create strip
    strip = Image.new('L', (600, 800), color=255)

    for idx, photo_path in enumerate(test_images):
        photo = Image.open(photo_path)
        y_offset = 20 + (idx * 200)
        strip.paste(photo, (160, y_offset))

    strip.save("/tmp/test_photostrip.jpg")
    print("✓ Photostrip generation successful")

except Exception as e:
    print(f"✗ Photostrip generation failed: {e}")

# Expected: /tmp/test_photostrip.jpg with 4 photos stacked
# Result: PASS / FAIL
```

#### Test 8: Bluetooth Communication

```bash
# Open minicom to Bluetooth port
minicom -D /dev/rfcomm0 -b 9600

# Send: READY
# Expected: Arduino receives and logs

# Send: BOOTH_START
# Expected: Python application recognizes message

# Result: PASS / FAIL
```

#### Test 9: Printer Queue

```bash
# Test CUPS printer
lpstat -p

# Submit test print
lp -d PhotoPrinter /tmp/test_photostrip.jpg

# Check job status
lpq

# Verify physical print output
# Result: PASS / FAIL
```

#### Test 10: Dashboard Integration

```python
#!/usr/bin/env python3
# Test: Dashboard client

from raspberry_pi.dashboard_integration import DashboardClient

try:
    client = DashboardClient(
        server_url="http://192.168.1.100:5000",
        booth_id="test-booth-001"
    )

    # Test registration
    if client.register_booth():
        print("✓ Booth registration successful")
    else:
        print("✗ Booth registration failed")

    # Test session
    session_id = client.start_session()
    if session_id:
        print(f"✓ Session started: {session_id}")
    else:
        print("✗ Session start failed")

except Exception as e:
    print(f"✗ Dashboard integration failed: {e}")

# Result: PASS / FAIL
```

## Integration Testing

### Test 11: Button Press → Countdown Sequence

```
Manual Test:
1. Press button on Arduino
2. Observe:
   - Arduino LED blinks countdown
   - Serial monitor shows state changes
   - Bluetooth sends BOOTH_START
   - Pi application receives message
   - Pi logging shows session started

Expected Behavior:
- LED starts rapid blinking
- 3 seconds elapse
- LED stops

Result: PASS / FAIL
```

### Test 12: Single Photo Capture Cycle

```
Manual Test:
1. Press button to start countdown
2. Wait 3 seconds
3. Observe:
   - Flash triggers (brief bright light)
   - Camera shutter operates
   - File created in /home/pi/photobooth/photos/
   - Bluetooth message received on Pi

Expected Result:
- Photo file exists and is readable
- File size > 1MB (full resolution)
- Image appears correctly focused and exposed

Result: PASS / FAIL
```

### Test 13: Full 4-Photo Capture Sequence

```
Manual Test:
1. Press button to start
2. Wait for 3-second countdown
3. Observe all 4 photo captures:
   - Flash fires 4x
   - Camera triggers 4x
   - 1.5 second intervals between photos
   - LED feedback during each capture

Expected Result:
- 4 photo files created
- Each file ~2-3MB
- Timestamps 1.5 seconds apart
- All images properly exposed

Result: PASS / FAIL
```

### Test 14: Image Processing Pipeline

```
Manual Test:
1. Capture 4 photos (Test 13)
2. Wait for processing (~10 seconds)
3. Check /home/pi/photobooth/processing/:
   - 4 processed files created
   - Files are grayscale (B&W)
   - Files are 280x280 pixels
   - Contrast appears enhanced

Expected Result:
- All 4 images processed
- Grayscale appearance correct
- Contrast enhancement visible
- File sizes < 500KB

Result: PASS / FAIL
```

### Test 15: Photostrip Layout & Printing

```
Manual Test:
1. Complete full capture cycle (Test 13)
2. Wait for processing (Test 14)
3. Observe:
   - Pi sends PRINTING message
   - Arduino LED blinks 3x
   - Print job appears in lpq
   - Printer outputs 4x6 photo

Expected Result:
- Photostrip file created in /home/pi/photobooth/output/
- Print job queued successfully
- Physical 4x6 print receives all 4 photos
- Print quality acceptable
- Print time < 30 seconds

Result: PASS / FAIL
```

### Test 16: Dashboard Data Logging

```
Manual Test:
1. Complete full cycle (Tests 13-15)
2. Check Dashboard UI:
   - Booth shows ACTIVE status
   - Photos taken counter incremented
   - Session count incremented
   - Latest session visible in history

Dashboard Verification:
- Visit http://dashboard-ip:3000
- Navigate to booth details
- Verify session logged with 4 photos
- Check timestamp accuracy
- Verify print status recorded

Result: PASS / FAIL
```

## Stress Testing

### Test 17: Rapid Successive Sessions

```
Manual Test:
1. Run 10 consecutive capture cycles
2. Intervals: 2 minutes between cycles
3. Monitor:
   - All captures successful
   - No missed photos
   - Printer queue clears
   - No buffer overflows
   - Dashboard handles load

Expected Result:
- 40 total photos captured
- 40 printed successfully
- System remains responsive
- No error messages

Result: PASS / FAIL
```

### Test 18: Long-Duration Stability

```
Manual Test:
1. Run system continuously for 4 hours
2. Execute captures every 15 minutes
3. Monitor for:
   - Temperature stability
   - Memory usage creep
   - Disk space adequate
   - Bluetooth stability
   - Print queue consistent

Expected Result:
- System stable after 4+ hours
- No memory leaks
- Disk space managed
- No unexpected errors

Result: PASS / FAIL
```

### Test 19: Error Recovery

```
Manual Test:
1. Disconnect Arduino via USB (with Pi running)
2. Observe Pi recovery behavior
3. Reconnect Arduino
4. Attempt capture cycle
5. Verify proper recovery

Expected Result:
- Pi detects disconnection
- Logs error message
- Attempts to reconnect
- Normal operation resumes
- No data loss

Result: PASS / FAIL
```

### Test 20: Printer Error Handling

```
Manual Test:
1. Turn off printer while Pi running
2. Initiate capture cycle
3. Wait for print step
4. Observe error handling
5. Turn printer back on
6. Observe retry/recovery

Expected Result:
- Pi detects printer offline
- Error logged
- Prints when printer available
- No photos lost
- Queue retry successful

Result: PASS / FAIL
```

## Load Testing

### Metrics to Monitor

```
CPU Usage:         Should stay < 75%
Memory Usage:      Should stay < 60%
Disk I/O:          Should handle 10+ photos/min
Disk Space:        Must maintain > 2GB free
Temperature:       Should not exceed 70°C
Network Latency:   < 100ms to dashboard
Bluetooth Signal:  > -70dBm (strong)
```

## Deployment Steps

### 1. Production Setup

```bash
# Clone repository on Raspberry Pi
sudo mkdir -p /home/pi/photobooth
cd /home/pi/photobooth
git clone https://github.com/WeezerGeezer/photobooth-dashboard.git .

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r raspberry_pi/requirements.txt

# Create log directory
mkdir -p /var/log/photobooth
sudo chown pi:pi /var/log/photobooth
```

### 2. Configure Systemd Service

```bash
# Copy service file
sudo cp raspberry_pi/photobooth.service /etc/systemd/system/

# Update permissions
sudo systemctl daemon-reload
sudo systemctl enable photobooth
```

### 3. Configure Arduino

```bash
# Flash Arduino Mega with photobooth_controller.ino
# Using Arduino IDE:
# 1. Select "Arduino Mega 2560" board
# 2. Select correct COM port
# 3. Click Upload
# 4. Verify in Serial Monitor
```

### 4. Configure Bluetooth

```bash
# Pair HC-05 with Raspberry Pi
sudo bluetoothctl
# power on
# discoverable on
# scan on
# pair [MAC_ADDRESS]
# trust [MAC_ADDRESS]
# connect [MAC_ADDRESS]

# Create RFCOMM binding
sudo rfcomm bind /dev/rfcomm0 [MAC_ADDRESS] 1

# Make binding permanent
echo "rfcomm0 [MAC_ADDRESS]" | sudo tee -a /etc/bluetooth/rfcomm.conf
```

### 5. Configure Printer

```bash
# Set up CUPS
sudo systemctl start cups
sudo systemctl enable cups

# Configure printer
# Web interface: http://raspberrypi.local:631
# OR command line:
lpstat -p
lpadmin -p PhotoPrinter -E -v usb://... -m everywhere
```

### 6. Start Service

```bash
# Start photobooth service
sudo systemctl start photobooth

# Check status
sudo systemctl status photobooth

# View logs
sudo journalctl -u photobooth -f
```

### 7. Verify Operation

```bash
# Check all components online
./scripts/health_check.sh

# Test full cycle
./scripts/test_cycle.sh

# Monitor logs
tail -f /var/log/photobooth.log
```

## Post-Deployment Monitoring

### Daily Checks

```bash
# Check system health
systemctl status photobooth

# Check disk space
df -h /home/pi/photobooth

# Check recent sessions
tail -20 /var/log/photobooth.log

# Verify printer status
lpstat -p
```

### Weekly Maintenance

```bash
# Archive old photos (> 30 days)
find /home/pi/photobooth/photos -type f -mtime +30 -exec mv {} /archive/ \;

# Check system resources
free -h
df -h
top -n 1

# Review error logs
grep ERROR /var/log/photobooth.log | tail -20
```

### Monthly Tasks

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Database maintenance (if applicable)
# Backup session logs and metadata

# Test printer calibration
# Print test page

# Full system backup
sudo tar czf /backup/photobooth-$(date +%Y%m%d).tar.gz /home/pi/photobooth
```

## Rollback Procedure

If deployment encounters issues:

```bash
# Stop service
sudo systemctl stop photobooth

# Restore previous version
cd /home/pi/photobooth
git reset --hard [PREVIOUS_COMMIT]

# Restart
sudo systemctl start photobooth

# Verify
sudo systemctl status photobooth
```

## Success Criteria

All systems operational when:

✅ Arduino initializes without errors
✅ Bluetooth connects and communicates
✅ Camera captures high-quality images
✅ Images process to grayscale correctly
✅ Photostrip layouts properly
✅ Printer outputs 4x6 photos
✅ Dashboard receives and logs sessions
✅ Full cycle completes in < 60 seconds
✅ System recovers from disconnections
✅ Temperature stays within limits
✅ No data loss during operations

## Troubleshooting Reference

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to common issues.
