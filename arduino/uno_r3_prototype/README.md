# Canon Rebel Photo Booth - Arduino Uno R3 Prototype

This directory contains the Arduino Uno R3 version for prototyping. Once validated, this can be upgraded to Arduino Mega 2560 for commercial production builds.

## Hardware Configuration

### Arduino Uno R3 Specifications
- **Processor**: ATmega328P
- **Clock**: 16 MHz
- **Voltage**: 5V
- **Flash Memory**: 32KB (program storage)
- **SRAM**: 2KB (runtime memory)
- **EEPROM**: 1KB (persistent storage)
- **GPIO Pins**: 14 digital, 6 analog
- **Serial**: USB UART (CH340 or compatible)
- **SPI**: Built-in SPI interface (Pins 10-13)

### Pin Assignment - Uno R3

| Pin | Function | Connection | Notes |
|-----|----------|-----------|-------|
| **2** | Button Input | Momentary push button | LOW = pressed, pulls to GND |
| **3** | Payment Signal | Payment terminal output | LOW = payment received, pulled HIGH by pullup |
| **4** | Ring Light | Optocoupler LED + | Controls continuous illumination |
| **5** | Strobe Flash | Optocoupler LED + | Controls flash/strobe trigger |
| **6** | Status LED | LED + resistor | Visual feedback (LOW=off, HIGH=on) |
| **7** | USB INT | USB Host Shield | Interrupt signal (optional) |
| **10** | SPI SS | USB Host Shield | Chip Select |
| **11** | SPI MOSI | USB Host Shield | Master Out, Slave In |
| **12** | SPI MISO | USB Host Shield | Master In, Slave Out |
| **13** | SPI SCK | USB Host Shield | Serial Clock |
| **RX** | Serial RX | Main computer | USB UART (via CH340) |
| **TX** | Serial TX | Main computer | USB UART (via CH340) |

### USB Host Shield Connections

The USB Host Shield 2.0 stacks directly on top of the Arduino Uno R3:

```
      USB Host Shield
   ┌─────────────────┐
   │ USB Type-A Port │ ← Connect Canon via USB-A to Mini-B cable
   └────────┬────────┘
            │
    ┌───────┴────────┐
    │                │
  [10,11,12,13]    [7,2,3,4,5,6]
    │                │
    └───────┬────────┘
            │
    Arduino Uno R3 (with USB Host Shield stacked on top)
```

## Wiring Diagram

### Complete Circuit Connections

#### Button Connection
```
GND ─────────┬─────────── 5V (optional: 10kΩ pull-up resistor)
             │
          Button
             │
        Arduino Pin 2
```

#### Payment Signal Connection
```
Payment Terminal Output
        │
        ├──── Optocoupler Input (low active)
        │
   Arduino Pin 3 (INPUT_PULLUP)

Note: Pin 3 has internal pull-up enabled (20kΩ)
Payment terminal pulls LOW when payment successful
```

#### Ring Light Control (Optional: for testing without relay)
```
Arduino Pin 4 ─── 220Ω Resistor ─── PC817 Optocoupler LED (+)
                                          │
                                      Cathode ─── GND

Optocoupler Collector ─── Ring Light Control Signal
Optocoupler Emitter ───── To Ring Light Relay
```

#### Ring Light Control (With Relay Module)
```
Arduino Pin 4 ─┬─ Optocoupler LED (+)
               │
          ┌────┴──── Ring Light Relay Module IN
          │
        GND
```

#### Strobe Flash Control
```
Arduino Pin 5 ─── 220Ω Resistor ─── PC817 Optocoupler LED (+)
                                          │
                                      Cathode ─── GND

Optocoupler Collector ─── Strobe Control Signal
Optocoupler Emitter ───── To Flash Relay
```

#### Status LED Connection
```
Arduino Pin 6 ─── 220Ω Resistor ─── LED (+) ─── Cathode ─── GND

Standard 5mm LED (red or green recommended)
```

## USB Host Shield Installation

1. **Physical Installation**
   - Align USB Host Shield with Arduino headers
   - Gently press down to seat all pins
   - SPI pins (10-13) must align perfectly
   - Verify all connections are secure

