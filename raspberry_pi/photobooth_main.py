#!/usr/bin/env python3
"""
Photobooth Main Application - Raspberry Pi
Handles image capture, processing, and printing

Flow:
1. Wait for "BOOTH_START" from Arduino
2. Listen for "PHOTO_X" signals
3. Capture images using picamera
4. Process images (B&W, adjust levels)
5. Create photostrip layout
6. Send to printer
"""

import os
import sys
import json
import time
import threading
import logging
from datetime import datetime
from pathlib import Path
from queue import Queue

# Third-party imports
import serial
from PIL import Image, ImageOps, ImageEnhance
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/photobooth.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class PhotoboothConfig:
    """Configuration for photobooth system"""

    # Image paths
    PHOTOS_DIR = Path("/home/pi/photobooth/photos")
    PROCESSING_DIR = Path("/home/pi/photobooth/processing")
    OUTPUT_DIR = Path("/home/pi/photobooth/output")

    # Camera settings
    CAMERA_RESOLUTION = (1920, 1080)
    CAMERA_FRAMERATE = 30
    CAMERA_ISO = 200

    # Image processing
    FLASH_BRIGHTNESS = 1.2  # Brightness adjustment (1.0 = no change)
    CONTRAST = 1.5          # Contrast enhancement
    SATURATION = 0.0        # 0 = grayscale, 1 = normal color

    # Photostrip settings
    STRIP_WIDTH = 600
    STRIP_HEIGHT = 800
    PHOTO_SIZE = (280, 280)
    PADDING = 20

    # Printer settings
    PRINTER_WIDTH_MM = 101.6  # 4 inches
    PRINTER_HEIGHT_MM = 152.4  # 6 inches
    PRINTER_DPI = 300

    # Bluetooth
    BLUETOOTH_PORT = '/dev/rfcomm0'
    BLUETOOTH_BAUDRATE = 9600

    # Timeouts
    PHOTO_CAPTURE_TIMEOUT = 5
    PROCESSING_TIMEOUT = 30
    PRINTING_TIMEOUT = 60

    def __init__(self):
        """Create necessary directories"""
        self.PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        self.PROCESSING_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class BluetoothController:
    """Handles Bluetooth communication with Arduino"""

    def __init__(self, port=PhotoboothConfig.BLUETOOTH_PORT,
                 baudrate=PhotoboothConfig.BLUETOOTH_BAUDRATE):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.message_queue = Queue()
        self.running = False

    def connect(self):
        """Connect to Bluetooth device"""
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=1)
            self.running = True
            logger.info(f"Connected to Bluetooth device on {self.port}")

            # Start listener thread
            listener_thread = threading.Thread(target=self._listen)
            listener_thread.daemon = True
            listener_thread.start()

            return True
        except Exception as e:
            logger.error(f"Failed to connect to Bluetooth: {e}")
            return False

    def _listen(self):
        """Listen for incoming Bluetooth messages"""
        while self.running:
            try:
                if self.serial and self.serial.in_waiting:
                    message = self.serial.readline().decode().strip()
                    if message:
                        logger.debug(f"Received from Arduino: {message}")
                        self.message_queue.put(message)
            except Exception as e:
                logger.error(f"Error reading Bluetooth message: {e}")
            time.sleep(0.1)

    def send(self, message):
        """Send message to Arduino"""
        try:
            if self.serial:
                self.serial.write((message + '\n').encode())
                logger.debug(f"Sent to Arduino: {message}")
                return True
        except Exception as e:
            logger.error(f"Failed to send Bluetooth message: {e}")
        return False

    def get_message(self, timeout=1):
        """Get next message from queue with timeout"""
        try:
            return self.message_queue.get(timeout=timeout)
        except:
            return None

    def disconnect(self):
        """Disconnect from Bluetooth device"""
        self.running = False
        if self.serial:
            self.serial.close()
            logger.info("Disconnected from Bluetooth device")


