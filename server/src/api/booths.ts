import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BoothRegistration, HealthCheckPayload } from '../types/booth';

const router = Router();

// Register a new booth
router.post('/register', async (req: Request, res: Response) => {
  try {
    const registration: BoothRegistration = req.body;
    const booth_id = uuidv4();

    const query = `
      INSERT INTO booths
      (id, name, device_type, firmware_version, hardware_id, address, region, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'online')
      RETURNING *;
    `;

    const result = await pool.query(query, [
      booth_id,
      `Booth-${booth_id.substring(0, 8)}`,
      registration.device_type,
      registration.firmware_version,
      registration.hardware_id,
      registration.location.address,
      registration.location.region,
    ]);

    res.status(201).json({
      message: 'Booth registered successfully',
      booth_id,
      booth: result.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register booth' });
  }
});

// Get all booths
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT
        b.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', hc.id,
              'timestamp', hc.timestamp,
              'battery_level', hc.battery_level,
              'temperature', hc.temperature
            ) ORDER BY hc.timestamp DESC
          ) FILTER (WHERE hc.id IS NOT NULL),
          '[]'
        ) as recent_health_checks
      FROM booths b
      LEFT JOIN health_checks hc ON b.id = hc.booth_id AND hc.timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY b.id
      ORDER BY b.updated_at DESC;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to retrieve booths' });
  }
});

// Get specific booth
router.get('/:booth_id', async (req: Request, res: Response) => {
  try {
    const { booth_id } = req.params;

    const query = `
      SELECT
        b.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', hc.id,
              'timestamp', hc.timestamp,
              'battery_level', hc.battery_level,
              'temperature', hc.temperature,
              'humidity', hc.humidity,
              'storage_used_percent', hc.storage_used_percent,
              'signal_strength', hc.signal_strength
            ) ORDER BY hc.timestamp DESC
          ) FILTER (WHERE hc.id IS NOT NULL),
          '[]'
        ) as recent_health_checks
      FROM booths b
      LEFT JOIN health_checks hc ON b.id = hc.booth_id AND hc.timestamp > NOW() - INTERVAL '7 days'
      WHERE b.id = $1
      GROUP BY b.id;
    `;

    const result = await pool.query(query, [booth_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booth not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to retrieve booth' });
  }
});

// Submit health check
router.post('/:booth_id/health', async (req: Request, res: Response) => {
  try {
    const { booth_id } = req.params;
    const healthData: HealthCheckPayload = req.body;
    const health_check_id = uuidv4();

    // Update booth status and metrics
    const updateBoothQuery = `
      UPDATE booths
      SET
        status = 'online',
        last_seen = NOW(),
        battery_level = $2,
        temperature = $3,
        storage_used_percent = $4,
        signal_strength = $5,
        photos_taken_total = $6,
        sessions_count = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const boothResult = await pool.query(updateBoothQuery, [
      booth_id,
      healthData.battery_level,
      healthData.temperature,
      healthData.storage_used_percent,
      healthData.signal_strength,
      healthData.photos_count,
      healthData.session_count,
    ]);

    if (boothResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booth not found' });
    }

    // Insert health check record
    const healthCheckQuery = `
      INSERT INTO health_checks
      (id, booth_id, timestamp, battery_level, temperature, humidity, storage_used_percent, signal_strength, uptime_seconds, error_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
      RETURNING *;
    `;

    const healthResult = await pool.query(healthCheckQuery, [
      health_check_id,
      booth_id,
      new Date(healthData.timestamp),
      healthData.battery_level,
      healthData.temperature,
      healthData.humidity,
      healthData.storage_used_percent,
      healthData.signal_strength,
      healthData.uptime_seconds,
    ]);

    res.status(201).json({
      message: 'Health check recorded',
      health_check: healthResult.rows[0],
      booth: boothResult.rows[0],
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Failed to record health check' });
  }
});

export default router;
