# Photobooth Dashboard - Product Requirements Document

## Executive Summary

The Photobooth Dashboard is a centralized management and monitoring system for a distributed network of photobooths. Each physical booth is equipped with a cellular-connected device (Arduino/Raspberry Pi) that communicates with a central server. The dashboard provides operators with real-time visibility into booth status, performance metrics, and operational health across multiple locations.

## Problem Statement

Managing multiple photobooths across different locations presents several challenges:
- No centralized visibility into individual booth status and health
- Difficult to monitor booth availability and usage patterns
- Manual checks required to diagnose issues or outages
- No real-time alerting for critical failures
- Limited ability to track revenue, photos taken, or maintenance needs
- No way to remotely troubleshoot or manage booth configurations

## Goals & Objectives

### Primary Goals
1. Provide real-time monitoring of all active photobooths
2. Enable quick identification and diagnosis of booth issues
3. Track key metrics (uptime, photos taken, revenue) per booth
4. Support remote management and configuration of booths
5. Generate insights and reports on booth performance

### Success Metrics
- Dashboard load time < 2 seconds
- Real-time data refresh rate ≤ 30 seconds per booth
- 99.9% uptime for the central server
- Support for 100+ simultaneous booth connections
- 95% alert accuracy with minimal false positives

## Target Users

1. **Photobooth Operators** - Primary users checking booth status, handling incident response
2. **Venue Managers** - Viewing overall performance and revenue metrics
3. **Maintenance Technicians** - Diagnosing issues, retrieving logs and diagnostics
4. **Administrators** - Managing booth inventory, user access, system configuration

## Core Features

### Phase 1: MVP (Months 1-2)
1. **Booth Discovery & Registration**
   - Booths automatically register with central server on first connection
   - Unique booth ID generation and assignment
   - Location and metadata configuration

2. **Live Status Dashboard**
   - Grid view of all booths with status indicators
   - Real-time connection status (online/offline)
   - Last seen timestamp
   - Current operational state (idle, taking photos, maintenance mode)

3. **Booth Health Metrics**
   - Uptime percentage (24h, 7d, 30d)
   - Battery level (for Pi/Arduino devices)
   - Temperature and humidity sensors (if available)
   - Cellular signal strength
   - Storage usage (SD card, local storage)

4. **Basic Alerting**
   - Offline booth notifications
   - Low battery warnings
   - High temperature alerts
   - Storage capacity warnings

5. **Detailed Booth View**
   - Individual booth page with extended metrics
   - Historical uptime graph (7d, 30d)
   - Recent activity log
   - Manual test/health check capability

### Phase 2: Enhanced Monitoring (Months 3-4)
1. **Performance Analytics**
   - Photos taken per booth (daily/weekly/monthly)
   - Average session duration
   - Peak usage hours
   - Revenue tracking (if integrated with payment system)

2. **Advanced Alerting**
   - Configurable alert thresholds
   - Multiple notification channels (email, SMS, in-app)
   - Alert escalation policies
   - Alert history and acknowledgment

3. **Remote Management**
   - Remote restart capability
   - Configuration sync (push settings to booths)
   - Firmware update management
   - Diagnostic log retrieval

4. **Reports & Insights**
   - Daily/weekly performance summaries
   - Revenue reports by location
   - Maintenance recommendations
   - SLA compliance tracking

### Phase 3: Advanced Features (Months 5+)
1. **Predictive Maintenance**
   - Anomaly detection for hardware failures
   - Maintenance scheduling suggestions
   - Parts inventory tracking

2. **Advanced Analytics**
   - Geographic heat maps of booth activity
   - Usage trend analysis
   - Capacity planning recommendations

3. **Multi-user & RBAC**
   - Role-based access control (admin, operator, manager, technician)
   - User activity audit logging
   - Multi-location user management

4. **API & Integrations**
   - RESTful API for booth management
   - Webhook notifications
   - Payment system integration
   - Third-party analytics integration

## Technical Architecture

### Hardware Components
- **Photobooth Device**: Arduino/Raspberry Pi with cellular modem (4G/LTE)
- **Sensors**: Temperature, humidity, battery level monitoring
- **Network**: Cellular connectivity (LTE fallback for redundancy)
- **Storage**: Local SD card or storage for offline operation

### Software Stack
- **Frontend**: React.js with TypeScript for dashboard UI
- **Backend**: Node.js/Express or Python for central server
- **Database**: PostgreSQL for relational data, Redis for caching/sessions
- **Real-time Communication**: WebSocket or MQTT for live data streaming
- **Deployment**: Docker containers, cloud hosting (AWS/GCP/Azure)

### Communication Protocol
- **Device to Server**: HTTPS REST API + WebSocket for streaming data
- **Data Format**: JSON for configuration and metrics
- **Heartbeat**: Booths send status every 30 seconds
- **Failover**: Local storage on device if connection lost; sync when reconnected