class ImageProcessor:
    """Handles image capture and processing"""

    def __init__(self, config):
        self.config = config
        self.camera = None
        self.captured_photos = []

    def initialize_camera(self):
        """Initialize the camera module"""
        try:
            from picamera import PiCamera
            self.camera = PiCamera()
            self.camera.resolution = self.config.CAMERA_RESOLUTION
            self.camera.framerate = self.config.CAMERA_FRAMERATE
            self.camera.iso = self.config.CAMERA_ISO

            # Allow camera to warm up
            time.sleep(2)
            logger.info("Camera initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            return False

    def capture_photo(self, photo_number):
        """Capture a photo from the camera"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = self.config.PHOTOS_DIR / f"photo_{timestamp}_{photo_number}.jpg"

            logger.info(f"Capturing photo {photo_number} to {filename}")

            if self.camera:
                self.camera.capture(str(filename), format='jpeg', quality=95)
            else:
                # Fallback: create dummy image for testing
                logger.warning("Camera not available, creating test image")
                img = Image.new('RGB', (1920, 1080), color='blue')
                img.save(str(filename), 'JPEG', quality=95)

            self.captured_photos.append({
                'number': photo_number,
                'path': filename,
                'timestamp': datetime.now().isoformat()
            })

            logger.info(f"Photo {photo_number} captured successfully")
            return filename

        except Exception as e:
            logger.error(f"Failed to capture photo {photo_number}: {e}")
            return None

    def process_image(self, input_path, output_path=None):
        """
        Process image: convert to B&W, adjust levels, enhance contrast
        """
        try:
            # Load image
            img = Image.open(input_path)

            # Convert to grayscale (B&W)
            img = ImageOps.grayscale(img)

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(self.config.CONTRAST)

            # Enhance brightness
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(self.config.FLASH_BRIGHTNESS)

            # Resize to fit photostrip
            img.thumbnail(self.config.PHOTO_SIZE, Image.Resampling.LANCZOS)

            # Save processed image
            if output_path is None:
                output_path = self.config.PROCESSING_DIR / f"processed_{input_path.name}"

            img.save(str(output_path), 'JPEG', quality=95)
            logger.info(f"Image processed and saved to {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Failed to process image {input_path}: {e}")
            return None

    def process_all_photos(self):
        """Process all captured photos"""
        processed_photos = []

        for photo_info in self.captured_photos:
            input_path = photo_info['path']
            processed_path = self.process_image(input_path)

            if processed_path:
                processed_photos.append(processed_path)

        return processed_photos

    def shutdown_camera(self):
        """Safely shut down camera"""
        if self.camera:
            self.camera.close()
            logger.info("Camera shut down")


class PhotostripGenerator:
    """Generate photostrip layout from processed images"""

    def __init__(self, config):
        self.config = config

    def create_strip(self, photo_paths):
        """
        Create a photostrip from 4 photos
        Layout: vertical strip with 4 photos stacked
        """
        try:
            if len(photo_paths) != 4:
                logger.error(f"Expected 4 photos, got {len(photo_paths)}")
                return None

            # Create blank image for the strip
            strip = Image.new(
                'L',  # Grayscale
                (self.config.STRIP_WIDTH, self.config.STRIP_HEIGHT),
                color=255  # White background
            )

            # Calculate positions
            photo_width, photo_height = self.config.PHOTO_SIZE
            start_y = self.config.PADDING

            # Paste each photo into the strip
            for idx, photo_path in enumerate(photo_paths):
                try:
                    photo = Image.open(photo_path).convert('L')
                    photo.thumbnail(self.config.PHOTO_SIZE, Image.Resampling.LANCZOS)

                    # Center horizontally
                    x_offset = (self.config.STRIP_WIDTH - photo.width) // 2

                    # Position vertically
                    y_offset = start_y + (idx * (photo_height + self.config.PADDING))

                    strip.paste(photo, (x_offset, y_offset))
                    logger.info(f"Pasted photo {idx + 1} at position ({x_offset}, {y_offset})")

                except Exception as e:
                    logger.error(f"Failed to paste photo {idx + 1}: {e}")
                    return None

            # Save photostrip
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.config.OUTPUT_DIR / f"photostrip_{timestamp}.jpg"
            strip.save(str(output_path), 'JPEG', quality=95)

            logger.info(f"Photostrip created: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Failed to create photostrip: {e}")
            return None


class PrinterController:
    """Handles communication with photo printer"""

    def __init__(self, config):
        self.config = config
        self.printer_queue = Queue()

    def send_to_printer(self, image_path):
        """
        Send image to printer
        Uses CUPS (Common Unix Printing System) on Raspberry Pi
        """
        try:
            import cups

            # Connect to CUPS server
            conn = cups.Connection()
            printers = conn.getPrinters()

            if not printers:
                logger.error("No printers found")
                return False

            # Get first available printer (or configure to use specific one)
            printer_name = list(printers.keys())[0]
            logger.info(f"Sending to printer: {printer_name}")

            # Print the image
            # Note: Adjust options based on your specific printer
            print_options = {
                'media': 'Postcard',  # 4x6 photo paper
                'ColorModel': 'RGB',
                'scaling': '100'
            }

            conn.printFile(
                printer_name,
                str(image_path),
                f"Photobooth-{datetime.now().isoformat()}",
                print_options
            )

            logger.info(f"Sent {image_path} to printer {printer_name}")
            return True

        except ImportError:
            logger.warning("CUPS library not available, using fallback printing method")
            return self._fallback_print(image_path)
        except Exception as e:
            logger.error(f"Failed to send to printer: {e}")
            return False

    def _fallback_print(self, image_path):
        """
        Fallback printing method using lp command
        """
        try:
            import subprocess

            result = subprocess.run(
                ['lp', '-o', 'media=4x6', str(image_path)],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                logger.info(f"Print job queued: {image_path}")
                return True
            else:
                logger.error(f"Print job failed: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Fallback print failed: {e}")
            return False


class PhotoboothController:
    """Main controller orchestrating the photobooth system"""

    def __init__(self):
        self.config = PhotoboothConfig()
        self.bluetooth = BluetoothController()
        self.processor = ImageProcessor(self.config)
        self.stripper = PhotostripGenerator(self.config)
        self.printer = PrinterController(self.config)
        self.running = False
        self.session_active = False

    def initialize(self):
        """Initialize all subsystems"""
        logger.info("Initializing Photobooth System...")

        # Initialize camera
        if not self.processor.initialize_camera():
            logger.error("Failed to initialize camera")
            return False

        # Initialize Bluetooth
        if not self.bluetooth.connect():
            logger.error("Failed to connect Bluetooth")
            return False

        # Send ready signal
        self.bluetooth.send("READY")

        self.running = True
        logger.info("Photobooth System initialized successfully")
        return True

    def run(self):
        """Main event loop"""
        logger.info("Starting Photobooth main loop...")

        try:
            while self.running:
                # Check for messages from Arduino
                message = self.bluetooth.get_message(timeout=0.5)

                if message:
                    self._handle_arduino_message(message)

                time.sleep(0.1)

        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            self.shutdown()

    def _handle_arduino_message(self, message):
        """Process messages from Arduino"""
        logger.info(f"Processing message: {message}")

        if message == "BOOTH_START":
            self.session_active = True
            self.processor.captured_photos = []
            logger.info("Photobooth session started")

        elif message.startswith("PHOTO_"):
            # Extract photo number
            try:
                photo_number = int(message.split("_")[1])
                self._capture_and_prepare_photo(photo_number)
            except Exception as e:
                logger.error(f"Invalid photo message format: {message}, {e}")

        elif message == "PHOTOS_COMPLETE":
            self._process_photos_and_print()

        elif message == "ERROR":
            logger.error("Received error from Arduino")
            self._handle_error()

    def _capture_and_prepare_photo(self, photo_number):
        """Capture photo from camera"""
        try:
            photo_path = self.processor.capture_photo(photo_number)
            if photo_path:
                self.bluetooth.send(f"PHOTO_ACK_{photo_number}")
        except Exception as e:
            logger.error(f"Failed to capture photo {photo_number}: {e}")
            self.bluetooth.send("ERROR")

    def _process_photos_and_print(self):
        """Process all photos and send to printer"""
        try:
            logger.info("Starting photo processing...")

            # Process all photos
            processed_photos = self.processor.process_all_photos()

            if len(processed_photos) != 4:
                logger.error(f"Expected 4 processed photos, got {len(processed_photos)}")
                self.bluetooth.send("ERROR")
                return

            # Create photostrip
            strip_path = self.stripper.create_strip(processed_photos)

            if not strip_path:
                logger.error("Failed to create photostrip")
                self.bluetooth.send("ERROR")
                return

            # Send to printer
            self.bluetooth.send("PRINTING")

            if self.printer.send_to_printer(strip_path):
                logger.info("Photo printed successfully")
                self.bluetooth.send("COMPLETE")
                self.session_active = False
            else:
                logger.error("Failed to send to printer")
                self.bluetooth.send("ERROR")

        except Exception as e:
            logger.error(f"Error processing photos: {e}")
            self.bluetooth.send("ERROR")

    def _handle_error(self):
        """Handle error state"""
        self.session_active = False
        logger.error("Photobooth in error state")

    def shutdown(self):
        """Shutdown all subsystems"""
        logger.info("Shutting down Photobooth System...")
        self.running = False

        self.processor.shutdown_camera()
        self.bluetooth.disconnect()

        logger.info("Photobooth System shutdown complete")


def main():
    """Main entry point"""
    controller = PhotoboothController()

    if controller.initialize():
        controller.run()
    else:
        logger.error("Failed to initialize photobooth")
        sys.exit(1)


if __name__ == "__main__":
    main()
