/*
 * Canon Rebel Photo Booth Controller - Arduino Uno R3 Prototype
 *
 * PROTOTYPE VERSION FOR TESTING
 * Uses Arduino Uno R3 instead of Mega for lower cost prototyping
 * Can be upgraded to Mega 2560 for commercial builds
 *
 * Controls:
 * - User button press detection
 * - Canon Rebel DSLR camera control via USB Host Shield + PTP Protocol
 * - Lighting system (ring light and/or strobe)
 * - Payment system integration
 * - Status LED feedback
 *
 * Arduino Uno R3 Pin Configuration:
 * - Digital Pin 2: Button input
 * - Digital Pin 3: Payment signal input
 * - Digital Pin 4: Ring Light control (via optocoupler/relay)
 * - Digital Pin 5: Strobe/Flash control (via optocoupler/relay)
 * - Digital Pin 6: Status LED
 * - Digital Pin 7: USB Host Shield INT (interrupt)
 * - SPI Pins (10, 11, 12, 13): USB Host Shield communication
 *   * Pin 10: SS (Chip Select)
 *   * Pin 11: MOSI
 *   * Pin 12: MISO
 *   * Pin 13: SCK
 * - Serial RX/TX: Communication with main computer (115200 baud)
 *
 * USB Host Shield Connection:
 * The USB Host Shield 2.0 plugs directly onto the Arduino headers
 * and uses the SPI pins (10-13) for communication
 *
 * Canon Camera Connection:
 * - USB Host Shield → Canon EOS Rebel via USB cable
 * - Uses PTP (Picture Transfer Protocol) for full camera control
 */

#include <SPI.h>
#include <Wire.h>
#include <usbhub.h>
#include <canoneos.h>
#include <printerrror.h>

// ============================================================================
// PIN DEFINITIONS - Arduino Uno R3 (Note: Limited pins compared to Mega)
// ============================================================================

const int BUTTON_PIN = 2;           // User trigger button
const int PAYMENT_PIN = 3;          // Payment signal from payment terminal
const int RING_LIGHT_PIN = 4;       // Ring light control (continuous)
const int STROBE_PIN = 5;           // Strobe/flash control
const int STATUS_LED_PIN = 6;       // Status indicator LED
const int USB_INT_PIN = 7;          // USB Host Shield interrupt (optional)

// SPI Pins (used by USB Host Shield - do NOT change):
// Pin 10: SS (Chip Select)
// Pin 11: MOSI (Master Out, Slave In)
// Pin 12: MISO (Master In, Slave Out)
// Pin 13: SCK (Serial Clock)

// Serial: RX0 / TX1 - Communication with main computer (115200 baud)

// ============================================================================
// TIMING CONSTANTS (milliseconds)
// ============================================================================

const unsigned long DEBOUNCE_DELAY = 50;
const unsigned long COUNTDOWN_DURATION = 3000;      // 3 second countdown
const unsigned long PHOTO_INTERVAL = 1500;          // Interval between photos
const unsigned long STROBE_DURATION = 100;          // Flash pulse duration
const unsigned long RING_LIGHT_WARMUP = 1000;       // Light stabilization time

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

enum SystemState {
  IDLE,
  COUNTDOWN,
  TAKING_PHOTOS,
  PROCESSING,
  ERROR_STATE
};

enum ButtonState {
  NOT_PRESSED,
  PRESSED,
  HELD
};

SystemState currentState = IDLE;
ButtonState buttonState = NOT_PRESSED;
unsigned long stateChangeTime = 0;
int photoCount = 0;
bool paymentReceived = false;

// ============================================================================
// USB AND CAMERA OBJECTS
// ============================================================================

USB Usb;
USBHub Hub(&Usb);
CanonEOS Eos(&Usb);

// ============================================================================
// FUNCTION PROTOTYPES
// ============================================================================

