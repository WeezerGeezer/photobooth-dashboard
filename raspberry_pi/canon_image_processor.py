#!/usr/bin/env python3
"""
Canon DSLR Photo Booth - Image Processing
Handles photo retrieval from Canon Rebel, B&W processing, and printing

Flow:
1. Monitor Canon camera's SD card for new photos via gPhoto2 or direct USB
2. Download photos from camera to local storage
3. Process images (B&W conversion, contrast adjustment)
4. Create photostrip layout (4 photos in strip format)
5. Send to printer (CUPS interface)
6. Log session data to dashboard
"""

import os
import sys
import subprocess
import json
import time
import threading
import logging
from datetime import datetime
from pathlib import Path
from queue import Queue

from PIL import Image, ImageOps, ImageEnhance
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/photobooth-canon.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class CanonPhotoBoothConfig:
    """Configuration for Canon Rebel photo booth system"""

    # Image paths
    PHOTOS_DIR = Path("/home/pi/photobooth/canon/photos")
    PROCESSING_DIR = Path("/home/pi/photobooth/canon/processing")
    OUTPUT_DIR = Path("/home/pi/photobooth/canon/output")
    ARCHIVE_DIR = Path("/home/pi/photobooth/canon/archive")

    # Image processing
    FLASH_BRIGHTNESS = 1.3      # Brightness adjustment for DSLR photos
    CONTRAST = 1.4              # Contrast enhancement
    SHADOW_LIFT = 1.15          # Lift shadows slightly for better appearance
    SATURATION = 0.0            # 0 = grayscale, 1 = normal color

    # Photostrip settings
    STRIP_WIDTH = 600
    STRIP_HEIGHT = 800
    PHOTO_SIZE = (280, 280)
    PADDING = 20
    BORDER_WIDTH = 2
    BORDER_COLOR = 128

    # Printer settings
    PRINTER_WIDTH_MM = 101.6    # 4 inches
    PRINTER_HEIGHT_MM = 152.4   # 6 inches
    PRINTER_DPI = 300

    # Canon camera connection
    CAMERA_DEVICE = "usb:"      # gPhoto2 device identifier
    CAMERA_REMOTE_DIR = "/store_00010001/DCIM/100EOS5T"  # Canon Rebel directory

    # Photo retrieval
    PHOTO_RETRIEVAL_TIMEOUT = 30
    MAX_PHOTOS_TO_KEEP = 100

    def __init__(self):
        """Create necessary directories"""
        self.PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        self.PROCESSING_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)


class CanonCameraInterface:
    """Interface with Canon DSLR via gPhoto2"""

    def __init__(self, config):
        self.config = config
        self.camera_connected = False

    def connect(self):
        """Establish connection to Canon camera"""
        try:
            result = subprocess.run(
                ['gphoto2', '--auto-detect'],
                capture_output=True,
                text=True,
                timeout=10
            )

            if 'Canon' in result.stdout or 'CANON' in result.stdout:
                logger.info("Canon camera detected")
                self.camera_connected = True
                return True
            else:
                logger.error("Canon camera not found")
                return False

        except Exception as e:
            logger.error(f"Failed to detect camera: {e}")
            return False

    def list_photos(self):
        """List photos on camera SD card"""
        try:
            result = subprocess.run(
                ['gphoto2', '--list-files'],
                capture_output=True,
                text=True,
                timeout=10
            )

            files = []
            for line in result.stdout.split('\n'):
                if '.JPG' in line.upper() or '.CRW' in line.upper():
                    # Extract filename
                    parts = line.split()
                    if parts:
                        files.append(parts[-1])

            logger.info(f"Found {len(files)} photos on camera")
            return files

        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []

    def download_photo(self, filename, destination):
        """Download photo from camera to local storage"""
        try:
            logger.info(f"Downloading {filename} from camera...")

            result = subprocess.run(
                ['gphoto2', '--get-file', filename, '--new', '--force-overwrite'],
                capture_output=True,
                text=True,
                timeout=self.config.PHOTO_RETRIEVAL_TIMEOUT
            )

            if result.returncode == 0:
                logger.info(f"Photo downloaded: {filename}")
                return True
            else:
                logger.error(f"Download failed: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Failed to download photo {filename}: {e}")
            return False

    def disconnect(self):
        """Disconnect from camera"""
        try:
            subprocess.run(['gphoto2', '--exit'], timeout=5)
            logger.info("Camera disconnected")
        except Exception as e:
            logger.debug(f"Error disconnecting: {e}")