## Data Model

### Booth Entity
```
{
  id: unique_booth_id,
  name: string,
  location: {
    latitude: float,
    longitude: float,
    address: string,
    region: string
  },
  status: online|offline|maintenance,
  last_seen: timestamp,
  hardware: {
    device_type: arduino|raspberrypi,
    os_version: string,
    firmware_version: string
  },
  metrics: {
    uptime_percent: float,
    battery_level: int,
    temperature: float,
    storage_used_percent: float,
    signal_strength: int,
    photos_taken_total: int,
    sessions_count: int
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### Health Check Entity
```
{
  id: uuid,
  booth_id: string,
  timestamp: timestamp,
  battery_level: int,
  temperature: float,
  humidity: float,
  storage_used_percent: float,
  signal_strength: int,
  uptime_seconds: int,
  error_count: int
}
```

## User Flows

### 1. Operator Checks Daily Booth Status
1. Login to dashboard
2. See overview grid of all booths in their region
3. Green/yellow/red indicators show status at a glance
4. Click on specific booth to see detailed metrics
5. If offline, see last known status and diagnostics

### 2. Alert Response
1. Operator receives alert (offline booth)
2. Click alert notification
3. Navigate to booth detail page
4. View recent logs and error history
5. Attempt remote restart or escalate to maintenance

### 3. Maintenance Check & Update
1. Technician selects booth for scheduled maintenance
2. Views last 7 days of health metrics
3. Identifies trending issues
4. Uploads new firmware or configuration
5. Device auto-updates during low-usage window

## Non-Functional Requirements

### Performance
- Dashboard loads and displays 100 booths in < 2 seconds
- Metric updates propagate to UI within 30 seconds of collection
- API endpoints respond in < 500ms for 99th percentile
- Support 100+ concurrent WebSocket connections

### Reliability
- Central server uptime: 99.9% monthly
- Automated backups every 6 hours
- Data retention: 90 days of detailed metrics, 1 year of daily summaries
- Graceful degradation when device connectivity lost

### Security
- HTTPS/TLS for all communications
- API authentication via JWT tokens
- Per-user role-based access control
- Audit logging of all administrative actions
- GDPR compliance for any personal data

### Scalability
- Horizontal scaling for backend services
- Database optimized for time-series data
- Caching layer for frequently accessed data
- Asset CDN for frontend delivery

## Success Criteria (Phase 1)
- [ ] Booth registration and auto-discovery working
- [ ] Dashboard displays real-time status for all connected booths
- [ ] Basic metrics collection and storage implemented
- [ ] Email alerts sent for offline booths
- [ ] Individual booth detail page shows health metrics
- [ ] System stable with 50+ concurrent booth connections
- [ ] Documentation for booth device configuration complete

## Timeline

- **Week 1-2**: Backend API setup, database schema, booth registration
- **Week 3-4**: Real-time data streaming, metrics collection
- **Week 5-6**: Frontend dashboard and booth detail views
- **Week 7-8**: Alerting system, testing, documentation

## Out of Scope (Phase 1)

- Photo storage/delivery to clients
- Payment processing integration
- Advanced analytics and ML
- Multi-user/RBAC (Phase 2)
- Mobile app (Phase 3)
- Geographic mapping (Phase 3)

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Cellular connectivity issues | Data loss, delayed alerts | Implement local buffering, reliable sync |
| High server load | Dashboard performance degradation | Use caching, database optimization, auto-scaling |
| False positive alerts | Alert fatigue | Configurable thresholds, smart algorithms |
| Security breaches | Data exposure, booth hijacking | SSL/TLS, API authentication, audit logging |
| Device fragmentation | Compatibility issues | Target common platforms (RPi 4+, Arduino MKR) |

## Appendix: Device Communication Spec

### Booth Registration
```
POST /api/booths/register
{
  "device_type": "raspberrypi",
  "firmware_version": "1.0.0",
  "hardware_id": "ABC123XYZ",
  "location": {
    "address": "123 Main St",
    "region": "West Coast"
  }
}
```

### Health Check (Every 30s)
```
POST /api/booths/{booth_id}/health
{
  "timestamp": "2025-10-27T10:30:00Z",
  "battery_level": 87,
  "temperature": 22.5,
  "humidity": 45,
  "storage_used_percent": 65,
  "signal_strength": -95,
  "uptime_seconds": 345600,
  "session_count": 1250,
  "photos_count": 2840
}
```

### WebSocket Event Stream
```
Connection: ws://dashboard.server/api/booths/stream
Events:
- booth_online: {booth_id, timestamp}
- booth_offline: {booth_id, timestamp}
- metrics_update: {booth_id, metrics}
- alert: {booth_id, alert_type, severity}
```
