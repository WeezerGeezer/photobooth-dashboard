#!/usr/bin/env python3
"""
Dashboard Integration Module for Photobooth
Integrates with the booth-dashboard backend for:
- Booth registration and status updates
- Photo metadata logging
- Session analytics
- Real-time status updates
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class DashboardClient:
    """
    Client for communicating with booth-dashboard backend
    """

    def __init__(self, server_url: str = None, booth_id: str = None,
                 hardware_id: str = None, region: str = None,
                 address: str = None, device_type: str = "raspberry-pi"):
        """
        Initialize dashboard client

        Args:
            server_url: URL of dashboard server (e.g., "http://192.168.1.100:5000")
            booth_id: Unique booth identifier
            hardware_id: Hardware serial number or identifier
            region: Geographic region for booth
            address: Physical location address
            device_type: Type of device (default: "raspberry-pi")
        """
        self.server_url = server_url or os.getenv("DASHBOARD_SERVER", "http://localhost:5000")
        self.booth_id = booth_id or os.getenv("BOOTH_ID", "booth-001")
        self.hardware_id = hardware_id or self._get_hardware_id()
        self.region = region or os.getenv("BOOTH_REGION", "default")
        self.address = address or os.getenv("BOOTH_ADDRESS", "unknown")
        self.device_type = device_type

        # Session tracking
        self.current_session = None
        self.session_photos = []

        # HTTP session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        logger.info(f"Dashboard client initialized: {self.server_url}")

    @staticmethod
    def _get_hardware_id() -> str:
        """
        Get unique hardware identifier from Raspberry Pi
        """
        try:
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('Serial'):
                        return line.split(':')[1].strip()
        except Exception as e:
            logger.warning(f"Could not read hardware ID: {e}")

        return "unknown-hardware"

    def register_booth(self) -> bool:
        """
        Register this booth with the dashboard backend

        Returns:
            True if registration successful, False otherwise
        """
        try:
            endpoint = f"{self.server_url}/api/booths/register"

            payload = {
                "booth_id": self.booth_id,
                "hardware_id": self.hardware_id,
                "device_type": self.device_type,
                "name": f"Booth {self.booth_id}",
                "region": self.region,
                "address": self.address,
                "firmware_version": self._get_firmware_version()
            }

            response = self.session.post(endpoint, json=payload, timeout=10)
            response.raise_for_status()

            logger.info(f"Booth registered successfully: {self.booth_id}")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to register booth: {e}")
            return False

    def start_session(self) -> Optional[str]:
        """
        Start a new photobooth session

        Returns:
            Session ID if successful, None otherwise
        """
        try:
            self.current_session = {
                "booth_id": self.booth_id,
                "started_at": datetime.now().isoformat(),
                "photos": [],
                "status": "started"
            }

            self.session_photos = []

            logger.info(f"Session started for booth {self.booth_id}")
            return self.booth_id

        except Exception as e:
            logger.error(f"Failed to start session: {e}")
            return None

    def log_photo_capture(self, photo_number: int, file_path: str) -> bool:
        """
        Log a captured photo with metadata

        Args:
            photo_number: Sequential photo number (1-4)
            file_path: Path to captured image file

        Returns:
            True if logged successfully
        """
        try:
            file_path = Path(file_path)
            if not file_path.exists():
                logger.warning(f"Photo file not found: {file_path}")
                return False

            photo_info = {
                "number": photo_number,
                "captured_at": datetime.now().isoformat(),
                "file_size": file_path.stat().st_size,
                "file_name": file_path.name
            }

            if self.current_session:
                self.current_session["photos"].append(photo_info)

            self.session_photos.append(file_path)
            logger.info(f"Logged photo {photo_number}: {file_path}")

            return True

        except Exception as e:
            logger.error(f"Failed to log photo capture: {e}")
            return False

    def log_photo_printed(self, print_success: bool,
                          print_time_seconds: float = None) -> bool:
        """
        Log successful photo printing with metadata

        Args:
            print_success: Whether print was successful
            print_time_seconds: Time taken to print

        Returns:
            True if logged successfully
        """
        try:
            if not self.current_session:
                logger.warning("No active session to log print")
                return False

            self.current_session["printed"] = print_success
            self.current_session["printed_at"] = datetime.now().isoformat()

            if print_time_seconds:
                self.current_session["print_duration_seconds"] = print_time_seconds

            # Update session status
            self.current_session["status"] = "completed" if print_success else "failed"

            logger.info(f"Logged photo print: success={print_success}")

            # Send session data to dashboard
            return self.submit_session()

        except Exception as e:
            logger.error(f"Failed to log print: {e}")
            return False

    def submit_session(self) -> bool:
        """
        Submit completed session data to dashboard backend

        Returns:
            True if submission successful
        """
        try:
            if not self.current_session:
                logger.warning("No session to submit")
                return False

            endpoint = f"{self.server_url}/api/booths/{self.booth_id}/session"

            response = self.session.post(
                endpoint,
                json=self.current_session,
                timeout=15
            )
            response.raise_for_status()

            logger.info("Session data submitted to dashboard")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to submit session: {e}")
            return False

    def submit_health_check(self, metrics: Dict) -> bool:
        """
        Submit health check data to dashboard

        Args:
            metrics: Dictionary containing system metrics
                    {
                        "battery_level": float,
                        "temperature": float,
                        "humidity": float,
                        "storage_used_percent": float,
                        "signal_strength": int,
                        "uptime_seconds": int
                    }

        Returns:
            True if submission successful
        """
        try:
            endpoint = f"{self.server_url}/api/booths/{self.booth_id}/health"

            payload = {
                "booth_id": self.booth_id,
                "timestamp": datetime.now().isoformat(),
                **metrics
            }

            response = self.session.post(
                endpoint,
                json=payload,
                timeout=10
            )
            response.raise_for_status()

            logger.debug("Health check submitted to dashboard")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to submit health check: {e}")
            return False

    def get_booth_status(self) -> Optional[Dict]:
        """
        Retrieve current booth status from dashboard

        Returns:
            Booth status dictionary or None if request fails
        """
        try:
            endpoint = f"{self.server_url}/api/booths/{self.booth_id}"

            response = self.session.get(endpoint, timeout=10)
            response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get booth status: {e}")
            return None

    def report_error(self, error_message: str, error_type: str = "unknown") -> bool:
        """
        Report an error to the dashboard

        Args:
            error_message: Human-readable error description
            error_type: Type of error (e.g., "camera", "printer", "communication")

        Returns:
            True if error reported successfully
        """
        try:
            endpoint = f"{self.server_url}/api/booths/{self.booth_id}/error"

            payload = {
                "booth_id": self.booth_id,
                "timestamp": datetime.now().isoformat(),
                "error_type": error_type,
                "error_message": error_message,
                "session_id": self.booth_id
            }

            response = self.session.post(
                endpoint,
                json=payload,
                timeout=10
            )
            response.raise_for_status()

            logger.info(f"Error reported to dashboard: {error_type}")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to report error: {e}")
            return False

    @staticmethod
    def _get_firmware_version() -> str:
        """Get Raspberry Pi firmware version"""
        try:
            import subprocess
            result = subprocess.run(
                ['/usr/bin/vcgencmd', 'version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            # Extract version from output
            lines = result.stdout.strip().split('\n')
            if lines:
                return lines[-1] if lines[-1] else "unknown"
        except Exception as e:
            logger.debug(f"Could not get firmware version: {e}")

        return "unknown"


class SystemMetricsCollector:
    """
    Collects system metrics from Raspberry Pi for health monitoring
    """

    @staticmethod
    def get_cpu_temp() -> Optional[float]:
        """Get CPU temperature in Celsius"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp_millidegrees = int(f.read().strip())
                return temp_millidegrees / 1000.0
        except Exception as e:
            logger.debug(f"Could not read CPU temp: {e}")
            return None

    @staticmethod
    def get_storage_usage() -> Optional[float]:
        """Get storage usage percentage"""
        try:
            import shutil
            stat = shutil.disk_usage('/')
            return (stat.used / stat.total) * 100
        except Exception as e:
            logger.debug(f"Could not read storage: {e}")
            return None

    @staticmethod
    def get_memory_usage() -> Optional[float]:
        """Get memory usage percentage"""
        try:
            with open('/proc/meminfo', 'r') as f:
                lines = dict(
                    (x.split()[0].rstrip(':'), int(x.split()[1]))
                    for x in f.readlines()
                )
                memory_total = lines['MemTotal']
                memory_available = lines['MemAvailable']
                return ((memory_total - memory_available) / memory_total) * 100
        except Exception as e:
            logger.debug(f"Could not read memory: {e}")
            return None

    @staticmethod
    def get_wifi_signal_strength() -> Optional[int]:
        """Get WiFi signal strength in dBm"""
        try:
            import subprocess
            result = subprocess.run(
                ['iwconfig', 'wlan0'],
                capture_output=True,
                text=True,
                timeout=5
            )
            for line in result.stdout.split('\n'):
                if 'Signal level' in line:
                    # Extract dBm value
                    parts = line.split('=')
                    if len(parts) > 1:
                        dbm_str = parts[1].split()[0]
                        return int(dbm_str)
        except Exception as e:
            logger.debug(f"Could not read WiFi signal: {e}")

        return None

    @staticmethod
    def get_uptime_seconds() -> int:
        """Get system uptime in seconds"""
        try:
            with open('/proc/uptime', 'r') as f:
                uptime = float(f.read().split()[0])
                return int(uptime)
        except Exception as e:
            logger.debug(f"Could not read uptime: {e}")

        return 0

    @classmethod
    def collect_all_metrics(cls) -> Dict:
        """Collect all system metrics"""
        return {
            "temperature": cls.get_cpu_temp(),
            "storage_used_percent": cls.get_storage_usage(),
            "memory_usage_percent": cls.get_memory_usage(),
            "signal_strength": cls.get_wifi_signal_strength(),
            "uptime_seconds": cls.get_uptime_seconds()
        }


# Example usage and integration
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Initialize dashboard client
    client = DashboardClient(
        server_url="http://192.168.1.100:5000",
        booth_id="booth-001",
        region="main-floor",
        address="Event Location A"
    )

    # Register booth
    client.register_booth()

    # Start a session
    session_id = client.start_session()

    # Log photos
    client.log_photo_capture(1, "/home/pi/photobooth/photos/photo_1.jpg")
    client.log_photo_capture(2, "/home/pi/photobooth/photos/photo_2.jpg")
    client.log_photo_capture(3, "/home/pi/photobooth/photos/photo_3.jpg")
    client.log_photo_capture(4, "/home/pi/photobooth/photos/photo_4.jpg")

    # Log printing
    client.log_photo_printed(print_success=True, print_time_seconds=15)

    # Submit health metrics
    metrics = SystemMetricsCollector.collect_all_metrics()
    client.submit_health_check(metrics)
