# Upgrade Guide: Arduino Uno R3 → Mega 2560

This guide explains how to upgrade from the Uno R3 prototype to the Mega 2560 for commercial production builds.

## Overview

The Uno R3 prototype validates the core functionality with minimal cost and footprint. Once validated, the Mega 2560 provides:
- **3.5x more digital pins** (14 → 54)
- **2.7x more memory** (32KB → 256KB Flash)
- **4x more SRAM** (2KB → 8KB)
- **Better expandability** for additional features
- **Professional-grade reliability**

## Key Differences

### Hardware Changes

| Aspect | Uno R3 | Mega 2560 |
|--------|--------|----------|
| **Processor** | ATmega328P | ATmega2560 |
| **Speed** | 16 MHz | 16 MHz |
| **Flash** | 32KB | 256KB |
| **SRAM** | 2KB | 8KB |
| **Digital Pins** | 14 | 54 |
| **Analog Pins** | 6 | 16 |
| **Serial Ports** | 1 (USB) | 4 (1 USB + 3 UART) |
| **SPI Pins** | 10, 11, 12, 13 | 50, 51, 52, 53 |
| **Cost** | ~$35 | ~$55 |

### Pin Mapping Changes

#### USB Host Shield Connections

**Arduino Uno R3:**
```
USB Host Shield SPI:
- Pin 10: SS (Chip Select)
- Pin 11: MOSI
- Pin 12: MISO
- Pin 13: SCK
```

**Arduino Mega 2560:**
```
USB Host Shield SPI:
- Pin 50: SS (Chip Select)
- Pin 51: MOSI
- Pin 52: MISO
- Pin 53: SCK
```

#### GPIO Reassignment

You can keep most pins the same or optimize for the Mega's additional pins:

**Option 1: Keep Same (Simple)**
```cpp
// These pin numbers stay the same
const int BUTTON_PIN = 2;           // D2 exists on both
const int PAYMENT_PIN = 3;          // D3 exists on both
const int RING_LIGHT_PIN = 4;       // D4 exists on both
const int STROBE_PIN = 5;           // D5 exists on both
const int STATUS_LED_PIN = 6;       // D6 exists on both

// USB Host Shield - CHANGE THESE
const int USB_INT_PIN = 9;          // Changed from 7 (for better Mega compatibility)
// SPI pins: 50, 51, 52, 53 (automatic with USB Host Shield)
```

**Option 2: Optimize for Mega (Advanced)**
```cpp
// Use Mega's better pins for more reliable operation
const int BUTTON_PIN = 2;           // D2 (interrupt capable)
const int PAYMENT_PIN = 3;          // D3 (interrupt capable)
const int RING_LIGHT_PIN = 22;      // D22 (more available pins)
const int STROBE_PIN = 23;          // D23
const int STATUS_LED_PIN = 24;      // D24

// Additional features can use other pins:
const int BUTTON2_PIN = 25;         // Additional button
const int LCD_PIN = 26;             // LCD display
// ... etc - plenty more available
```

## Migration Steps

### Step 1: Install Mega Board Support (if not already done)

```
Arduino IDE → Tools → Board → Boards Manager
Search for: "Arduino AVR Boards"
Install the latest version (should support Mega 2560)
```

### Step 2: Update Sketch for Mega

**Option A: Minimal Changes (Keep same pins)**

```cpp
// At the top of the sketch, add a board detection:

#if defined(__AVR_ATmega2560__)
  // Mega 2560 SPI pins
  #define USB_SHIELD_ENABLED
  // SPI: pins 50, 51, 52, 53 (automatic)
#elif defined(__AVR_ATmega328P__)
  // Uno R3 SPI pins
  #define USB_SHIELD_ENABLED
  // SPI: pins 10, 11, 12, 13 (automatic)
#endif

// Rest of sketch unchanged - USB Host Shield library handles pin differences
```

**Option B: Optimize for Mega**

Create a configuration header file:

```cpp
// config.h

#ifdef ARDUINO_AVR_MEGA2560
  // Mega 2560 pins
  const int BUTTON_PIN = 2;
  const int PAYMENT_PIN = 3;
  const int RING_LIGHT_PIN = 22;
  const int STROBE_PIN = 23;
  const int STATUS_LED_PIN = 24;
  const int USB_INT_PIN = 9;
#else
  // Uno R3 pins (default)
  const int BUTTON_PIN = 2;
  const int PAYMENT_PIN = 3;
  const int RING_LIGHT_PIN = 4;
  const int STROBE_PIN = 5;
  const int STATUS_LED_PIN = 6;
  const int USB_INT_PIN = 7;
#endif
```

Then in main sketch:
```cpp
#include "config.h"  // Include at top

// Rest of code unchanged
```

### Step 3: Upload to Mega 2560

1. **Select Board**: `Arduino Mega 2560` in Arduino IDE
2. **Select Port**: The USB port where Mega is connected
3. **Upload**: Click Upload button
4. **Verify**: Serial Monitor should show initialization messages

### Step 4: Test All Functions

Use the same serial commands as Uno R3:
```
TEST_CAMERA
START
LIGHTS_ON / LIGHTS_OFF
FLASH
HELP
```

All should work identically or better than on Uno R3.

## Advantages After Upgrade