class CanonImageProcessor:
    """Process Canon DSLR photos for printing"""

    def __init__(self, config):
        self.config = config
        self.captured_photos = []

    def process_image(self, input_path, output_path=None):
        """
        Process image: convert to B&W, adjust levels, enhance contrast
        Optimized for Canon DSLR output
        """
        try:
            logger.info(f"Processing image: {input_path}")

            # Load image
            img = Image.open(input_path)

            # If image is RAW (CRW), it needs conversion first
            if input_path.suffix.upper() == '.CRW':
                logger.warning(f"RAW image detected: {input_path}")
                logger.info("RAW files require conversion - ensure imagemagick is installed")
                return None

            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Convert to grayscale (B&W)
            img = ImageOps.grayscale(img)

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(self.config.CONTRAST)

            # Enhance brightness (lift shadows for DSLR photos)
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(self.config.FLASH_BRIGHTNESS)

            # Apply color curve adjustment (lift shadows slightly)
            pixels = img.load()
            width, height = img.size

            for x in range(width):
                for y in range(height):
                    pixel = pixels[x, y]
                    # Lift shadows (darker pixels) slightly
                    if pixel < 128:
                        pixel = min(255, int(pixel * self.config.SHADOW_LIFT))
                        pixels[x, y] = pixel

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

    def process_all_photos(self, photo_paths):
        """Process all captured photos"""
        processed_photos = []

        for photo_path in photo_paths:
            processed_path = self.process_image(photo_path)
            if processed_path:
                processed_photos.append(processed_path)

        return processed_photos


