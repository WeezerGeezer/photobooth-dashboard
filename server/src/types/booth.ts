export interface Booth {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    region: string;
  };
  status: 'online' | 'offline' | 'maintenance';
  last_seen: Date;
  hardware: {
    device_type: 'arduino' | 'raspberrypi';
    os_version: string;
    firmware_version: string;
  };
  metrics: {
    uptime_percent: number;
    battery_level: number;
    temperature: number;
    storage_used_percent: number;
    signal_strength: number;
    photos_taken_total: number;
    sessions_count: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface HealthCheck {
  id: string;
  booth_id: string;
  timestamp: Date;
  battery_level: number;
  temperature: number;
  humidity: number;
  storage_used_percent: number;
  signal_strength: number;
  uptime_seconds: number;
  error_count: number;
}

export interface BoothRegistration {
  device_type: 'arduino' | 'raspberrypi';
  firmware_version: string;
  hardware_id: string;
  location: {
    address: string;
    region: string;
  };
}

export interface HealthCheckPayload {
  timestamp: string;
  battery_level: number;
  temperature: number;
  humidity: number;
  storage_used_percent: number;
  signal_strength: number;
  uptime_seconds: number;
  session_count: number;
  photos_count: number;
}