2. **Library Installation**
   ```
   Arduino IDE → Sketch → Include Library → Manage Libraries

   Search for and install:
   - "USB Host Shield Library 2.0" by Oleg Mazurov
   - (Canon EOS library may need manual installation)
   ```

3. **Canon EOS Libraries**
   - Manual installation may be required
   - Download from: https://github.com/felis/USB_Host_Shield_2.0
   - Copy canoneos.h and related files to Arduino libraries folder

## Upload Instructions

### 1. Verify USB Connection
```bash
# Linux/Mac
ls /dev/ttyUSB*  or  ls /dev/cu.CH340*

# Windows
Check Device Manager for "USB Serial Port" or similar
```

### 2. Arduino IDE Setup
- **Board**: Arduino Uno
- **Processor**: ATmega328P (or similar)
- **Port**: Select the USB port from above
- **Speed**: 115200 baud (for serial monitor)

### 3. Upload Sketch
- Open: `canon_rebel_uno_r3.ino`
- Click **Verify** button (check for compilation errors)
- Click **Upload** button
- Wait for "Done uploading" message

### 4. Verify Installation
- Open **Serial Monitor** (Tools → Serial Monitor)
- Set baud rate to **115200**
- Should see initialization messages:
  ```
  === Canon Rebel Photo Booth - Arduino Uno R3 Prototype ===
  Initializing system...
  Initializing USB Host Shield...
  USB initialized successfully
  Testing Canon camera connection...
  ```

## Serial Commands (for testing)

Once uploaded, you can send commands via Serial Monitor at 115200 baud:

| Command | Action |
|---------|--------|
| `START` | Start photo booth session |
| `RESET` | Reset to idle state |
| `STATUS` | Report current state |
| `LIGHTS_ON` | Turn on ring light |
| `LIGHTS_OFF` | Turn off ring light |
| `FLASH` | Trigger strobe flash |
| `TEST_CAMERA` | Test Canon connection |
| `HELP` | Show command list |

### Example Serial Monitor Session
```
Type START and press Enter:
>>> BOOTH_START
>>> COUNTDOWN_COMPLETE
>>> TAKING_PHOTO:1
  Capturing photo 1 with Canon Rebel...
  Photo captured successfully (photo #1)
>>> TAKING_PHOTO:2
  ... (repeats for photos 2, 3, 4) ...
>>> PHOTOS_COMPLETE
```

## Testing Checklist

### Hardware Testing
- [ ] Button press triggers input (test with Serial Monitor: "Button pressed")
- [ ] Payment signal input works (ground pin 3 with wire, should trigger)
- [ ] Ring light LED lights up when pin 4 goes HIGH
- [ ] Strobe LED pulses when pin 5 goes HIGH
- [ ] Status LED blinks during countdown
- [ ] USB Host Shield properly seated (no loose pins)

### Camera Testing
- [ ] Canon is powered on
- [ ] Canon is set to "PC Connection" or "PTP" mode
- [ ] USB cable connects Canon properly
- [ ] Serial Monitor shows "CAMERA_READY" on startup
- [ ] Test with `TEST_CAMERA` command

### Full Session Test
- [ ] Send `START` command
- [ ] Watch countdown (3 second LED blink)
- [ ] Hear camera shutter trigger 4 times
- [ ] Ring light turns on during photos
- [ ] Status messages appear in Serial Monitor

## Difference Between Uno R3 and Mega 2560

### Arduino Uno R3 (Prototype)
- **Cost**: ~$25-40
- **GPIO Pins**: 14 digital (need to use them carefully)
- **Analog Pins**: 6
- **Memory**: 32KB Flash, 2KB SRAM
- **SPI Pins**: 10, 11, 12, 13 (must stay available for USB Host Shield)
- **Best For**: Prototyping, testing, validation
- **Limitation**: Limited expansion capability

### Arduino Mega 2560 (Production)
- **Cost**: ~$40-60
- **GPIO Pins**: 54 digital (plenty available)
- **Analog Pins**: 16
- **Memory**: 256KB Flash, 8KB SRAM
- **SPI Pins**: 50, 51, 52, 53 (different from Uno)
- **Best For**: Commercial, with extra features
- **Advantage**: Room for additional features/sensors

