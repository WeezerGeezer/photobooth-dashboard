# Arduino Photo Booth Controller

This directory contains the Arduino code for controlling the photo booth hardware components, including the Canon Rebel DSLR camera, lighting system, and integration with the payment processing system.

## Overview

The Arduino controller acts as the hardware interface layer between the main computer and the physical photo booth components. It receives signals from the payment processing system and main computer, then triggers the camera, controls lighting, and manages other electronic components.

## System Architecture

```
Main Computer (Dashboard)
    ↓ Serial/USB Communication
Arduino Controller
    ↓ Multiple I/O Connections
    ├── Canon Rebel DSLR (USB/Wired Trigger)
    ├── Lighting System (Relay/Optocoupler)
    ├── Payment Terminal (Serial Communication)
    └── Printer Interface (Optional)
```

## Canon Rebel DSLR Control Methods

### Method 1: USB Control with PTP Protocol (Recommended for Full Control)

This method provides complete control over camera settings including shutter speed, aperture, ISO, and remote shutter triggering.

**Hardware Required:**
- Arduino Mega 2560 or Arduino Uno
- USB Host Shield 2.0
- USB cable to connect camera

**Software Libraries:**
- [USB_Host_Shield_2.0](https://github.com/felis/USB_Host_Shield_2.0)
- [PTP_2.0](https://github.com/felis/PTP_2.0) - Picture Transfer Protocol library

**Capabilities:**
- Read and change camera settings (ISO, aperture, shutter speed)
- Trigger shutter remotely
- Download images to Arduino/SD card
- Full PTP protocol support

**Supported Canon Models:**
- Canon EOS Rebel series (T2i, T3i, T4i, T5i, T6i, etc.)
- Canon EOS 400D, 450D, 7D, 5D series
- Most Canon cameras with USB connectivity

**Example Usage:**
```cpp
#include <canoneos.h>
#include <usbhub.h>

USB Usb;
CanonEOS Eos(&Usb);

void setup() {
    Serial.begin(115200);
    if (Usb.Init() == -1) {
        Serial.println("USB init failed");
    }
}

void loop() {
    Usb.Task();

    // Check for payment signal, then trigger camera
    if (paymentReceived()) {
        Eos.Capture();  // Take photo
    }
}
```

### Method 2: Wired Shutter Trigger (Simple, Reliable)

This method uses a simple optocoupler to electrically trigger the camera shutter without direct electrical connection to the Arduino.

**Hardware Required:**
- Arduino (any model)
- PC817 Optocoupler (recommended for isolation)
- 2.5mm or 3.5mm stereo jack (matching your Canon camera's remote port)
- 220Ω resistor
- Optional: transistor (2N3904 or similar)

**How It Works:**
- Canon Rebel cameras have ~3.3V floating on the shutter pin
- Shutter activates when the pin is pulled low to ground
- Half-press (focus): Short pin to ground
- Full-press (shutter): Short both focus and shutter pins to ground

**Pin Configuration (2.5mm Jack):**
- Tip: Focus
- Ring: Shutter
- Sleeve: Ground

**Circuit Diagram:**
```
Arduino Digital Pin → 220Ω Resistor → PC817 LED (+)
GND → PC817 LED (-)
PC817 Collector → Camera Focus Pin
PC817 Emitter → Camera Ground Pin
```

**Example Code:**
```cpp
const int SHUTTER_PIN = 7;
const int FOCUS_PIN = 6;

void setup() {
    pinMode(SHUTTER_PIN, OUTPUT);
    pinMode(FOCUS_PIN, OUTPUT);
    digitalWrite(SHUTTER_PIN, LOW);
    digitalWrite(FOCUS_PIN, LOW);
}

void takePhoto() {
    // Half-press to focus
    digitalWrite(FOCUS_PIN, HIGH);
    delay(500);  // Wait for autofocus

    // Full-press to capture
    digitalWrite(SHUTTER_PIN, HIGH);
    delay(100);  // Shutter trigger time

    // Release
    digitalWrite(SHUTTER_PIN, LOW);
    digitalWrite(FOCUS_PIN, LOW);
}
```

### Method 3: Infrared (IR) Remote Trigger

Uses an IR LED to send remote control signals to the camera, mimicking Canon's wireless remotes.

**Hardware Required:**
- Arduino (any model)
- IR LED (940nm recommended)
- 220Ω resistor
- Optional: 2N2222 transistor for more power

**Libraries:**
- [multiCameraIrControl](https://github.com/sebastianneubert/multiCameraIrControl)

**Advantages:**
- No wired connection needed
- Can trigger multiple cameras simultaneously
- Simple, low-cost implementation

**Disadvantages:**
- Requires line of sight
- Limited range (~5 meters)
- Cannot read/change camera settings

## Payment Processing Integration

### Architecture

```
Payment Terminal → Serial/TTL Communication → Arduino → Signal to Main Computer
```

### Supported Payment Methods

#### Option 1: NFC/Contactless Card Reader
**Hardware:** PN532 NFC Module
- Reads contactless credit/debit cards
- Supports NFC payment protocols
- Serial UART communication with Arduino
- Library: Adafruit_PN532

#### Option 2: Magnetic Stripe Reader
**Hardware:** 90mm dual-head magnetic card reader
- Reads magnetic stripe cards
- Self-clocking strobe signal
- TTL serial output

#### Option 3: Integration with Commercial Payment Terminal
**Hardware:** Standard payment terminal with serial output
- Example: USA Tech ePort
- Sends success signal as electrical pulse
- Arduino converts to serial command for main computer

### Payment Flow

1. Customer initiates payment on terminal
2. Payment terminal processes transaction
3. On successful payment:
   - Terminal sends signal to Arduino (via serial/GPIO)
   - Arduino validates signal
   - Arduino sends confirmation to main computer via USB serial
   - Main computer enables photo booth session
   - Arduino receives trigger command
   - Arduino activates camera and lighting sequence

### Example Payment Integration Code

```cpp
#include <SoftwareSerial.h>

SoftwareSerial paymentSerial(10, 11); // RX, TX
const int PAYMENT_SUCCESS_PIN = 2;
bool paymentReceived = false;

void setup() {
    Serial.begin(115200);  // Communication with main computer
    paymentSerial.begin(9600);  // Communication with payment terminal
    pinMode(PAYMENT_SUCCESS_PIN, INPUT_PULLUP);
}

void loop() {
    // Check for payment success signal (digital input)
    if (digitalRead(PAYMENT_SUCCESS_PIN) == LOW) {
        paymentReceived = true;
        Serial.println("PAYMENT_SUCCESS");
    }

    // Or check serial data from payment terminal
    if (paymentSerial.available()) {
        String msg = paymentSerial.readStringUntil('\n');
        if (msg.indexOf("SUCCESS") >= 0) {
            paymentReceived = true;
            Serial.println("PAYMENT_SUCCESS");
        }
    }

    // Wait for trigger command from main computer
    if (Serial.available() && paymentReceived) {
        String cmd = Serial.readStringUntil('\n');
        if (cmd == "TRIGGER_CAMERA") {
            takePhoto();
            paymentReceived = false;  // Reset for next session
        }
    }
}
```

## Lighting Control

### Optocoupler-Based Relay Control

For safe, isolated control of AC-powered lighting (ring lights, studio strobes, etc.)

**Hardware:**
- MOC3021 or similar opto-triac (for AC loads)
- PC817 optocoupler + mechanical relay (for DC loads)
- Appropriate relay rated for load

**Safety Features:**
- Electrical isolation between Arduino and high-voltage circuits
- Prevents damage to Arduino from power surges
- 10-20x less power consumption than electromechanical relays

```cpp
const int RING_LIGHT_PIN = 8;
const int STROBE_PIN = 9;

void setupLighting() {
    pinMode(RING_LIGHT_PIN, OUTPUT);
    pinMode(STROBE_PIN, OUTPUT);
}

void triggerLighting() {
    digitalWrite(RING_LIGHT_PIN, HIGH);  // Turn on ring light
    delay(500);  // Let subject see the light
    digitalWrite(STROBE_PIN, HIGH);  // Flash strobe
    delay(50);
    digitalWrite(STROBE_PIN, LOW);
}
```

## Communication Protocol with Main Computer

The Arduino communicates with the main computer via USB serial connection using a simple text-based protocol.

### Commands FROM Main Computer TO Arduino

| Command | Description |
|---------|-------------|
| `TRIGGER_CAMERA` | Take a photo with camera |
| `LIGHTS_ON` | Turn on continuous lighting |
| `LIGHTS_OFF` | Turn off continuous lighting |
| `FLASH` | Trigger flash/strobe |
| `STATUS` | Request Arduino status |
| `RESET` | Reset payment flag |

### Messages FROM Arduino TO Main Computer

| Message | Description |
|---------|-------------|
| `PAYMENT_SUCCESS` | Payment terminal confirmed successful payment |
| `CAMERA_READY` | Camera is connected and ready |
| `PHOTO_TAKEN` | Photo capture completed |
| `ERROR:msg` | Error message |
| `STATUS:OK` | Status response |

## Hardware Requirements

### Minimum Configuration
- Arduino Mega 2560 (recommended) or Uno
- USB Host Shield 2.0
- PC817 Optocoupler (x2-3)
- 220Ω resistors
- Relay module (for lighting)
- Connecting wires
- 2.5mm/3.5mm stereo jack (for wired trigger backup)

### Recommended Configuration
- Arduino Mega 2560 (for more GPIO and memory)
- USB Host Shield 2.0
- PN532 NFC module (for payment)
- MOC3021 opto-triac (for AC lighting)
- 5V relay module (4-channel)
- Power supply (5V 2A minimum)

## Pin Assignments (Example Configuration)

```
Digital Pin 2  - Payment Success Input
Digital Pin 6  - Camera Focus Trigger (wired backup)
Digital Pin 7  - Camera Shutter Trigger (wired backup)
Digital Pin 8  - Ring Light Control
Digital Pin 9  - Strobe/Flash Control
Digital Pin 10 - Payment Terminal RX (SoftwareSerial)
Digital Pin 11 - Payment Terminal TX (SoftwareSerial)
Digital Pin 12 - Status LED
Digital Pin 13 - Error LED

USB Host Shield uses standard SPI pins:
- Pin 10: SS
- Pin 11: MOSI
- Pin 12: MISO
- Pin 13: SCK
- Pin 9: INT (depends on shield)
```

## Getting Started

1. **Install Arduino IDE** (version 1.8.19 or newer)

2. **Install Required Libraries:**
   ```
   Sketch → Include Library → Manage Libraries

   Search and install:
   - USB Host Shield Library 2.0
   - PTP_2.0 (manual install from GitHub)
   - Adafruit_PN532 (if using NFC)
   ```

3. **Connect Hardware:**
   - Attach USB Host Shield to Arduino
   - Connect Canon camera via USB to the shield
   - Wire optocouplers/relays for lighting
   - Connect payment terminal if applicable

4. **Upload Test Sketch:**
   - Start with basic examples from PTP_2.0 library
   - Test camera connection and control
   - Add payment and lighting control incrementally

5. **Test Communication:**
   - Open Serial Monitor (115200 baud)
   - Send test commands
   - Verify responses

## Troubleshooting

### Camera Not Detected
- Check USB connections
- Verify camera is in "PC Connection" or "PTP" mode (check camera menu)
- Ensure USB Host Shield libraries are installed correctly
- Try different USB cable

### Payment Terminal Not Responding
- Check serial baud rate matches terminal settings
- Verify TX/RX connections (TX→RX, RX→TX)
- Test terminal independently

### Lighting Not Triggering
- Verify optocoupler polarity
- Check relay power supply
- Test with LED first before connecting high-power lights

## Resources

- [USB Host Shield Library](https://github.com/felis/USB_Host_Shield_2.0)
- [PTP 2.0 Library](https://github.com/felis/PTP_2.0)
- [Circuits@Home - Camera Control Tutorials](https://chome.nerpa.tech/camera-control/)
- [Arduino Forum - Camera Control](https://forum.arduino.cc/)

## Safety Notes

- Always use optocouplers/optotriacs for AC lighting control
- Properly isolate high-voltage circuits from Arduino
- Use appropriate fuses and circuit protection
- Follow local electrical codes for AC wiring
- Never connect Arduino GPIO directly to AC power
- Test with low-voltage/low-power components first

## Future Enhancements

- [ ] WiFi/Bluetooth connectivity (ESP32 integration)
- [ ] Direct printer control
- [ ] Multi-camera support
- [ ] Advanced lighting sequences
- [ ] Touch screen interface
- [ ] Image preview on LCD
- [ ] SD card storage
- [ ] Battery backup system