class PhotostripGenerator:
    """Generate photostrip layout from processed Canon photos"""

    def __init__(self, config):
        self.config = config

    def create_strip(self, photo_paths):
        """
        Create a photostrip from 4 photos
        Layout: vertical strip with 4 photos stacked
        Designed for 4x6 thermal printer output
        """
        try:
            if len(photo_paths) != 4:
                logger.error(f"Expected 4 photos, got {len(photo_paths)}")
                return None

            logger.info("Creating photostrip layout...")

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

                    # Position vertically with padding
                    y_offset = start_y + (idx * (photo_height + self.config.PADDING))

                    # Add border around photo (black frame)
                    border_img = Image.new(
                        'L',
                        (photo.width + 2 * self.config.BORDER_WIDTH,
                         photo.height + 2 * self.config.BORDER_WIDTH),
                        color=0  # Black border
                    )
                    border_img.paste(photo, (self.config.BORDER_WIDTH, self.config.BORDER_WIDTH))

                    # Adjust x offset for border
                    x_offset -= self.config.BORDER_WIDTH

                    strip.paste(border_img, (x_offset, y_offset))
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
    """Handle printing via CUPS"""

    def __init__(self, config):
        self.config = config

    def send_to_printer(self, image_path):
        """Send image to printer via CUPS"""
        try:
            import cups

            # Connect to CUPS server
            conn = cups.Connection()
            printers = conn.getPrinters()

            if not printers:
                logger.error("No printers found")
                return self._fallback_print(image_path)

            # Get first available printer
            printer_name = list(printers.keys())[0]
            logger.info(f"Printing to: {printer_name}")

            # Print options for 4x6 photo
            print_options = {
                'media': '4x6',        # 4x6 photo paper
                'ColorModel': 'Gray',  # Grayscale
                'scaling': '100',
                'output-order': 'normal'
            }

            conn.printFile(
                printer_name,
                str(image_path),
                f"PhotoBooth-Canon-{datetime.now().isoformat()}",
                print_options
            )

            logger.info(f"Print job sent to {printer_name}")
            return True

        except ImportError:
            logger.warning("CUPS library not available, using fallback")
            return self._fallback_print(image_path)
        except Exception as e:
            logger.error(f"Failed to send to printer: {e}")
            return self._fallback_print(image_path)

    def _fallback_print(self, image_path):
        """Fallback printing using lp command"""
        try:
            result = subprocess.run(
                ['lp', '-o', 'media=4x6', '-o', 'ColorModel=Gray', str(image_path)],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                logger.info(f"Print job queued: {image_path}")
                return True
            else:
                logger.error(f"Print failed: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Fallback print failed: {e}")
            return False


class CanonPhotoBoothController:
    """Main controller for Canon Rebel photo booth"""

    def __init__(self):
        self.config = CanonPhotoBoothConfig()
        self.camera = CanonCameraInterface(self.config)
        self.processor = CanonImageProcessor(self.config)
        self.stripper = PhotostripGenerator(self.config)
        self.printer = PrinterController(self.config)
        self.running = False
        self.session_photos = []

    def initialize(self):
        """Initialize system and connect to camera"""
        logger.info("Initializing Canon Photo Booth System...")

        # Connect to camera
        if not self.camera.connect():
            logger.error("Failed to connect to Canon camera")
            return False

        logger.info("Canon Photo Booth System initialized successfully")
        return True

    def retrieve_and_process_photos(self, num_photos=4):
        """
        Retrieve latest photos from camera and process them
        """
        try:
            logger.info(f"Retrieving {num_photos} photos from camera...")

            # List files on camera
            photos_on_camera = self.camera.list_photos()

            if not photos_on_camera:
                logger.error("No photos found on camera")
                return None

            # Get the last N photos
            recent_photos = photos_on_camera[-num_photos:]
            photo_paths = []

            # Download each photo
            for photo_file in recent_photos:
                try:
                    # Download photo
                    if self.camera.download_photo(photo_file, self.config.PHOTOS_DIR):
                        # Find the downloaded file
                        local_files = list(self.config.PHOTOS_DIR.glob(f"*{photo_file.split('.')[-1]}"))
                        if local_files:
                            latest_file = max(local_files, key=os.path.getctime)
                            photo_paths.append(latest_file)
                except Exception as e:
                    logger.error(f"Error downloading {photo_file}: {e}")

            if len(photo_paths) != num_photos:
                logger.warning(f"Expected {num_photos} photos, got {len(photo_paths)}")

            if not photo_paths:
                logger.error("Failed to download any photos")
                return None

            # Process all photos
            logger.info("Processing photos...")
            processed_photos = self.processor.process_all_photos(photo_paths)

            if len(processed_photos) != num_photos:
                logger.error("Failed to process all photos")
                return None

            # Create photostrip
            logger.info("Creating photostrip layout...")
            strip_path = self.stripper.create_strip(processed_photos)

            if not strip_path:
                logger.error("Failed to create photostrip")
                return None

            # Send to printer
            logger.info("Sending to printer...")
            if self.printer.send_to_printer(strip_path):
                logger.info("Photo printed successfully!")
                return strip_path
            else:
                logger.error("Failed to print photos")
                return None

        except Exception as e:
            logger.error(f"Error in photo processing pipeline: {e}")
            return None

    def shutdown(self):
        """Shutdown system"""
        logger.info("Shutting down Canon Photo Booth System...")
        self.camera.disconnect()
        logger.info("Shutdown complete")


def main():
    """Main entry point"""
    controller = CanonPhotoBoothController()

    if controller.initialize():
        # Test: retrieve and process 4 photos
        result = controller.retrieve_and_process_photos(num_photos=4)
        if result:
            logger.info(f"Session complete: {result}")
        else:
            logger.error("Failed to complete photo session")
    else:
        logger.error("Failed to initialize system")
        sys.exit(1)

    controller.shutdown()


if __name__ == "__main__":
    main()
