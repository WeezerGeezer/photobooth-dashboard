/*
 * Canon Rebel Photo Booth Controller
 *
 * Controls:
 * - User button press detection
 * - Canon Rebel DSLR camera control via USB Host Shield + PTP Protocol
 * - Lighting system (ring light and/or strobe)
 * - Payment system integration
 * - Status LED feedback
 *
 * Hardware Setup:
 * - Button: Digital Pin 2
 * - USB Host Shield: SPI pins (10, 11, 12, 13) + INT on Pin 9
 * - Ring Light: Pin 8 (via optocoupler/relay)
 * - Strobe/Flash: Pin 9 (via optocoupler/relay)
 * - Status LED: Pin 12
 * - Payment Input: Pin 3 (digital input from payment terminal)
 * - Serial: 115200 baud with main computer
 *
 * Canon Camera Connection:
 * - USB Host Shield → Canon EOS Rebel via USB cable
 * - Uses PTP (Picture Transfer Protocol) for full camera control
 * - Can adjust ISO, aperture, shutter speed, and trigger shutter
 */

#include <SPI.h>
#include <Wire.h>
#include <usbhub.h>
#include <canoneos.h>
#include <printerrror.h>

// Pin Definitions
const int BUTTON_PIN = 2;
const int PAYMENT_PIN = 3;
const int RING_LIGHT_PIN = 8;
const int STROBE_PIN = 9;
const int STATUS_LED_PIN = 12;
const int USB_RESET_PIN = 7;

// Timing Constants (milliseconds)
const unsigned long DEBOUNCE_DELAY = 50;
const unsigned long BUTTON_HELD_TIMEOUT = 10000;
const unsigned long COUNTDOWN_DURATION = 3000;
const unsigned long PHOTO_INTERVAL = 1500;        // Interval between photos
const unsigned long STROBE_DURATION = 100;        // Flash duration
const unsigned long RING_LIGHT_WARMUP = 1000;     // Let ring light stabilize

// State Management
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
unsigned long buttonPressTime = 0;
unsigned long stateChangeTime = 0;
int photoCount = 0;
bool paymentReceived = false;

// USB and Camera Objects
USB Usb;
USBHub Hub(&Usb);
CanonEOS Eos(&Usb);

// Function Prototypes
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
void setupCamera();
void testCameraConnection();

void setup() {
  // Initialize Serial for communication with main computer
  Serial.begin(115200);

  // Configure pins
  pinMode(BUTTON_PIN, INPUT);
  pinMode(PAYMENT_PIN, INPUT_PULLUP);
  pinMode(RING_LIGHT_PIN, OUTPUT);
  pinMode(STROBE_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(USB_RESET_PIN, OUTPUT);

  // Set safe initial states
  digitalWrite(RING_LIGHT_PIN, LOW);
  digitalWrite(STROBE_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  digitalWrite(USB_RESET_PIN, HIGH);

  // Initialize USB
  if (Usb.Init() == -1) {
    Serial.println("USB initialization failed");
    sendStatusMessage("ERROR:USB_INIT_FAILED");
    setStatusLED(true);  // Keep LED on to indicate error
    currentState = ERROR_STATE;
  } else {
    Serial.println("USB initialized successfully");
  }

  delay(200);

  // Test camera connection
  testCameraConnection();

  Serial.println("Canon Rebel Photo Booth Controller Ready");
  blinkStatusLED(3, 200);  // Initialization complete indicator
}

void loop() {
  // USB Task - must be called frequently
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
          buttonPressTime = millis();
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
    paymentReceived = true;
    Serial.println("PAYMENT_RECEIVED");

    // Optional: automatically start if payment processed
    if (currentState == IDLE) {
      startPhotobooth();
    }
  }
}

/**
 * Start the photobooth process
 */
void startPhotobooth() {
  Serial.println("BOOTH_START");
  sendStatusMessage("BOOTH_START");

  currentState = COUNTDOWN;
  stateChangeTime = millis();
  photoCount = 0;
  paymentReceived = false;

  // Signal start with LED
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
    Serial.println("COUNTDOWN_COMPLETE");

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
      Serial.print("TAKING_PHOTO:");
      Serial.println(photoCount + 1);

      // Brief flash for visual feedback
      setStatusLED(true);

      // Trigger strobe
      triggerStrobe();
      delay(RING_LIGHT_WARMUP);  // Brief delay for light to settle

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

    Serial.println("PHOTOS_COMPLETE");
    sendStatusMessage("PHOTOS_COMPLETE");
  }
}

