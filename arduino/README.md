# Arduino Photo Booth Controller

This directory contains Arduino sketches for controlling the Canon Rebel photo booth system. Two versions are provided for different project phases.

## Version Selection

### Arduino Uno R3 (Prototype)
**Directory**: `uno_r3_prototype/`
**File**: `canon_rebel_uno_r3.ino`

**Use this for:**
- ✅ Prototyping and testing
- ✅ Validating core functionality
- ✅ Budget-conscious development
- ✅ Learning and experimentation
- ✅ Small batch production (1-5 units)

**Advantages:**
- Low cost (~$35 + USB Host Shield)
- Minimal footprint
- Fast to develop and test
- All core features included
- Memory sufficient for basic operation

**Limitations:**
- Limited GPIO pins (14 total)
- Limited SRAM (2KB)
- No room for additional sensors
- Only 1 serial port
- Limited expandability

**Setup Guide**: See `uno_r3_prototype/README.md`

---

### Arduino Mega 2560 (Production)
**File**: `canon_rebel_controller.ino`

**Use this for:**
- ✅ Production builds (10+ units)
- ✅ Commercial deployments
- ✅ Systems with additional features
- ✅ Future sensor expansion
- ✅ Professional reliability requirements

**Advantages:**
- More GPIO pins (54 total)
- More SRAM (8KB)
- Extra serial ports (4 total)
- Better performance
- Professional-grade reliability
- Room for features/sensors

**Limitations:**
- Slightly higher cost (~$55)
- Larger physical size
- May be overkill for simple prototypes

**Setup Guide**: See parent directory documentation + `UPGRADE_UNO_TO_MEGA.md`

---

## Quick Decision Matrix

| Need | Uno R3 | Mega 2560 |
|------|--------|----------|
| **Prototyping** | ✅ Best | ❌ Overkill |
| **Testing concept** | ✅ Best | ❌ Overkill |
| **Production (1-5 units)** | ✅ Fine | ❌ Overkill |
| **Production (10+ units)** | ❌ Tight | ✅ Best |
| **Adding sensors** | ❌ Limited | ✅ Easy |
| **Adding LCD display** | ❌ Hard | ✅ Easy |
| **Adding WiFi** | ❌ No | ✅ Possible |
| **Cost sensitive** | ✅ Yes | ❌ No |
| **Reliability critical** | ❌ Adequate | ✅ Better |

---

## Pin Configuration Comparison

### Basic I/O Pins

| Function | Uno R3 | Mega 2560 |
|----------|--------|----------|
| **Button Input** | Pin 2 | Pin 2 |
| **Payment Signal** | Pin 3 | Pin 3 |
| **Ring Light** | Pin 4 | Pin 22 |
| **Strobe Flash** | Pin 5 | Pin 23 |
| **Status LED** | Pin 6 | Pin 24 |

### USB Host Shield (Camera)

| Pin | Uno R3 | Mega 2560 |
|-----|--------|----------|
| **SS** | Pin 10 | Pin 50 |
| **MOSI** | Pin 11 | Pin 51 |
| **MISO** | Pin 12 | Pin 52 |
| **SCK** | Pin 13 | Pin 53 |

⚠️ **Important**: USB Host Shield library automatically detects the board and uses correct SPI pins. No code changes needed for these pins.

---

## Hardware Requirements

### Both Versions Need:
- Arduino board (Uno R3 or Mega 2560)
- USB Host Shield 2.0
- USB cable (A to Mini-B for Canon connection)
- USB-B to USB-A cable (Arduino to computer)

### For Lighting Control:
- PC817 Optocouplers (2x)
- 5V Relay Module (2x or 4-channel)
- 220Ω resistors (2x)

### For User Interface:
- Momentary push button (60mm arcade button recommended)
- 5mm LED (for status indicator)
- 220Ω resistor (for LED)

### Optional (Uno R3 Expansion, Required for Mega):
- Sensors for monitoring
- LCD/OLED display
- Additional buttons
- WiFi shield/module

---

## Installation & Upload

### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 2. Install Board Support
- Arduino IDE → Tools → Board Manager
- Search: "Arduino AVR Boards"
- Install latest version

### 3. Install USB Host Shield Library
- Arduino IDE → Sketch → Include Library → Manage Libraries
- Search: "USB Host Shield Library 2.0"
- Install by Oleg Mazurov

### 4. Open Sketch
- File → Open
- Choose either:
  - `uno_r3_prototype/canon_rebel_uno_r3.ino` (for Uno R3)
  - `canon_rebel_controller.ino` (for Mega 2560)

### 5. Select Board
- Tools → Board → Choose appropriate board:
  - `Arduino Uno` (for Uno R3)
  - `Arduino Mega 2560` (for Mega 2560)

### 6. Select Port
- Tools → Port → Choose USB port where Arduino is connected

### 7. Upload
- Click Upload button (→)
- Wait for "Done uploading" message

---

## Testing with Serial Monitor

Once uploaded, open Serial Monitor to test:

1. **Open Serial Monitor**: Tools → Serial Monitor
2. **Set Baud Rate**: 115200
3. **Send Commands**: Type command and press Enter

