export interface Booth {
  id: string;
  name: string;
  device_type: 'arduino' | 'raspberrypi';
  firmware_version: string;
  hardware_id: string;
  address: string;
  region: string;
  status: 'online' | 'offline' | 'maintenance';
  last_seen: string;
  battery_level: number;
  temperature: number;
  humidity: number;
  storage_used_percent: number;
  signal_strength: number;
  photos_taken_total: number;
  sessions_count: number;
  created_at: string;
  updated_at: string;
  recent_health_checks?: HealthCheck[];
}

export interface HealthCheck {
  id: string;
  booth_id: string;
  timestamp: string;
  battery_level: number;
  temperature: number;
  humidity: number;
  storage_used_percent: number;
  signal_strength: number;
  uptime_seconds: number;
  error_count: number;
}

export interface Alert {
  id: string;
  booth_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  created_at: string;
  resolved_at?: string;
}
