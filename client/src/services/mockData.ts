import { Booth, HealthCheck } from '../types/booth';

const LOCATIONS = [
  { id: 'downtown', name: 'Downtown', region: 'Downtown' },
  { id: 'uptown', name: 'Uptown', region: 'Uptown' },
  { id: 'airport', name: 'Airport', region: 'Airport' },
  { id: 'mall', name: 'Shopping Mall', region: 'Mall' },
  { id: 'convention', name: 'Convention Center', region: 'Convention' },
];

const CLIENTS = [
  { id: 'client-a', name: 'Wedding Co.' },
  { id: 'client-b', name: 'Event Rentals Inc.' },
  { id: 'client-c', name: 'Party Plus' },
];

function generateBoothId(): string {
  return `booth-${Math.random().toString(36).substr(2, 9)}`;
}

function generateHealthChecks(boothId: string, count: number = 48): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 30 * 60000); // Every 30 minutes for 24 hours

    const baseTemp = 22 + Math.sin(i / 10) * 3;
    const baseBattery = 95 - i * 0.5;

    checks.push({
      id: `health-${Math.random().toString(36).substr(2, 9)}`,
      booth_id: boothId,
      timestamp: timestamp.toISOString(),
      battery_level: Math.max(20, Math.min(100, baseBattery + Math.random() * 10 - 5)),
      temperature: baseTemp + Math.random() * 2 - 1,
      humidity: 45 + Math.random() * 10,
      storage_used_percent: 45 + Math.random() * 15,
      signal_strength: -85 + Math.random() * 20,
      uptime_seconds: Math.floor(Math.random() * 864000), // 0-10 days
      error_count: Math.floor(Math.random() * 5),
    });
  }

  return checks;
}

export function generateMockBooths(count: number = 15): Booth[] {
  const booths: Booth[] = [];

  for (let i = 0; i < count; i++) {
    const location = LOCATIONS[i % LOCATIONS.length];
    const client = CLIENTS[i % CLIENTS.length];
    const boothId = generateBoothId();
    const isOnline = Math.random() > 0.2; // 80% online
    const lastSeenMinutes = isOnline ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 120) + 30;

    const lastSeen = new Date(Date.now() - lastSeenMinutes * 60000);

    booths.push({
      id: boothId,
      name: `${location.name} - ${client.name} #${i + 1}`,
      device_type: Math.random() > 0.5 ? 'raspberrypi' : 'arduino',
      firmware_version: '1.0.0',
      hardware_id: `HW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      address: `123 ${location.name} Street`,
      region: location.region,
      status: isOnline ? 'online' : 'offline',
      last_seen: lastSeen.toISOString(),
      battery_level: Math.floor(Math.random() * 50 + 40),
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      storage_used_percent: Math.floor(Math.random() * 80),
      signal_strength: Math.floor(Math.random() * 30 - 100),
      photos_taken_total: Math.floor(Math.random() * 5000 + 500),
      sessions_count: Math.floor(Math.random() * 500 + 50),
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60000).toISOString(),
      updated_at: isOnline ? new Date().toISOString() : lastSeen.toISOString(),
      recent_health_checks: generateHealthChecks(boothId),
    });
  }

  return booths;
}

export function getLocations() {
  return LOCATIONS;
}

export function getClients() {
  return CLIENTS;
}

// For demo purposes, generate initial mock data
export const mockBooths = generateMockBooths(15);