/**
 * Capture a photo using Canon EOS via USB
 * Returns the number of photos taken on the camera's memory card
 */
void captureCanonPhoto(int photoNumber) {
  Serial.print("Capturing photo ");
  Serial.print(photoNumber);
  Serial.println(" with Canon Rebel...");

  // Ensure camera is ready
  if (!isCameraReady()) {
    Serial.println("ERROR:CAMERA_NOT_READY");
    currentState = ERROR_STATE;
    return;
  }

  // Optional: Set camera parameters (ISO, aperture, shutter speed)
  // configureCamera();

  // Trigger the shutter
  uint16_t ret = Eos.Capture();

  if (ret == 0) {
    Serial.print("Photo captured successfully (photo #");
    Serial.print(photoNumber);
    Serial.println(")");
  } else {
    Serial.print("ERROR:PHOTO_CAPTURE_FAILED:");
    Serial.println(ret, HEX);
    currentState = ERROR_STATE;
  }
}

/**
 * Check if Canon camera is ready to take a photo
 */
bool isCameraReady() {
  // Check USB device is still connected
  if (Usb.getUsbTaskState() == USB_STATE_RUNNING) {
    return true;
  }
  return false;
}

/**
 * Configure Canon camera settings
 * Adjust ISO, aperture, shutter speed as needed
 */
void configureCamera() {
  // Example: Set ISO to 800
  // Eos.SetPropValue(0xD012, 0x00200000); // ISO 800

  // Example: Set aperture to f/5.6
  // Eos.SetPropValue(0xD101, 0x58);

  // Example: Set shutter speed to 1/125s
  // Eos.SetPropValue(0xD100, 0x88);

  // See Canon EOS PTP documentation for property codes
}

/**
 * Trigger ring light (continuous illumination)
 */
void triggerRingLight() {
  Serial.println("Ring light ON");
  digitalWrite(RING_LIGHT_PIN, HIGH);
}

/**
 * Trigger strobe/flash
 */
void triggerStrobe() {
  Serial.println("Strobe triggered");
  digitalWrite(STROBE_PIN, HIGH);
  delayMicroseconds(STROBE_DURATION * 1000);
  digitalWrite(STROBE_PIN, LOW);
}

/**
 * Set status LED on/off
 */
void setStatusLED(boolean on) {
  digitalWrite(STATUS_LED_PIN, on ? HIGH : LOW);
}

/**
 * Blink status LED N times
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

/**
 * Process serial commands from main computer
 */
void processSerialCommand(String cmd) {
  cmd.trim();

  if (cmd == "START") {
    // Start photobooth session
    if (currentState == IDLE) {
      startPhotobooth();
    }
  } else if (cmd == "RESET") {
    // Reset to idle state
    currentState = IDLE;
    paymentReceived = false;
    digitalWrite(RING_LIGHT_PIN, LOW);
    digitalWrite(STROBE_PIN, LOW);
    Serial.println("RESET_OK");
  } else if (cmd == "STATUS") {
    // Report current status
    Serial.print("STATE:");
    Serial.println(currentState);
  } else if (cmd == "LIGHTS_ON") {
    triggerRingLight();
  } else if (cmd == "LIGHTS_OFF") {
    digitalWrite(RING_LIGHT_PIN, LOW);
  } else if (cmd == "FLASH") {
    triggerStrobe();
  } else if (cmd == "TEST_CAMERA") {
    testCameraConnection();
  } else {
    Serial.print("UNKNOWN_COMMAND:");
    Serial.println(cmd);
  }
}

/**
 * Test Canon camera connection
 */
void testCameraConnection() {
  Serial.println("Testing Canon camera connection...");

  // Force USB task to run
  for (int i = 0; i < 50; i++) {
    Usb.Task();
    delay(10);
  }

  if (isCameraReady()) {
    Serial.println("CAMERA_READY");
    sendStatusMessage("CAMERA_READY:Canon EOS Detected");
    blinkStatusLED(4, 100);
  } else {
    Serial.println("CAMERA_NOT_FOUND");
    sendStatusMessage("ERROR:CAMERA_NOT_FOUND");
    setStatusLED(true);  // Keep LED on to indicate error
  }
}

/**
 * Emergency stop function
 */
void emergencyStop() {
  digitalWrite(RING_LIGHT_PIN, LOW);
  digitalWrite(STROBE_PIN, LOW);
  setStatusLED(false);
  currentState = IDLE;
  Serial.println("EMERGENCY_STOP");
}
