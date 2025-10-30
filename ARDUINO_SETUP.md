# Arduino Photobooth Controller - Setup Guide

## Hardware Requirements

- **Arduino Mega 2560** (recommended for multiple serial ports)
- **HC-05 Bluetooth Module** (for wireless communication with Raspberry Pi)
- **Momentary Push Button** (for user trigger)
- **Relay Module or Transistor Circuit** (for camera trigger - 2x modules)
- **Relay Module or Transistor Circuit** (for flash trigger)
- **Status LED** (optional but recommended for debugging)
- **220Ω Resistor** (for LED current limiting)
- **Male/Female Jumper Wires**
- **Power Supply** (5V for Arduino, may need separate 12V for relays)

## Pin Configuration

```
Arduino Pin 2  → Button (Input, pull-down)
Arduino Pin 3  → Camera Trigger Relay (Output)
Arduino Pin 4  → Flash Trigger Relay (Output)
Arduino Pin 5  → Status LED (Output)
Arduino Pin 10 → Bluetooth RX (SoftwareSerial)
Arduino Pin 11 → Bluetooth TX (SoftwareSerial)

HC-05 VCC   → Arduino 5V
HC-05 GND   → Arduino GND
HC-05 TX    → Arduino Pin 10 (via voltage divider if needed)
HC-05 RX    → Arduino Pin 11
```

## Wiring Diagram

### Button Circuit
```
5V → 10kΩ Resistor → GND
                  ↓
              Button Pin 2
```

### LED Circuit
```
5V → 220Ω Resistor → LED Cathode → Pin 5 → GND
```

### Relay Circuits (Camera & Flash)
```
Arduino Pin 3/4 → Relay IN
Relay VCC → 5V
Relay GND → GND
Relay NO → Camera/Flash Trigger
Relay COM → Ground Return
```

## Installation Steps

1. **Download Arduino IDE** from https://www.arduino.cc/en/software

2. **Install CH340 Driver** (for Arduino Mega USB communication)
   - Mac: https://wiki.wemos.cc/downloads
   - Windows: Search "CH340 driver"
   - Linux: Usually built-in

3. **Configure Arduino IDE**
   - Open Arduino IDE
   - Tools → Board → Select "Arduino Mega or Mega 2560"
   - Tools → Port → Select appropriate COM port

4. **Load the Sketch**
   - Open `/arduino/photobooth_controller.ino` in Arduino IDE
   - Click Upload button (verify it compiles first)

5. **Configure HC-05 Bluetooth Module**
   - HC-05 should pair with Raspberry Pi
   - Default PIN: 1234
   - Default baud rate: 9600
   - Using AT commands if configuration needed:
     ```
     AT+NAME=PhotoboothArduino
     AT+PIN=1234
     AT+UART=9600,0,0
     ```

## Testing the Arduino

### Serial Monitor Testing
1. Open Tools → Serial Monitor
2. Set baud rate to 9600
3. You should see: "Photobooth Arduino Controller Initialized"
4. Press the button connected to Pin 2
5. You should see: "Button pressed - Starting photobooth"

### Bluetooth Testing
1. Ensure HC-05 is powered and LED is blinking
2. From Raspberry Pi, pair with HC-05
3. Open serial terminal on RPi: `minicom -D /dev/rfcomm0 -b 9600`
4. Send test messages like "READY" from RPi
5. Arduino should respond and process the message

## LED Status Indicators

- **Initialization**: 3 blinks
- **Button Pressed**: 2 blinks
- **Counting Down**: Rapid blinking (gets faster as countdown ends)
- **Taking Photos**: LED on during photo capture
- **Processing**: Off
- **Printing**: 3 blinks
- **Complete**: 4 blinks
- **Error**: 5 slow blinks

## Debugging

### Serial Monitor Output Format
```
[Timestamp] - [Level] - [Message]
```

### Common Issues

1. **"Failed to upload sketch"**
   - Check COM port selection
   - Install CH340 driver
   - Try different USB cable

2. **"Button doesn't trigger"**
   - Check wiring to Pin 2
   - Verify pull-down resistor is connected
   - Use Serial Monitor to test GPIO

3. **"HC-05 not communicating"**
   - Verify TX/RX wiring (TX→RX, RX→TX)
   - Check baud rate matches (9600)
   - Verify HC-05 LED is blinking (paired mode)
   - Use AT mode to reconfigure if needed

4. **"Relays not triggering"**
   - Check relay power supply
   - Verify pin output with multimeter
   - Test relay directly with power supply

## Camera/Flash Connection

### Camera Remote Trigger
Most digital cameras have a 2.5mm jack for remote triggers:
- Tip: Focus
- Ring: Shutter
- Ground: Return

Connect the relay NO contact across the shutter pins.

### Flash Connection
Connect the relay to the flash PC sync connector (standard 3.5mm):
- Tip: Flash sync
- Ground: Return

## Power Considerations

- **Arduino**: 5V @ ~100mA
- **Relays**: 5V @ ~70mA each (up to 140mA for both)
- **LED**: ~20mA
- **HC-05**: ~40mA
- **Total**: ~300mA minimum

Use a quality USB power supply rated for at least 2A to prevent brownouts.

## Next Steps

1. Flash the Arduino sketch
2. Test button and LED response
3. Pair HC-05 with Raspberry Pi
4. Verify Bluetooth communication
5. Test relay triggering with multimeter
6. Connect real camera and flash equipment