void handleButtonPress();
void handlePaymentSignal();
void startPhotobooth();
void runCountdown();
void takePhotos();
void triggerRingLight();
void triggerStrobe();
void setStatusLED(boolean on);
void blinkStatusLED(int times, int interval);
void sendStatusMessage(String message);
void testCameraConnection();
void processSerialCommand(String cmd);

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  // Initialize Serial for communication with main computer
  Serial.begin(115200);

  // Wait for serial connection (useful for debugging)
  delay(1000);

  Serial.println("\n\n=== Canon Rebel Photo Booth - Arduino Uno R3 Prototype ===");
  Serial.println("Initializing system...");

  // Configure GPIO pins
  pinMode(BUTTON_PIN, INPUT);
  pinMode(PAYMENT_PIN, INPUT_PULLUP);
  pinMode(RING_LIGHT_PIN, OUTPUT);
  pinMode(STROBE_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  // Set safe initial states
  digitalWrite(RING_LIGHT_PIN, LOW);
  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize USB
  Serial.println("Initializing USB Host Shield...");
  if (Usb.Init() == -1) {
    Serial.println("ERROR: USB initialization failed!");
    Serial.println("Check USB Host Shield connection");
    sendStatusMessage("ERROR:USB_INIT_FAILED");
    setStatusLED(true);  // Keep LED on to indicate error
    currentState = ERROR_STATE;
  } else {
    Serial.println("USB initialized successfully");
  }

  delay(200);

  // Test camera connection
  testCameraConnection();

  Serial.println("\nCanon Rebel Photo Booth Controller Ready");
  Serial.println("Waiting for button press or serial command...\n");
  blinkStatusLED(3, 200);  // Initialization complete indicator
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // USB Task - must be called frequently (process USB events)
  Usb.Task();

  // Check for button press
  handleButtonPress();

  // Check for payment signal
  handlePaymentSignal();

  // Check for serial commands from main computer
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    processSerialCommand(cmd);
  }

  // State machine
  switch (currentState) {
    case IDLE:
      // Waiting for button press or payment signal
      break;

    case COUNTDOWN:
      runCountdown();
      break;

    case TAKING_PHOTOS:
      takePhotos();
      break;

    case PROCESSING:
      // Photos taken, main computer is processing
      break;

    case ERROR_STATE:
      blinkStatusLED(1, 100);
      delay(1000);
      break;
  }

  delay(10);  // Small delay to prevent CPU overload
}

// ============================================================================
// BUTTON HANDLING
// ============================================================================

/**
 * Handle button press detection with debouncing
 */
void handleButtonPress() {
  static unsigned long lastDebounceTime = 0;
  static int lastButtonState = HIGH;
  int buttonReading = digitalRead(BUTTON_PIN);

  // Debounce logic
  if (buttonReading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (buttonReading != (buttonState == NOT_PRESSED ? HIGH : LOW)) {
      if (buttonReading == LOW) {
        // Button pressed
        if (currentState == IDLE) {
          buttonState = PRESSED;
          startPhotobooth();
        }
      } else {
        // Button released
        buttonState = NOT_PRESSED;
      }
    }
  }

  lastButtonState = buttonReading;
}

/**
 * Handle payment signal from payment terminal
 */
void handlePaymentSignal() {
  // Check if payment signal is active (LOW = payment received)
  if (digitalRead(PAYMENT_PIN) == LOW) {
    if (!paymentReceived) {
      paymentReceived = true;
      Serial.println("PAYMENT_RECEIVED");

      // Automatically start if payment processed and idle
      if (currentState == IDLE) {
        startPhotobooth();
      }
    }
  } else {
    paymentReceived = false;
  }
}

// ============================================================================
// PHOTOBOOTH STATE MACHINE
// ============================================================================

/**
 * Start the photobooth process
 */
void startPhotobooth() {
  Serial.println(">>> BOOTH_START");
  sendStatusMessage("BOOTH_START");

  currentState = COUNTDOWN;
  stateChangeTime = millis();
  photoCount = 0;

  // Signal start with LED blink
  blinkStatusLED(2, 100);
}

/**
 * Run the countdown sequence before taking photos
 */
