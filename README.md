# Canon Rebel Photo Booth Dashboard

A complete photo booth system using a **Canon EOS Rebel DSLR camera** with automated image processing and printing. Includes:
- **Arduino Mega 2560** controller with USB Host Shield for Canon camera control
- **Raspberry Pi** for image processing and thermal printer management
- **Canon EOS Rebel DSLR** for professional-quality photos
- **Centralized Dashboard** for monitoring and analytics

## System Components

### Hardware

**Camera System:**
- **Canon EOS Rebel T6i/T7i/T8i** (or compatible EOS Rebel model)
- **Arduino Mega 2560** with USB Host Shield 2.0
- **USB-A to Mini-B cable** (Canon connection)

**Printing System:**
- **Raspberry Pi 4** (2GB+ RAM recommended)
- **Shinko Sinfonia CS2** or similar dye-sublimation printer
- **CUPS** (Common Unix Printing System) for printer control

**Lighting & Control:**
- **Neewer Ring Light 14"** (LED, 5500K)
- **PC817 Optocouplers** (lighting isolation)
- **Relay Module** (5V, 2-4 channel)
- **Momentary Push Button** (60mm arcade button)
- **Status LED** with 220Ω resistor

**Structure:**
- **PVC pipe frame** for booth construction
- **Seamless backdrop** (5x7ft)
- **Black fabric** for booth walls/light control

### Software

**Arduino (Two Versions):**
- **Prototype**: `arduino/uno_r3_prototype/canon_rebel_uno_r3.ino` - Arduino Uno R3 for testing/validation
  - Low cost (~$35)
  - Perfect for prototyping
  - All core features included
- **Production**: `arduino/canon_rebel_controller.ino` - Arduino Mega 2560 for commercial builds
  - Professional reliability
  - Extra GPIO for sensors/features
  - Plenty of memory for expansion
- **Migration Guide**: `arduino/UPGRADE_UNO_TO_MEGA.md` - How to upgrade from Uno R3 to Mega 2560

**Raspberry Pi:**
- `raspberry_pi/canon_image_processor.py` - Download, process, and print Canon photos
- `raspberry_pi/photobooth.service` - Systemd service for auto-startup

**Dashboard:**
- Node.js/Express backend with REST API
- React frontend with real-time monitoring
- PostgreSQL database for session logging

## Features

### Photo Capture
- **Professional DSLR Quality**: 24.2MP Canon sensor
- **One-Button Operation**: Simple user trigger with 3-second countdown
- **4-Photo Sequence**: Automatic capture every 1.5 seconds
- **Professional Lighting**: Ring light + adjustable strobe
- **Full Camera Control**: ISO, aperture, shutter speed adjustable via Arduino

### Image Processing
- **Automatic B&W Conversion**: Grayscale rendering from color RAW/JPG
- **Smart Contrast Enhancement**: 1.4x boost for professional appearance
- **Shadow Lifting**: Subtle enhancement for natural look
- **Automatic Resizing**: Optimized for 4x6 print format
- **Quality Settings**: 95% JPEG quality preserves detail

### Printing
- **Instant Printing**: 4-photo strip on 4x6 thermal paper
- **Professional Output**: 300 DPI dye-sublimation or thermal printing
- **Print Time**: 15-30 seconds per session
- **CUPS Integration**: Direct printer control from Raspberry Pi

### Monitoring & Analytics
- **Real-time Status**: Live booth availability and system health
- **Session Logging**: Complete history with timestamps
- **Performance Tracking**: Camera connection, print success rates
- **Error Alerts**: Automatic notification of system issues
- **Historical Analytics**: 7-day trends and statistics

## Project Structure

```
booth-dashboard/
├── arduino/
│   ├── canon_rebel_controller.ino    # Canon camera + lighting control
│   └── README.md                     # Detailed Arduino documentation
├── arduino-controller/               # Research & BOM (from mobile branch)
│   ├── bill-of-materials.md         # Hardware requirements & pricing
│   ├── computing-platform-comparison.md
│   ├── image-transfer-architecture.md
│   ├── materials-research.md
│   └── README.md                    # Complete technical guide
├── raspberry_pi/
│   ├── canon_image_processor.py      # Photo download & processing
│   ├── photobooth.service           # Systemd service file
│   └── requirements.txt             # Python dependencies
├── server/                          # Node.js/Express backend
│   ├── src/
│   │   ├── api/
│   │   ├── config/
│   │   ├── types/
│   │   └── index.ts
│   └── package.json
├── client/                          # React dashboard UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── package.json
├── ARDUINO_SETUP.md                 # Arduino & USB Host Shield guide
├── RASPBERRYPI_SETUP.md             # Raspberry Pi setup guide
├── CANON_WORKFLOW.md                # Complete photo workflow
├── SYSTEM_ARCHITECTURE.md           # System design overview
├── TESTING_AND_DEPLOYMENT.md        # Testing & deployment guide
└── README.md                        # This file
```