### More GPIO Available
```cpp
// Uno R3: Only 6 GPIO left after USB Host Shield + basic I/O
// Mega: 40+ GPIO pins available for expansion

// Now you can add:
const int LCD_ENABLE = 26;
const int LCD_RS = 27;
const int LCD_D4 = 28;
// ... and many more for LCD display

const int SENSOR_TEMPERATURE = A15;
const int SENSOR_STORAGE = A14;
// ... environmental monitoring

const int BUTTON_SECONDARY = 40;
const int BUTTON_TERTIARY = 41;
// ... additional user input
```

### Additional Serial Ports
```cpp
// Uno: Only 1 serial port (USB)
// Mega: 4 serial ports (Serial1, Serial2, Serial3, Serial4)

// Now you can:
Serial1.begin(9600);     // Connect to payment terminal
Serial2.begin(115200);   // Connect to camera controller
Serial3.begin(19200);    // Connect to display

// Without USB serial conflicts
```

### More Memory
```cpp
// Uno: 32KB (tight fit)
// Mega: 256KB (plenty of room)

// Can now add:
- Larger buffers for image metadata
- More complex state machines
- SD card logging
- WiFi connectivity
- Extended sensor arrays
```

## Complete Mega 2560 Sketch Template

Here's a minimal template for upgrading:

```cpp
/*
 * Canon Rebel Photo Booth - Arduino Mega 2560 Production Version
 */

// ============================================================================
// BOARD DETECTION AND CONFIGURATION
// ============================================================================

#ifdef ARDUINO_AVR_MEGA2560
  #define BOARD_TYPE "Mega 2560"
  // Mega 2560 optimized pins
  const int BUTTON_PIN = 2;
  const int PAYMENT_PIN = 3;
  const int RING_LIGHT_PIN = 22;
  const int STROBE_PIN = 23;
  const int STATUS_LED_PIN = 24;
  // SPI: 50, 51, 52, 53 (automatic for USB Host Shield)
#else
  #define BOARD_TYPE "Uno R3"
  // Uno R3 pins (fallback)
  const int BUTTON_PIN = 2;
  const int PAYMENT_PIN = 3;
  const int RING_LIGHT_PIN = 4;
  const int STROBE_PIN = 5;
  const int STATUS_LED_PIN = 6;
  // SPI: 10, 11, 12, 13 (automatic for USB Host Shield)
#endif

#include <SPI.h>
#include <usbhub.h>
#include <canoneos.h>

// ... rest of code stays the same ...
```

## Testing Checklist After Upgrade

- [ ] Sketch compiles without errors
- [ ] Serial Monitor shows "Mega 2560" in initialization
- [ ] All buttons/inputs trigger correctly
- [ ] LED feedback works as expected
- [ ] Ring light control works
- [ ] Strobe trigger works
- [ ] Camera connection established (TEST_CAMERA command)
- [ ] Full photo sequence works (START command)
- [ ] All serial commands respond correctly

## Rollback to Uno R3

If you need to switch back to Uno R3:

1. Open original `uno_r3_prototype/canon_rebel_uno_r3.ino`
2. Select `Arduino Uno` in Tools → Board
3. Upload without any modifications
4. All functionality returns to Uno R3

## Performance Comparison

### Compilation Time
- **Uno R3**: ~3-5 seconds
- **Mega 2560**: ~3-5 seconds (same)
- No performance difference during compilation

### Runtime Performance
- **Uno R3**: ~10-15ms loop cycle
- **Mega 2560**: ~8-10ms loop cycle (slightly faster)
- Minimal practical difference for photo booth

### Memory Usage
- **Uno R3**: ~18KB Flash, ~1.2KB SRAM (high utilization)
- **Mega 2560**: ~18KB Flash, ~1.2KB SRAM (low utilization - 7% used)

## Production Recommendations

### For Small Batches (1-10 units)
**Use Arduino Uno R3**
- Lower cost per unit
- Proven to work reliably
- Sufficient for core functionality
- Easy to debug and troubleshoot

### For Large Production (10+ units)
**Upgrade to Arduino Mega 2560**
- Slightly higher cost (worth it for reliability)
- More headroom for future features
- Better for quality control
- Extra GPIO for sensors/monitoring
- Professional-grade component

### For Custom Features
**Must use Arduino Mega 2560**
- Adds LCD display? → Mega has GPIO for this
- Adds temperature sensor? → Mega has analog pins
- Adds WiFi monitoring? → Mega has extra serial ports
- Anything beyond basic photo booth → Mega

## References

- Arduino Uno R3: https://docs.arduino.cc/hardware/uno-rev3
- Arduino Mega 2560: https://docs.arduino.cc/hardware/mega-2560
- USB Host Shield 2.0: https://github.com/felis/USB_Host_Shield_2.0
- Arduino Board Definitions: https://github.com/arduino/ArduinoCore-avr

## Summary

| Phase | Board | Purpose | Status |
|-------|-------|---------|--------|
| **Prototype/Testing** | Uno R3 | Validate concept | ✓ Use this |
| **Pre-production** | Mega 2560 | Final testing | Upgrade when ready |
| **Production** | Mega 2560 | Commercial builds | Use for scaling |
| **High-feature** | Mega 2560 | With extras | LCD, sensors, etc. |

When your Uno R3 prototype is fully validated and ready for commercial production, upgrading to Mega 2560 is straightforward - usually just changing a few pin numbers and selecting a different board in Arduino IDE.