void runCountdown() {
  unsigned long elapsedTime = millis() - stateChangeTime;

  if (elapsedTime < COUNTDOWN_DURATION) {
    // Countdown phase - blink LED based on remaining time
    int remainingSeconds = (COUNTDOWN_DURATION - elapsedTime) / 1000;

    // Flash LED faster as countdown approaches zero
    if (remainingSeconds > 0) {
      int blinkInterval = 200 - (remainingSeconds * 50);
      if (blinkInterval < 50) blinkInterval = 50;

      if ((millis() / blinkInterval) % 2 == 0) {
        setStatusLED(true);
      } else {
        setStatusLED(false);
      }
    }
  } else {
    // Countdown complete - start taking photos
    currentState = TAKING_PHOTOS;
    stateChangeTime = millis();
    photoCount = 0;
    setStatusLED(false);
    Serial.println(">>> COUNTDOWN_COMPLETE");

    // Turn on ring light for photo session
    triggerRingLight();
  }
}

/**
 * Take photos with camera
 */
void takePhotos() {
  unsigned long elapsedTime = millis() - stateChangeTime;

  // Calculate which photo we should be on based on time elapsed
  int currentPhotoIndex = elapsedTime / PHOTO_INTERVAL;

  if (currentPhotoIndex < 4) {
    // Check if we need to trigger the camera for this photo
    if (photoCount == currentPhotoIndex) {
      Serial.print(">>> TAKING_PHOTO:");
      Serial.println(photoCount + 1);

      // Brief flash for visual feedback
      setStatusLED(true);

      // Trigger strobe
      triggerStrobe();
      delay(100);  // Brief delay for light to settle

      // Capture photo from Canon camera
      captureCanonPhoto(photoCount + 1);

      photoCount++;

      // Status LED off
      setStatusLED(false);
    }
  } else {
    // All photos taken
    currentState = PROCESSING;
    stateChangeTime = millis();

    // Turn off ring light
    digitalWrite(RING_LIGHT_PIN, LOW);

    Serial.println(">>> PHOTOS_COMPLETE");
    sendStatusMessage("PHOTOS_COMPLETE");
  }
}

// ============================================================================
// CAMERA CONTROL
// ============================================================================

/**
 * Capture a photo using Canon EOS via USB Host Shield
 * This triggers the camera's shutter via PTP protocol
 */
void captureCanonPhoto(int photoNumber) {
  Serial.print("  Capturing photo ");
  Serial.print(photoNumber);
  Serial.println(" with Canon Rebel...");

  // Ensure camera is ready
  if (!isCameraReady()) {
    Serial.println("  ERROR: Camera not ready");
    currentState = ERROR_STATE;
    return;
  }

  // Trigger the shutter via PTP
  uint16_t ret = Eos.Capture();

  if (ret == 0) {
    Serial.print("  Photo captured successfully (photo #");
    Serial.print(photoNumber);
    Serial.println(")");
  } else {
    Serial.print("  ERROR: Photo capture failed (code: 0x");
    Serial.print(ret, HEX);
    Serial.println(")");
    currentState = ERROR_STATE;
  }
}

/**
 * Check if Canon camera is ready to take a photo
 */
bool isCameraReady() {
  // Check USB device is still connected and running
  if (Usb.getUsbTaskState() == USB_STATE_RUNNING) {
    return true;
  }
  return false;
}

/**
 * Configure Canon camera settings (optional)
 * Uncomment and modify these functions for specific settings
 */
void configureCamera() {
  // Example settings (requires PTP property codes from Canon documentation):
  // Eos.SetPropValue(0xD012, 0x00200000); // ISO 800
  // Eos.SetPropValue(0xD101, 0x58);      // Aperture f/5.6
  // Eos.SetPropValue(0xD100, 0x88);      // Shutter speed 1/125s
}

// ============================================================================
// LIGHTING CONTROL
// ============================================================================

/**
 * Trigger ring light (continuous illumination)
 */
void triggerRingLight() {
  Serial.println("  Ring light ON");
  digitalWrite(RING_LIGHT_PIN, HIGH);
}

/**
 * Trigger strobe/flash
 */
void triggerStrobe() {
  Serial.println("  Strobe triggered");
  digitalWrite(STROBE_PIN, HIGH);
  delayMicroseconds(STROBE_DURATION * 1000);
  digitalWrite(STROBE_PIN, LOW);
}