### Available Commands:
```
START          - Start photo booth session
RESET          - Reset to idle state
STATUS         - Report current state
LIGHTS_ON      - Turn on ring light
LIGHTS_OFF     - Turn off ring light
FLASH          - Trigger strobe flash
TEST_CAMERA    - Test Canon camera connection
HELP           - Show command help
```

### Example Session:
```
>>> START
>>> COUNTDOWN_COMPLETE
>>> TAKING_PHOTO:1
  Capturing photo 1 with Canon Rebel...
  Photo captured successfully (photo #1)
>>> TAKING_PHOTO:2
  ... (photos 2, 3, 4) ...
>>> PHOTOS_COMPLETE
```

---

## Upgrade Path

When ready to move from prototype to production:

1. **Validate with Uno R3**: Confirm all functionality works
2. **Review Requirements**: Decide if you need extra features
3. **Choose Upgrade**:
   - If simple operation → Stay with Uno R3
   - If commercial scale → Upgrade to Mega 2560
4. **Follow Guide**: See `UPGRADE_UNO_TO_MEGA.md` for detailed steps
5. **Test Thoroughly**: Run same tests on Mega 2560 to verify

---

## Memory Usage

### Arduino Uno R3
```
Flash Memory:  ~18KB / 32KB used (56%)
SRAM:          ~1.2KB / 2KB used (60%)
Remaining:     ~14KB Flash, ~800B SRAM
```
*Limited room for additional features*

### Arduino Mega 2560
```
Flash Memory:  ~18KB / 256KB used (7%)
SRAM:          ~1.2KB / 8KB used (15%)
Remaining:     ~238KB Flash, ~6.8KB SRAM
```
*Plenty of room for future expansion*

---

## Troubleshooting

### Arduino Won't Upload
- Check USB cable (some are charge-only)
- Install CH340 drivers (for Arduino clones)
- Try different USB port
- Restart Arduino IDE

### Camera Not Detected
- Verify USB Host Shield is properly seated
- Check SPI pins are connected
- Ensure camera is in "PC Connection" mode
- Try different USB cable

### Serial Monitor Shows Errors
- Check baud rate is 115200
- Verify USB connection is stable
- Try unplugging/replugging Arduino

See detailed troubleshooting in the version-specific README files.

---

## Files in This Directory

```
arduino/
├── README.md                          # This file
├── canon_rebel_controller.ino         # Mega 2560 production version
├── UPGRADE_UNO_TO_MEGA.md            # Upgrade guide
└── uno_r3_prototype/
    ├── README.md                      # Uno R3 setup guide
    └── canon_rebel_uno_r3.ino        # Uno R3 prototype version
```

---

## Development Workflow

### Phase 1: Prototype (Uno R3)
```
Hardware Assembly
    ↓
Upload Uno R3 sketch
    ↓
Test with Serial Monitor commands
    ↓
Connect real Canon camera
    ↓
Validate full photo workflow
    ↓
Document any issues/learnings
```

### Phase 2: Validation (Uno R3 → Mega 2560)
```
Core functionality proven on Uno R3
    ↓
Decide if upgrade needed
    ↓
If NO → Proceed with Uno R3 production
    ↓
If YES → Follow UPGRADE_UNO_TO_MEGA.md
    ↓
Test on Mega 2560
    ↓
Validate identical functionality
    ↓
Proceed with production builds
```

---

## Performance Specifications

| Metric | Uno R3 | Mega 2560 |
|--------|--------|----------|
| **Response Time** | <100ms | <100ms |
| **Countdown** | 3000ms | 3000ms |
| **Photo Interval** | 1500ms | 1500ms |
| **Flash Duration** | 100ms | 100ms |
| **Loop Cycle** | ~10ms | ~8ms |
| **Reliability** | Good | Better |

---

## Hardware Compatibility

### Confirmed Working With:
- Canon EOS Rebel T6i / T7i / T8i
- USB Host Shield 2.0 (standard version)
- Standard relay modules (5V)
- PC817 optocouplers
- Arduino Uno R3
- Arduino Mega 2560

### Should Work With:
- Other Canon EOS Rebel models (T5i, T6s, etc.)
- Most Canon EOS models with USB PTP support
- Other USB Host Shield 2.0 compatible shields

---

## Support & Resources

- Arduino Documentation: https://docs.arduino.cc
- USB Host Shield: https://github.com/felis/USB_Host_Shield_2.0
- Canon PTP Protocol: https://en.wikipedia.org/wiki/Picture_Transfer_Protocol

---

## Version History

- **v1.0** (Oct 2024) - Initial release
  - Arduino Uno R3 prototype version
  - Arduino Mega 2560 production version
  - Upgrade guide and documentation
  - Full feature parity between versions
  - Memory optimization for Uno R3

---

## Next Steps

1. **Choose Your Version**: Uno R3 (prototype) or Mega 2560 (production)?
2. **Read Setup Guide**: See version-specific README
3. **Assemble Hardware**: Follow wiring diagram in setup guide
4. **Upload Sketch**: Follow installation instructions above
5. **Test Functions**: Use Serial Monitor commands
6. **Connect Camera**: Test with actual Canon
7. **Validate Workflow**: Run complete photo booth session
8. **Deploy**: Connect to Raspberry Pi for full system

---

**Questions?** Check the README files in each subdirectory for detailed information.
