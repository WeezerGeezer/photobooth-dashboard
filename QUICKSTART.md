# Quick Start Guide

Get the photobooth dashboard up and running in 15 minutes.

## Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Git

## 1. Database Setup (2 minutes)

```bash
# Create database
createdb photobooth_dashboard

# Initialize schema
cd /path/to/booth-dashboard
psql photobooth_dashboard < server/init-db.sql

# Verify
psql photobooth_dashboard -c "SELECT * FROM booths;"
```

## 2. Backend Server (3 minutes)

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=photobooth_dashboard
# DB_USER=postgres
# DB_PASSWORD=your_password

# Start development server
npm run dev

# Should see: "Photobooth Dashboard Server running on port 3001"
```

## 3. Frontend Dashboard (3 minutes)

In a new terminal:

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Should see: "Local: http://localhost:3000"
```

## 4. Test the System (5 minutes)

### Register a test booth:

```bash
curl -X POST http://localhost:3001/api/booths/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "raspberrypi",
    "firmware_version": "1.0.0",
    "hardware_id": "RPI-TEST-001",
    "location": {
      "address": "123 Main St",
      "region": "Downtown"
    }
  }'
```

**Response:**
```json
{
  "message": "Booth registered successfully",
  "booth_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "booth": { ... }
}
```

### Save the booth_id and submit a health check:

```bash
BOOTH_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

curl -X POST http://localhost:3001/api/booths/$BOOTH_ID/health \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-10-27T10:30:00Z",
    "battery_level": 85,
    "temperature": 22.5,
    "humidity": 45,
    "storage_used_percent": 65,
    "signal_strength": -95,
    "uptime_seconds": 345600,
    "session_count": 125,
    "photos_count": 284
  }'
```

### View the dashboard:

1. Open http://localhost:3000 in your browser
2. You should see your test booth in the grid
3. Click the booth card to view detailed metrics
4. Charts will appear as you send more health checks

## 5. Deploy a Real Device

See `DEVICE_SETUP.md` for:
- Raspberry Pi configuration
- Arduino setup
- Python client installation
- Network and sensor setup

Quick summary:
```bash
# On the device (Pi/Arduino)
git clone <server-url>
cd photobooth-client
cp config.py.example config.py
# Edit config.py with server URL, location, etc.
sudo systemctl enable photobooth-client
sudo systemctl start photobooth-client
```

## Useful Commands

### View logs
```bash
# Backend
npm run dev  # Terminal already shows logs

# Device (if systemd service)
sudo journalctl -u photobooth-client -f
```

### Database queries
```bash
# Connect to database
psql photobooth_dashboard

# View all booths
SELECT id, name, status, last_seen FROM booths;

# View recent health checks
SELECT booth_id, battery_level, temperature, timestamp
FROM health_checks
ORDER BY timestamp DESC
LIMIT 10;

# Count booths by region
SELECT region, COUNT(*) as count
FROM booths
GROUP BY region;
```

### API endpoints
```bash
# Get all booths
curl http://localhost:3001/api/booths

# Get specific booth
curl http://localhost:3001/api/booths/{booth_id}

# Health check
curl http://localhost:3001/health
```

## Troubleshooting

### Database connection error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Check PostgreSQL is running: `brew services list` (macOS)
- Check credentials in `.env` file
- Check database exists: `psql photobooth_dashboard`

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3001
```
- Kill process: `lsof -ti:3001 | xargs kill -9`
- Or change PORT in `.env`

### Frontend API errors
- Check backend is running on port 3001
- Check firewall isn't blocking requests
- Open browser DevTools Console tab to see errors

### Device connection fails
- Verify network connectivity: `ping google.com`
- Check firewall/router allows outbound connections
- Verify SERVER_URL is correct in device config
- Check device logs: `sudo journalctl -u photobooth-client`

## Next Steps

1. **Production Deployment**
   - Set up database backups
   - Configure HTTPS/SSL certificates
   - Deploy to cloud (AWS/GCP/Azure/Heroku)
   - Monitor uptime and performance

2. **Advanced Features**
   - Email/SMS alerting system
   - Remote booth restart functionality
   - Firmware update management
   - Advanced analytics and reporting

3. **Device Scaling**
   - Deploy client to multiple booths
   - Monitor from central dashboard
   - Handle various network conditions

4. **Documentation**
   - API reference guide
   - Architecture diagrams
   - Deployment guides
   - Troubleshooting wiki

## Documentation

- **PRD.md** - Product vision and requirements
- **DEVICE_SETUP.md** - Detailed device configuration
- **IMPLEMENTATION_SUMMARY.md** - Architecture and features
- **README.md** - Project overview

## Support

For issues:
1. Check logs for error messages
2. Verify all prerequisites are installed
3. Review documentation files
4. Check API responses in browser DevTools

## Example Booth Regions

Create test booths in different regions:

```bash
# Downtown location
curl -X POST http://localhost:3001/api/booths/register -H "Content-Type: application/json" -d '{"device_type":"raspberrypi","firmware_version":"1.0.0","hardware_id":"RPI-DT-001","location":{"address":"100 Main St","region":"Downtown"}}'

# Uptown location
curl -X POST http://localhost:3001/api/booths/register -H "Content-Type: application/json" -d '{"device_type":"raspberrypi","firmware_version":"1.0.0","hardware_id":"RPI-UT-001","location":{"address":"500 Broadway","region":"Uptown"}}'

# Airport location
curl -X POST http://localhost:3001/api/booths/register -H "Content-Type: application/json" -d '{"device_type":"arduino","firmware_version":"1.0.0","hardware_id":"ARD-AP-001","location":{"address":"2000 Airport Blvd","region":"Airport"}}'
```

Then view the dashboard and filter by region!

---

**Ready to go?** Open your terminals and follow the steps above. You'll have a working dashboard in 15 minutes!