// ============================================================================
// STATUS INDICATORS
// ============================================================================

/**
 * Set status LED on/off
 */
void setStatusLED(boolean on) {
  digitalWrite(STATUS_LED_PIN, on ? HIGH : LOW);
}

/**
 * Blink status LED N times with specified interval
 */
void blinkStatusLED(int times, int interval) {
  for (int i = 0; i < times; i++) {
    setStatusLED(true);
    delay(interval);
    setStatusLED(false);
    delay(interval);
  }
}

/**
 * Send status message to main computer
 */
void sendStatusMessage(String message) {
  Serial.print("STATUS:");
  Serial.println(message);
}

// ============================================================================
// SERIAL COMMAND PROCESSING
// ============================================================================

/**
 * Process serial commands from main computer
 * Commands allow remote control and testing
 */
void processSerialCommand(String cmd) {
  cmd.trim();

  if (cmd == "START") {
    // Start photobooth session
    if (currentState == IDLE) {
      startPhotobooth();
    }
  }
  else if (cmd == "RESET") {
    // Reset to idle state
    currentState = IDLE;
    paymentReceived = false;
    digitalWrite(RING_LIGHT_PIN, LOW);
    digitalWrite(STROBE_PIN, LOW);
    Serial.println("RESET_OK");
  }
  else if (cmd == "STATUS") {
    // Report current status
    Serial.print("STATE:");
    Serial.println(currentState);
  }
  else if (cmd == "LIGHTS_ON") {
    triggerRingLight();
  }
  else if (cmd == "LIGHTS_OFF") {
    digitalWrite(RING_LIGHT_PIN, LOW);
    Serial.println("Ring light OFF");
  }
  else if (cmd == "FLASH") {
    triggerStrobe();
  }
  else if (cmd == "TEST_CAMERA") {
    testCameraConnection();
  }
  else if (cmd == "HELP") {
    printHelp();
  }
  else {
    Serial.print("UNKNOWN_COMMAND:");
    Serial.println(cmd);
  }
}

// ============================================================================
// CAMERA TESTING
// ============================================================================

/**
 * Test Canon camera connection via USB Host Shield
 */
void testCameraConnection() {
  Serial.println("\nTesting Canon camera connection...");

  // Force USB task to run multiple times
  for (int i = 0; i < 50; i++) {
    Usb.Task();
    delay(10);
  }

  if (isCameraReady()) {
    Serial.println("✓ CAMERA_READY: Canon EOS detected and ready!");
    sendStatusMessage("CAMERA_READY:Canon EOS Detected");
    blinkStatusLED(4, 100);
  } else {
    Serial.println("✗ CAMERA_NOT_FOUND");
    Serial.println("  Check USB Host Shield connection");
    Serial.println("  Verify camera is in PTP/PC Connection mode");
    sendStatusMessage("ERROR:CAMERA_NOT_FOUND");
    setStatusLED(true);  // Keep LED on to indicate error
  }
  Serial.println();
}

/**
 * Print available serial commands
 */
void printHelp() {
  Serial.println("\n=== Canon Rebel Photo Booth - Serial Commands ===");
  Serial.println("START        - Start photo booth session");
  Serial.println("RESET        - Reset to idle state");
  Serial.println("STATUS       - Report current status");
  Serial.println("LIGHTS_ON    - Turn on ring light");
  Serial.println("LIGHTS_OFF   - Turn off ring light");
  Serial.println("FLASH        - Trigger strobe flash");
  Serial.println("TEST_CAMERA  - Test camera connection");
  Serial.println("HELP         - Show this help message");
  Serial.println("===============================================\n");
}

// ============================================================================
// EMERGENCY STOP
// ============================================================================

/**
 * Emergency stop function (called if needed)
 */
void emergencyStop() {
  digitalWrite(RING_LIGHT_PIN, LOW);
  digitalWrite(STROBE_PIN, LOW);
  setStatusLED(false);
  currentState = IDLE;
  Serial.println("!!! EMERGENCY_STOP !!!");
}