### Upgrade Path
When upgrading from Uno R3 to Mega 2560:
1. Pin numbers change (SPI moves from 10-13 to 50-53)
2. Use `#define` statements to make easy port
3. Mega version can support additional buttons, sensors, displays
4. See `arduino/canon_rebel_controller.ino` for Mega version

## Memory Considerations

### Uno R3 Memory Usage
The prototype uses approximately:
- **Flash (Program Memory)**: ~18KB of 32KB (56% used)
  - Arduino core: ~2KB
  - USB Host library: ~8KB
  - Canon EOS library: ~5KB
  - Sketch code: ~3KB

**Remaining**: ~14KB for future features

- **SRAM (Runtime Memory)**: ~1.2KB of 2KB (60% used)
  - Global variables: ~800 bytes
  - Function stack: ~400 bytes

**Remaining**: ~800 bytes for additional data

### Optimization Tips for Uno R3
If you need to add features:
1. Use `const` instead of variable declarations
2. Store strings in PROGMEM (program memory)
3. Avoid large arrays or complex data structures
4. Keep function calls minimal in loops
5. Consider Mega 2560 if adding significant features

## Troubleshooting

### Arduino IDE Won't Connect
- Check USB cable (some cables are charge-only)
- Install CH340 drivers (for clones without FTDI)
- Try different USB port
- Restart Arduino IDE

### "USB initialization failed" Message
- Verify USB Host Shield is properly seated
- Check all SPI pins (10, 11, 12, 13) are connected
- Try restarting Arduino
- Check USB Host Shield orientation

### Camera Not Detected
- Verify camera is powered on
- Set camera to "PC Connection" or "PTP" mode
- Check Canon camera mode (review/playback won't work)
- Try different USB cable
- Verify cable goes directly to USB Host Shield, not Arduino

### Button Not Triggering
- Check pin 2 is connected to button
- Verify button pulls pin LOW when pressed (not HIGH)
- Test with Serial Monitor command instead
- Check for loose connections

### Ring Light / Strobe Not Working
- Verify relay module is powered independently
- Check optocoupler connections
- Test relay directly with 5V power
- Verify relay can handle the load

## Schematic Reference

For complete schematic details, see:
- `arduino-controller/README.md` - Detailed circuit diagrams
- Parent directory `canon_rebel_controller.ino` - Comments with full pin mapping

## Production Upgrade

To upgrade to Arduino Mega 2560:
1. See `../canon_rebel_controller.ino` (Mega version)
2. Change board type in Arduino IDE
3. Update SPI pin numbers if using different shield
4. Test thoroughly before deployment

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Button Response | <100ms | Debounce delay: 50ms |
| Countdown Duration | 3000ms | Adjustable via constant |
| Photo Interval | 1500ms | Adjustable via constant |
| Strobe Pulse | 100ms | Adjustable via constant |
| Loop Cycle | ~10ms | USB task + state machine |
| Serial Baud Rate | 115200 | Standard high-speed |

## Files in This Directory

- `canon_rebel_uno_r3.ino` - Main sketch (upload this)
- `README.md` - This file
- `WIRING_DIAGRAM.txt` - ASCII wiring reference (optional)

## Next Steps

1. **Assemble prototype hardware** following wiring diagram above
2. **Install USB Host Shield library** in Arduino IDE
3. **Upload `canon_rebel_uno_r3.ino`** sketch
4. **Test all components** using Serial Monitor commands
5. **Connect actual Canon camera** and test capture
6. **Validate complete workflow** (button → photos → printer)
7. **Once validated**, upgrade to Mega 2560 for production

## Support & Documentation

- Arduino Uno R3 Docs: https://docs.arduino.cc/hardware/uno-rev3
- USB Host Shield: https://github.com/felis/USB_Host_Shield_2.0
- Canon EOS PTP: https://en.wikipedia.org/wiki/Picture_Transfer_Protocol

## Version History

- **v1.0** - Arduino Uno R3 Prototype (Oct 2024)
  - Initial release for prototyping
  - 4-photo capture sequence
  - Ring light and strobe control
  - Payment integration ready
  - Memory: 56% Flash, 60% SRAM used
