# Photo Booth Materials Research

This document contains detailed research on the hardware components required for building an Arduino-controlled photo booth system.

## Table of Contents

1. [Camera Systems](#camera-systems)
2. [Printers](#printers)
3. [Payment Processing](#payment-processing)
4. [Electronic Components](#electronic-components)
5. [Additional Hardware](#additional-hardware)

---

## Camera Systems

### Canon Rebel DSLR Series

#### Why Canon Rebel?

- Excellent image quality for event photography
- Reliable USB connectivity and PTP protocol support
- Wide lens compatibility
- Good low-light performance
- Affordable price point ($400-$800)
- Well-documented Arduino integration

#### Recommended Models

**Canon EOS Rebel T7i / 800D**
- 24.2 MP APS-C sensor
- Dual Pixel autofocus
- Excellent for photo booth applications
- Price: ~$550-$700 (body only)
- Full Arduino PTP support

**Canon EOS Rebel T6i / 750D**
- 24.2 MP APS-C sensor
- Articulating touchscreen
- Reliable USB control
- Price: ~$400-$500 (body only)
- Widely available used

**Canon EOS Rebel SL3 / 250D**
- 24.1 MP APS-C sensor
- Compact and lightweight
- 4K video capability (future expansion)
- Price: ~$500-$650 (body only)

#### Recommended Lenses for Photo Booth

**Canon EF-S 24mm f/2.8 STM**
- Wide angle perfect for small booth spaces
- Compact pancake lens
- Price: ~$130-$150

**Canon EF 50mm f/1.8 STM**
- Classic portrait lens
- Excellent low-light performance
- Great bokeh effect
- Price: ~$125

**Canon EF-S 18-55mm f/3.5-5.6 IS STM**
- Versatile zoom range
- Often included as kit lens
- Good for varying booth sizes
- Price: ~$200 (or free with kit)

#### Camera Specifications Needed

- **Resolution:** Minimum 18MP (for quality 4x6" prints)
- **USB Connectivity:** USB 2.0 or higher with PTP support
- **Autofocus:** Phase detection or Dual Pixel AF
- **Battery Life:** 600+ shots per charge
- **Flash Sync:** Hot shoe for external flash/trigger
- **Manual Controls:** Full manual mode support

#### Camera Accessories

- **AC Adapter:** Canon ACK-E10 or equivalent (~$30-$50)
  - Eliminates battery changes
  - Essential for all-day operation

- **Dummy Battery:** For continuous power
  - Prevents booth downtime

- **USB Cable:** High-quality USB A to Mini-B/Micro-B
  - 6-10 feet for flexibility
  - Ferrite core for noise reduction
  - Price: ~$10-$15

- **Lens Cap Keeper:** Prevents loss during booth operation

---

## Printers

### Dye Sublimation Printers (Recommended)

Dye sublimation is the industry standard for photo booth printing due to durability, speed, and professional quality.

#### DNP (Dai Nippon Printing) DS620A

**Specifications:**
- Print Size: 4x6", 5x7", 6x8", 2x6" strips
- Print Speed: 8.3 seconds (4x6")
- Prints per Hour: 400 (4x6")
- Resolution: 300 x 300 dpi
- Connectivity: USB, Ethernet
- Media Capacity: 200 prints (4x6")
- Dimensions: 11.22" W x 8.78" H x 15.08" D
- Weight: 23.1 lbs

**Pros:**
- Industry-leading speed
- Professional quality
- High capacity
- Reliable
- Network printing support

**Cons:**
- Higher initial cost
- Larger footprint than ultra-compact models

**Price:** ~$1,300-$1,500
**Media Cost:** ~$0.25-$0.35 per 4x6" print

**Booth Compatibility:** ★★★★☆ (4/5)
- Fits in standard booth but requires dedicated space

---

#### DNP QW410

**Specifications:**
- Print Size: 2x4", 3x4", 4x4", 4x6", 4.5x8" panoramic
- Print Speed: 19 seconds (4x6")
- Resolution: 300 x 300 dpi
- Connectivity: USB, Ethernet, WiFi
- Media Capacity: 110 prints (4x6")
- Dimensions: 9.4" W x 6.9" H x 12.2" D
- Weight: 13 lbs

**Pros:**
- Ultra-compact design
- Wireless connectivity
- Panoramic format support
- Light weight

**Cons:**
- Slower than DS620A
- Smaller media capacity
- Higher cost per print

**Price:** ~$1,500-$1,800
**Media Cost:** ~$0.35-$0.45 per 4x6" print

**Booth Compatibility:** ★★★★★ (5/5)
- Perfect for confined spaces
- Recommended for compact booth designs

---

#### DNP DS-RX1HS

**Specifications:**
- Print Size: 2x6", 4x6", 6x8"
- Print Speed: 12.4 seconds (4x6")
- Prints per Hour: 290 (4x6")
- Resolution: 300 x 600 dpi
- Connectivity: USB, Ethernet
- Media Capacity: 200 prints (4x6")
- Dimensions: 10.8" W x 10.4" H x 17.3" D
- Weight: 24.7 lbs
- Finish Options: Glossy or Matte

**Pros:**
- High speed
- Dual finish capability
- Photo strip support
- High capacity

**Cons:**
- Larger size
- Higher cost

**Price:** ~$1,400-$1,600
**Media Cost:** ~$0.30-$0.40 per 4x6" print

**Booth Compatibility:** ★★★☆☆ (3/5)
- Requires significant space

---

#### Mitsubishi CP-D90DW

**Specifications:**
- Print Size: 2x6", 4x6", 6x6", 6x8"
- Print Speed: 8.5 seconds (4x6")
- Prints per Hour: 400 (4x6")
- Resolution: 300 x 300 dpi
- Connectivity: USB, Ethernet, WiFi
- Media Capacity: 200 prints (4x6")
- Dimensions: 11.2" W x 8.9" H x 15.5" D
- Weight: 24.3 lbs

**Pros:**
- Multiple sizes from single roll
- WiFi printing
- Fast speed
- Proven reliability

**Cons:**
- Moderate size
- Media can be pricey

**Price:** ~$1,200-$1,400
**Media Cost:** ~$0.30-$0.40 per 4x6" print

**Booth Compatibility:** ★★★★☆ (4/5)

---

#### Shinko/Sinfonia CS2

**Specifications:**
- Print Size: 2x6", 4x6", 5x7", 6x8"
- Print Speed: 10 seconds (4x6")
- Resolution: 300 x 300 dpi
- Connectivity: USB, Ethernet
- Media Capacity: 220 prints (4x6")
- Dimensions: 10.4" W x 7.7" H x 14.3" D
- Weight: 17.6 lbs

**Pros:**
- Compact and lightweight
- Good speed
- High capacity
- Quieter operation

**Cons:**
- Less common in North America
- Media availability

**Price:** ~$1,000-$1,300
**Media Cost:** ~$0.28-$0.38 per 4x6" print

**Booth Compatibility:** ★★★★★ (5/5)
- Excellent size for photo booths

---

### Printer Comparison Summary

| Model | Size Rating | Speed | Price | Best For |
|-------|-------------|-------|-------|----------|
| **DNP QW410** | ★★★★★ | Medium | High | Compact booths, panoramic prints |
| **Shinko CS2** | ★★★★★ | Fast | Medium | Budget + space conscious |
| **DNP DS620A** | ★★★★☆ | Fastest | High | High-volume events |
| **Mitsubishi CP-D90DW** | ★★★★☆ | Fastest | Medium | Versatile formats |
| **DNP DS-RX1HS** | ★★★☆☆ | Fast | High | Professional operations |

### Printer Connectivity Options

**For Arduino Integration:**

1. **USB Direct Print (Recommended):**
   - Main computer handles print job creation
   - Arduino signals successful photo capture
   - Computer sends print command to printer
   - Most compatible approach

2. **Network Print:**
   - Printer on local network
   - Main computer sends print jobs over Ethernet/WiFi
   - No Arduino involvement needed
   - Best for separation of concerns

3. **PTP/DPS (Digital Print Solutions):**
   - Some printers support direct camera connection
   - Not recommended for booth (loses automation control)

### Print Media Considerations

**Media Types:**
- Ribbon + Paper sets (sold together)
- Specific to each printer model
- Bulk purchasing reduces cost

**Cost per Print (4x6"):**
- Budget: $0.25-$0.30
- Standard: $0.30-$0.40
- Premium: $0.40-$0.50

**Storage:**
- Keep media sealed until use
- Avoid humidity
- Store at 59-77°F (15-25°C)

---

## Payment Processing

### Overview

Payment processing for photo booths requires hardware that can communicate transaction success to the control system. Most DIY builders use either standalone card readers with signal outputs or integrate with commercial payment terminals.

### Option 1: NFC/Contactless Readers (Modern, Recommended)

#### PN532 NFC Module

**Specifications:**
- Supports ISO14443A/B, FeliCa, Mifare cards
- Can read contactless credit/debit cards
- SPI, I2C, or UART communication
- 3.3V or 5V operation
- Range: Up to 5cm

**Products:**
- **Adafruit PN532 Breakout:** ~$40
- **ELECHOUSE PN532 NFC Module V3:** ~$15-$25
- **Maduino Zero NFC (Arduino-compatible):** ~$30

**Pros:**
- Modern payment method (tap-to-pay)
- Fast transaction
- No moving parts
- Easy Arduino integration

**Cons:**
- Requires payment processing backend/API
- PCI compliance considerations
- May need payment gateway subscription

**Arduino Libraries:**
- Adafruit_PN532
- NNFCPN532

**Example Use Case:**
```
Customer taps card → PN532 reads card →
Send to payment API → API approves →
Arduino receives success → Triggers booth
```

---

#### Commercial NFC Payment Terminals

**Square Terminal**
- Price: ~$299
- All-in-one device
- WiFi connectivity
- Developer API available
- Transaction fees: 2.6% + $0.10

**Clover Flex**
- Price: ~$499
- Portable
- 4G + WiFi
- SDK available for integration
- Transaction fees: Varies by processor

**Integration Method:**
- Terminal on WiFi/Ethernet network
- Payment success webhook to main computer
- Computer signals Arduino to proceed
- No direct Arduino-payment terminal connection

---

### Option 2: Magnetic Stripe Readers

**Hardware:**
- **3-Track Magnetic Card Reader:** ~$30-$60
- TTL/UART output to Arduino
- Reads credit/debit card data

**Examples:**
- Magetk 90mm Dual-Head Reader
- DFRobot Magnetic Stripe Reader

**Pros:**
- Direct Arduino connection
- Simple hardware interface
- Low cost

**Cons:**
- Older technology (being phased out)
- Requires card swipe
- Magnetic stripe fraud risks
- PCI compliance critical

**Security Note:**
Magnetic stripe readers are NOT recommended for production use due to PCI compliance complexity and fraud risks.

---

### Option 3: Bill/Coin Acceptors (Simple, No PCI Compliance)

For locations where credit card processing is too complex, physical currency acceptors are an alternative.

**Bill Acceptor:**
- **ICT A7 Bill Acceptor:** ~$180-$250
- Accepts $1, $5, $10, $20 bills
- Pulse output for accepted bills
- 12V operation

**Coin Acceptor:**
- **CH-923 Programmable Coin Acceptor:** ~$15-$30
- Configurable for various coin types
- Pulse output
- 12V operation

**Integration:**
- Pulse signal → Arduino digital input
- Count pulses to verify amount
- Signal main computer when threshold reached

**Pros:**
- No PCI compliance needed
- No transaction fees
- No network required
- Simple integration

**Cons:**
- Cash management required
- Can jam or malfunction
- Less convenient for customers
- Security concerns (cash storage)

---

### Option 4: QR Code / Digital Payment Integration

Modern approach using QR codes for payment apps.

**Method:**
- Display QR code on booth screen
- Customer scans with phone (Venmo, Cash App, PayPal, etc.)
- Payment webhook triggers booth
- No hardware required

**Implementation:**
- Payment gateway (Square, Stripe, PayPal)
- API webhook to main computer
- Computer signals Arduino

**Pros:**
- No specialized hardware
- Low cost
- Customer uses familiar apps
- Easy to implement

**Cons:**
- Requires customer to have smartphone
- Internet dependency
- Manual verification may be needed
- Slight friction in UX

---

### Payment Processing Recommendations

**For Prototype/Personal Use:**
- Simple button to simulate payment
- Physical arcade button wired to Arduino
- Free to implement, test all other systems

**For Small Events (Family/Friends):**
- QR code payment system
- Venmo/Cash App QR on screen
- Manual booth operator confirms payment

**For Semi-Professional:**
- Square Terminal or similar
- API integration with main computer
- Arduino receives signal from computer

**For Professional/Commercial:**
- Dedicated payment terminal (Square, Clover)
- Full PCI compliance
- Professional integration
- Transaction logging and reporting

---

## Electronic Components

### Microcontrollers

#### Arduino Mega 2560 (Recommended)

**Specifications:**
- Microcontroller: ATmega2560
- Digital I/O Pins: 54
- Analog Input Pins: 16
- Flash Memory: 256 KB
- SRAM: 8 KB
- Clock Speed: 16 MHz
- USB: Yes (for programming and serial)

**Price:** ~$40-$50 (genuine), ~$15-$25 (compatible)

**Why Mega over Uno:**
- More pins for expansion
- More memory for complex code
- Better for USB Host Shield compatibility
- Multiple hardware serial ports

---

#### Arduino Uno R3 (Budget Option)

**Specifications:**
- Microcontroller: ATmega328P
- Digital I/O Pins: 14
- Analog Input Pins: 6
- Flash Memory: 32 KB
- SRAM: 2 KB
- Clock Speed: 16 MHz

**Price:** ~$25-$30 (genuine), ~$8-$15 (compatible)

**Suitable if:**
- Using wired trigger (not USB control)
- Limited lighting control
- Simple payment integration

---

### USB Host Shield

Essential for USB camera control via PTP protocol.

**USB Host Shield 2.0**
- Compatible with Arduino Uno, Mega
- USB Type A host port
- 5V operation
- SPI communication

**Manufacturers:**
- Sparkfun USB Host Shield
- Circuits@Home USB Host Shield
- Generic compatible shields

**Price:** ~$25-$40

**Note:** Ensure you get "Host" shield, not "Device" shield. Host shields allow Arduino to control USB devices.

---

### Optocouplers & Isolation

For safe control of cameras, lighting, and other peripherals.

#### PC817 Optocoupler (Most Common)

**Specifications:**
- Isolation voltage: 5000V
- Current transfer ratio: 50-300%
- Forward current: 50mA max
- Package: DIP-4

**Price:** ~$0.10-$0.20 each
**Quantity needed:** 3-5

**Uses:**
- Camera shutter trigger isolation
- Safe signal isolation
- Relay driver

---

#### MOC3021 Opto-Triac (For AC Loads)

**Specifications:**
- Zero-cross detection
- Isolation voltage: 7500V
- Output: Triac driver
- For AC switching

**Price:** ~$0.50-$1.00 each
**Quantity needed:** 2-3

**Uses:**
- AC lighting control
- Studio strobe triggers
- Ring light control

---

### Relays

For switching high-power loads (lighting, printer power, etc.)

#### 5V Relay Module (4-Channel)

**Specifications:**
- Control voltage: 5V DC
- Contact rating: 10A @ 250VAC / 10A @ 30VDC
- Trigger: Low-level (active low)
- Optocoupler isolated

**Price:** ~$8-$15 (4-channel module)

**Features:**
- LED indicators
- Screw terminals
- Built-in optocouplers
- Easy Arduino interfacing

**Uses:**
- Ring light on/off
- Strobe trigger
- Printer power control
- Auxiliary equipment

---

### Power Supply Components

#### 5V Power Supply for Arduino

**Requirements:**
- Voltage: 5V DC regulated
- Current: Minimum 2A (3A recommended)
- Connector: USB or barrel jack (2.1mm)

**Options:**
- USB wall adapter (5V 3A): ~$10-$15
- 5V 5A power supply: ~$15-$20
- Buck converter from 12V: ~$5-$8

---

#### 12V Power Supply (for accessories)

For bill acceptors, some relays, LED strips

**Specifications:**
- Voltage: 12V DC
- Current: 3-5A depending on loads
- Regulated switching supply

**Price:** ~$15-$25

---

### Resistors

**Values needed:**
- 220Ω (for LED current limiting, optocouplers): 10 pack ~$1
- 1kΩ (pull-up/pull-down resistors): 10 pack ~$1
- 10kΩ (general purpose): 10 pack ~$1

**Get resistor kits:** ~$10-$15 for assorted values

---

### Wiring & Connectors

**Jumper Wires:**
- Male-to-male (20cm): ~$3
- Male-to-female (20cm): ~$3
- Female-to-female (20cm): ~$3

**Breadboard:**
- Full-size breadboard: ~$5-$8
- Power rails: ~$2

**Protoboard/Perfboard:**
- For permanent installation: ~$3-$5

**Wire:**
- 22 AWG solid core (for breadboarding): ~$8-$12
- 18 AWG stranded (for power): ~$10-$15

**Connectors:**
- 2.5mm/3.5mm stereo jack (for camera): ~$2-$3
- Screw terminal blocks: ~$5-$10
- JST connectors (optional): ~$8-$12

---

### LEDs & Indicators

**Status LEDs:**
- 5mm LEDs (red, green, blue): ~$0.10 each
- For status indication on booth panel

**LED Strips (Optional):**
- RGB LED strip (5V addressable): ~$15-$25
- For decorative lighting or status indication

---

### Buttons & Switches

**Start Button (Customer Interface):**
- Arcade button (60mm, illuminated): ~$5-$10
- For customer to trigger photo sequence

**Emergency Stop (Safety):**
- Emergency stop button: ~$8-$12
- Cuts power to critical systems

**Selector Switches:**
- Toggle switches: ~$1-$3 each
- For mode selection, testing

---

## Additional Hardware

### Enclosures & Mounting

**Arduino Enclosure:**
- Plastic project box: ~$5-$10
- DIN rail mounting (optional): ~$10-$15

**Cable Management:**
- Cable ties: ~$5
- Cable sleeves: ~$8-$12
- Velcro straps: ~$5

### Display (for customer interaction)

**Options:**
- 7" HDMI touchscreen: ~$60-$80
- 10" HDMI monitor: ~$80-$120
- Tablet (iPad, Android): ~$200-$400

Connected to main computer for booth interface.

### Lighting Equipment

#### Ring Light

**Neewer 18" LED Ring Light Kit**
- Dimmable
- 3200-5600K color temperature
- AC powered
- Price: ~$80-$120

#### Studio Strobe

**Godox SK400II Studio Strobe**
- 400W power
- Wireless trigger compatible
- Price: ~$150-$200

#### Softbox (diffusion)

**24"x24" Softbox Kit**
- Even lighting
- Reduces harsh shadows
- Price: ~$40-$60

### Tripods & Mounts

**Camera Tripod:**
- Sturdy tripod: ~$50-$100
- Ball head for angle adjustment

**Light Stands:**
- 6-7ft light stands: ~$25-$40 each

### Booth Structure

**Options:**

1. **DIY Wood Frame:**
   - 2x4 lumber
   - Fabric panels
   - Cost: ~$100-$200

2. **PVC Pipe Frame:**
   - Lightweight
   - Easy assembly
   - Cost: ~$50-$100

3. **Commercial Photo Booth Shell:**
   - Professional appearance
   - Cost: ~$500-$2000

4. **Repurposed Furniture:**
   - Modified wardrobe/cabinet
   - Cost: Variable

### Backdrop

**Fabric Backdrop:**
- Seamless paper (various colors): ~$30-$50
- Fabric backdrop (wrinkle-free): ~$30-$80
- Sequin/fancy backdrops: ~$40-$100

**Backdrop Stand:**
- Adjustable stand: ~$40-$60

---

## Summary of Key Takeaways

### Camera
- **Canon Rebel T6i or T7i** for best value and features
- **50mm f/1.8 lens** for portraits
- **AC adapter** for continuous power

### Printer
- **DNP QW410** for compact booths (best size)
- **Shinko CS2** for budget-conscious (best value)
- **DNP DS620A** for high-volume (best speed)

### Payment
- **Square Terminal** for professional setup
- **PN532 NFC Module** for DIY credit card
- **Arcade button** for prototype testing
- **QR code** for low-cost semi-pro

### Electronics
- **Arduino Mega 2560** for full featured control
- **USB Host Shield 2.0** for camera USB control
- **PC817 optocouplers** for safe isolation
- **4-channel relay module** for lighting control
- **5V 3A power supply** for Arduino system

### Critical Considerations

1. **Space:** Measure your booth interior carefully
2. **Power:** Ensure adequate electrical capacity (15-20A circuit)
3. **Ventilation:** Printer and electronics generate heat
4. **Accessibility:** Easy media/paper loading
5. **Safety:** Proper grounding, circuit protection
6. **User Interface:** Simple, intuitive controls
7. **Maintenance:** Easy access for troubleshooting
8. **Portability:** Consider transport/setup time if mobile
