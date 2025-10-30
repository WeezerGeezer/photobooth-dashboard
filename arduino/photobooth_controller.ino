/*
 * Photobooth Arduino Controller
 *
 * Controls:
 * - User button press detection
 * - Camera trigger (4 photos with delays)
 * - Flash control
 * - Status LED for feedback
 * - Bluetooth communication with Raspberry Pi
 *
 * Hardware Setup:
 * - Button: Digital Pin 2 (with pull-down)
 * - Camera Trigger: Pin 3 (relay/transistor control)
 * - Flash: Pin 4 (relay/transistor control)
 * - Status LED: Pin 5
 * - Bluetooth (HC-05): Serial1 (RX1/TX1)
 */

#include <SoftwareSerial.h>

// Pin Definitions
const int BUTTON_PIN = 2;
const int CAMERA_TRIGGER_PIN = 3;
const int FLASH_PIN = 4;
const int STATUS_LED_PIN = 5;
const int BLUETOOTH_RX = 10;
const int BLUETOOTH_TX = 11;

// Timing Constants (milliseconds)
const unsigned long DEBOUNCE_DELAY = 50;
const unsigned long CAMERA_TRIGGER_DURATION = 300;  // Time to hold camera trigger
const unsigned long FLASH_DURATION = 200;           // Time to energize flash
const unsigned long COUNTDOWN_DURATION = 3000;      // 3 second countdown after button press
const unsigned long PHOTO_INTERVAL = 1500;          // Interval between photos
const unsigned long BUTTON_HELD_TIMEOUT = 10000;    // Max time for button press

// State Management
enum SystemState {
  IDLE,
  COUNTING_DOWN,
  TAKING_PHOTOS,
  PROCESSING,
  ERROR
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

// Bluetooth Setup
SoftwareSerial bluetoothSerial(BLUETOOTH_RX, BLUETOOTH_TX);

// Function Prototypes
void handleButtonPress();
void startPhotobooth();
void runCountdown();
void takePhotos();
void triggerFlash();
void triggerCamera();
void setStatusLED(boolean on);
void blinkStatusLED(int times, int interval);
void sendBluetoothMessage(String message);
void processBluetoothMessage(String message);

void setup() {
  // Initialize Serial for debugging
  Serial.begin(9600);

  // Initialize Bluetooth Serial
  bluetoothSerial.begin(9600);

  // Configure pins
  pinMode(BUTTON_PIN, INPUT);
  pinMode(CAMERA_TRIGGER_PIN, OUTPUT);
  pinMode(FLASH_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  // Set safe initial states
  digitalWrite(CAMERA_TRIGGER_PIN, LOW);
  digitalWrite(FLASH_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  Serial.println("Photobooth Arduino Controller Initialized");
  blinkStatusLED(3, 200);  // Initialization complete indicator
}

void loop() {
  // Check for button press
  handleButtonPress();

  // Check for Bluetooth messages from Raspberry Pi
  if (bluetoothSerial.available()) {
    String message = bluetoothSerial.readStringUntil('\n');
    processBluetoothMessage(message);
  }

  // State machine
  switch (currentState) {
    case IDLE:
      // Wait for button or remote trigger
      break;

    case COUNTING_DOWN:
      runCountdown();
      break;

    case TAKING_PHOTOS:
      takePhotos();
      break;

    case PROCESSING:
      // Wait for confirmation from Raspberry Pi that photos are processed
      break;

    case ERROR:
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
 * Start the photobooth process
 */
void startPhotobooth() {
  Serial.println("Button pressed - Starting photobooth");

  // Send start signal to Raspberry Pi
  sendBluetoothMessage("BOOTH_START");

  currentState = COUNTING_DOWN;
  stateChangeTime = millis();
  photoCount = 0;

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
    Serial.println("Countdown complete - Taking photos");
  }
}

/**
 * Take 4 photos with flash
 */
void takePhotos() {
  unsigned long elapsedTime = millis() - stateChangeTime;

  // Calculate which photo we should be on based on time elapsed
  int currentPhotoIndex = elapsedTime / PHOTO_INTERVAL;

  if (currentPhotoIndex < 4) {
    // Check if we need to trigger the camera for this photo
    if (photoCount == currentPhotoIndex) {
      Serial.print("Taking photo ");
      Serial.println(photoCount + 1);

      // Trigger flash
      triggerFlash();
      delay(50);  // Small delay for flash to charge

      // Trigger camera
      triggerCamera();

      // Send photo number to Raspberry Pi
      String message = "PHOTO_" + String(photoCount + 1);
      sendBluetoothMessage(message);

      photoCount++;

      // Visual feedback
      setStatusLED(true);
    }
  } else {
    // All photos taken
    currentState = PROCESSING;
    stateChangeTime = millis();
    setStatusLED(false);
    Serial.println("All photos taken - Processing");
    sendBluetoothMessage("PHOTOS_COMPLETE");
  }
}

/**
 * Trigger the camera by pulling pin low (connects to camera remote trigger)
 */
void triggerCamera() {
  digitalWrite(CAMERA_TRIGGER_PIN, HIGH);
  delay(CAMERA_TRIGGER_DURATION);
  digitalWrite(CAMERA_TRIGGER_PIN, LOW);
}

/**
 * Trigger the flash by pulling pin low
 */
void triggerFlash() {
  digitalWrite(FLASH_PIN, HIGH);
  delay(FLASH_DURATION);
  digitalWrite(FLASH_PIN, LOW);
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
 * Send message to Raspberry Pi via Bluetooth
 */
void sendBluetoothMessage(String message) {
  bluetoothSerial.println(message);
  Serial.print("Sent to Pi: ");
  Serial.println(message);
}

/**
 * Process messages from Raspberry Pi
 */
void processBluetoothMessage(String message) {
  Serial.print("Received from Pi: ");
  Serial.println(message);

  if (message == "READY") {
    // Raspberry Pi is ready to receive signals
    Serial.println("Raspberry Pi is ready");
  } else if (message == "PRINTING") {
    // Raspberry Pi is printing photos
    currentState = PROCESSING;
    blinkStatusLED(3, 150);
  } else if (message == "COMPLETE") {
    // Photobooth cycle complete
    currentState = IDLE;
    blinkStatusLED(4, 100);
    Serial.println("Photobooth cycle complete");
  } else if (message == "ERROR") {
    // Error occurred on Raspberry Pi
    currentState = ERROR;
    blinkStatusLED(5, 200);
    Serial.println("Error received from Raspberry Pi");
  }
}

/**
 * Emergency stop function (can be called if needed)
 */
void emergencyStop() {
  digitalWrite(CAMERA_TRIGGER_PIN, LOW);
  digitalWrite(FLASH_PIN, LOW);
  setStatusLED(false);
  currentState = IDLE;
  Serial.println("Emergency stop activated");
}