## Quick Start

### Arduino Selection

**For Prototyping**: Use **Arduino Uno R3** (~$35)
- Start with this for testing and validation
- Lower cost, faster to set up
- Perfect for learning the system
- See: `arduino/uno_r3_prototype/`

**For Production**: Upgrade to **Arduino Mega 2560** (~$55)
- More GPIO and memory
- Extra serial ports for sensors
- Professional reliability
- See: `arduino/UPGRADE_UNO_TO_MEGA.md` for migration guide

### Prerequisites

**Hardware:**
- Canon EOS Rebel T6i/T7i/T8i or compatible
- Arduino Uno R3 (for prototype) OR Mega 2560 (for production)
- USB Host Shield 2.0
- Raspberry Pi 4 (2GB+ RAM)
- Shinko Sinfonia CS2 or compatible dye-sub printer
- Supporting components (relays, buttons, LEDs, PVC frame)

**Software:**
- Arduino IDE (for firmware upload)
- Raspberry Pi OS 64-bit
- Node.js 18+ (dashboard server)
- PostgreSQL 12+ (dashboard database)

### Setup Steps (1-2 Hours)

1. **Assemble Hardware**
   - Mount Canon on tripod at booth location
   - Connect Arduino Mega + USB Host Shield
   - Wire button, LED, relays per Arduino schematic
   - Connect ring light and strobe to optocouplers
   - Install Raspberry Pi near booth
   - Connect Shinko printer via USB

2. **Flash Arduino**
   ```bash
   # Open Arduino IDE

   # For PROTOTYPE (Uno R3):
   # Select: Tools → Board → Arduino Uno
   # Open: arduino/uno_r3_prototype/canon_rebel_uno_r3.ino

   # For PRODUCTION (Mega 2560):
   # Select: Tools → Board → Arduino Mega 2560
   # Open: arduino/canon_rebel_controller.ino

   # Click Upload
   ```

3. **Setup Raspberry Pi**
   ```bash
   ssh pi@raspberrypi.local
   cd ~
   git clone https://github.com/WeezerGeezer/photobooth-dashboard.git
   cd photobooth-dashboard

   # Install dependencies
   sudo apt install gphoto2 libgphoto2-6 cups imagemagick
   python3 -m venv venv
   source venv/bin/activate
   pip install -r raspberry_pi/requirements.txt

   # Start image processor
   python3 raspberry_pi/canon_image_processor.py
   ```

4. **Setup Dashboard Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```

5. **Configure Printer**
   ```bash
   # Via web interface: http://raspberrypi.local:631
   # OR command line:
   lpstat -p
   lpadmin -p PhotBoothPrinter -E -v usb://... -m everywhere
   lp -d PhotBoothPrinter /tmp/test.jpg  # test print
   ```

## Complete Workflow

### User Experience (60 seconds total)

```
Payment → Button Press → 3-Second Countdown
    ↓
Ring Light Activates → 4 Photos Captured (6 seconds)
    ↓
Photos Downloaded from Canon → B&W Processing
    ↓
Photostrip Layout Created (600×800 px)
    ↓
Print Job Sent to Printer → Physical 4×6 Print
    ↓
Session Logged to Dashboard → Ready for Next Customer
```

### Technical Flow

```
Canon EOS Rebel (USB)
    ↓ (PTP Protocol via USB Host Shield)
Arduino Mega 2560
    ↓ (Serial over USB at 115200 baud)
Raspberry Pi 4
    ↓ (gPhoto2 commands)
Download RAW/JPG photos from camera
    ↓
PIL image processing:
  - Convert to grayscale
  - Enhance contrast (1.4x)
  - Lift shadows for natural look
  - Resize to 280×280px
    ↓
Layout photostrip (600×800 px)
    ↓
Send to CUPS printer queue
    ↓
Shinko printer outputs physical 4×6 print
    ↓
