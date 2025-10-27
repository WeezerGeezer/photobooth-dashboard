-- Create booths table
CREATE TABLE IF NOT EXISTS booths (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  firmware_version VARCHAR(50),
  hardware_id VARCHAR(255) UNIQUE,
  address VARCHAR(255),
  region VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  last_seen TIMESTAMP,
  battery_level INT DEFAULT 0,
  temperature FLOAT,
  humidity FLOAT,
  storage_used_percent INT DEFAULT 0,
  signal_strength INT,
  photos_taken_total INT DEFAULT 0,
  sessions_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create health checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY,
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  battery_level INT NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  storage_used_percent INT,
  signal_strength INT,
  uptime_seconds BIGINT,
  error_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY,
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_checks_booth_id_timestamp ON health_checks(booth_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_booth_id ON health_checks(booth_id);
CREATE INDEX IF NOT EXISTS idx_booths_status ON booths(status);
CREATE INDEX IF NOT EXISTS idx_booths_region ON booths(region);
CREATE INDEX IF NOT EXISTS idx_alerts_booth_id ON alerts(booth_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Insert sample data (optional)
-- INSERT INTO booths (id, name, device_type, firmware_version, hardware_id, address, region, status, last_seen)
-- VALUES (
--   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
--   'Booth-Downtown',
--   'raspberrypi',
--   '1.0.0',
--   'RPI-001',
--   '123 Main Street',
--   'Downtown',
--   'online',
--   CURRENT_TIMESTAMP
-- );