Log session to dashboard database
```

## Hardware Pricing

### Budget Build (~$2,500)
- Canon T6i (used): $400
- Arduino + USB Host: $40
- Ring Light: $40
- Shinko Sinfonia CS2: $1,000
- Raspberry Pi 4: $75
- PVC frame + fabric: $150
- Misc (relays, buttons, cables): $75

### Standard Build (~$3,500)
- Canon T8i (new): $750
- Arduino + USB Host: $50
- Professional lighting: $200
- Shinko Sinfonia CS2: $1,200
- Raspberry Pi 4 (4GB): $100
- Professional booth frame: $300
- Misc components: $100

See `arduino-controller/bill-of-materials.md` for detailed component lists.

## Documentation

- **[ARDUINO_SETUP.md](./ARDUINO_SETUP.md)** - Complete Arduino & USB Host Shield configuration
- **[RASPBERRYPI_SETUP.md](./RASPBERRYPI_SETUP.md)** - Raspberry Pi installation & setup
- **[CANON_WORKFLOW.md](./CANON_WORKFLOW.md)** - End-to-end Canon photo workflow
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Detailed system design
- **[TESTING_AND_DEPLOYMENT.md](./TESTING_AND_DEPLOYMENT.md)** - Testing procedures
- **[arduino-controller/README.md](./arduino-controller/README.md)** - Comprehensive Arduino guide
- **[arduino-controller/bill-of-materials.md](./arduino-controller/bill-of-materials.md)** - Hardware BOM & pricing

## Performance Metrics

| Component | Specification | Notes |
|-----------|---------------|-------|
| **Camera** | Canon EOS Rebel T6i | 24.2MP, Full auto/manual control |
| **Resolution** | 5472×3648 (RAW) | Downsampled for 4×6 printing |
| **Photo Interval** | 1.5 seconds | Adjustable via Arduino |
| **Processing Time** | 8-12 seconds | B&W conversion + layout |
| **Print Time** | 15-30 seconds | Dye-sub printer speed |
| **Total Session** | 50-70 seconds | Button press to printed photo |
| **Memory Card** | SD/SDHC 32GB+ | Camera storage for 500+ photos |
| **Print Capacity** | 200 prints/media | Per Shinko media kit |

## Key Advantages Over PiCamera

✅ **Professional Quality**: 24.2MP Canon DSLR vs. 12MP PiCamera
✅ **Full Manual Control**: ISO, aperture, shutter speed adjustment
✅ **Reliable Performance**: Proven DSLR technology vs. experimental camera module
✅ **Better Optics**: Canon L-series lenses available
✅ **Established Ecosystem**: Extensive support and accessories
✅ **Cost Effective**: Used Canon bodies available at $300-500
✅ **Professional Output**: Dye-sublimation prints with DSLR quality

## System Requirements

### Arduino
- **Board**: Arduino Mega 2560
- **Shield**: USB Host Shield 2.0
- **Libraries**: USB Host Library, Canon EOS PTP Library
- **Power**: 5V 2A minimum

### Raspberry Pi
- **Model**: Raspberry Pi 4 (2GB+ RAM)
- **OS**: Raspberry Pi OS 64-bit
- **Storage**: 32GB microSD + optional SSD
- **Power**: 5V 3A USB-C

### Printer
- **Type**: Dye-sublimation (Shinko, Fujifilm, etc.)
- **Interface**: USB
- **Media**: 4×6 photo paper
- **Capacity**: 200+ prints per media kit

## Troubleshooting

**Arduino can't detect camera:**
- Verify USB cable is properly connected
- Check Arduino IDE serial monitor for USB errors
- Ensure Canon is in "PC Connection" mode
- Try different USB cable or port

**Photos not downloading:**
- Run `gphoto2 --list-files` to verify camera connection
- Check Raspberry Pi has write permissions to `/home/pi/photobooth/`
- Verify gPhoto2 is installed: `which gphoto2`

**Printer not printing:**
- Test with: `lp /tmp/test.jpg`
- Check CUPS status: `lpstat -p`
- Verify print queue: `lpq`

**Photos look too dark:**
- Adjust `FLASH_BRIGHTNESS` and `SHADOW_LIFT` in `canon_image_processor.py`
- Increase Canon shutter speed or ISO

See documentation files for detailed troubleshooting guides.

## Contributing

Follow commit message convention: `type(scope): description`

Examples:
- `feat(arduino): add ISO override function`
- `fix(pi): correct shadow lift calculation`
- `docs(setup): update Canon pairing instructions`

## License

MIT

## Support

For issues or questions:
1. Check relevant documentation file above
2. Review `arduino-controller/README.md` for detailed technical info
3. See TESTING_AND_DEPLOYMENT.md for debugging procedures
