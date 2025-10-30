# Photobooth System Architecture & Workflow

## System Overview

The photobooth system is a distributed architecture consisting of:

1. **Arduino Mega Controller** - Physical hardware control
2. **Raspberry Pi** - Image capture and processing
3. **Photo Printer** - Thermal or inkjet 4x6 printer
4. **Dashboard Server** - Centralized monitoring and analytics
5. **Frontend Dashboard** - Web-based management interface

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PHOTOBOOTH BOOTH                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐              │
│  │   Push Button    │      │   Camera Flash   │              │
│  │  User Trigger    │      │   LED & Control  │              │
│  └────────┬─────────┘      └────────┬─────────┘              │
│           │                         │                         │
│           ├─────────────────────────┤                         │
│           │                         │                         │
│  ┌────────▼──────────────────────────▼────────┐              │
│  │     Arduino Mega 2560                      │              │
│  │  ┌─────────────────────────────────────┐  │              │
│  │  │ - Button debouncing                 │  │              │
│  │  │ - Camera trigger control            │  │              │
│  │  │ - Flash trigger control             │  │              │
│  │  │ - Status LED feedback               │  │              │
│  │  │ - Bluetooth communication           │  │              │
│  │  └─────────────────────────────────────┘  │              │
│  └────────┬───────────────────────────────────┘              │
│           │                                                   │
│           │ Bluetooth HC-05 (9600 baud)                      │
│           │                                                   │
│  ┌────────▼──────────────────────────────────┐              │
│  │  Raspberry Pi 4                            │              │
│  │  ┌──────────────────────────────────────┐ │              │
│  │  │ Photobooth Main Application          │ │              │
│  │  │ ┌────────────────────────────────┐   │ │              │
│  │  │ │ Arduino Communication Handler  │   │ │              │
│  │  │ │ - Listen for signals            │   │ │              │
│  │  │ │ - Send acknowledgments          │   │ │              │
│  │  │ │ - Error handling                │   │ │              │
│  │  │ └────────────────────────────────┘   │ │              │
│  │  │ ┌────────────────────────────────┐   │ │              │
│  │  │ │ Image Processor                 │   │ │              │
│  │  │ │ - Camera capture (PiCamera2)    │   │ │              │
│  │  │ │ - B&W conversion                │   │ │              │
│  │  │ │ - Contrast & brightness adjust  │   │ │              │
│  │  │ │ - Image optimization            │   │ │              │
│  │  │ └────────────────────────────────┘   │ │              │
│  │  │ ┌────────────────────────────────┐   │ │              │
│  │  │ │ Photostrip Generator            │   │ │              │
│  │  │ │ - Layout 4 photos vertically    │   │ │              │
│  │  │ │ - Optimize for printing         │   │ │              │
│  │  │ │ - Add borders/padding           │   │ │              │
│  │  │ └────────────────────────────────┘   │ │              │
│  │  │ ┌────────────────────────────────┐   │ │              │
│  │  │ │ Printer Controller              │   │ │              │
│  │  │ │ - CUPS interface                │   │ │              │
│  │  │ │ - Print job queuing             │   │ │              │
│  │  │ │ - Status monitoring             │   │ │              │
│  │  │ └────────────────────────────────┘   │ │              │
│  │  │ ┌────────────────────────────────┐   │ │              │
│  │  │ │ Dashboard Integration           │   │ │              │
│  │  │ │ - Session logging               │   │ │              │
│  │  │ │ - Health check reporting        │   │ │              │
│  │  │ │ - Error notification            │   │ │              │
│  │  │ └────────────────────────────────┘   │ │              │
│  │  └──────────────────────────────────────┘ │              │
│  │                                             │              │
│  │  ┌──────────────────┬──────────────────┐   │              │
│  │  │ PiCamera2        │  USB Photo       │   │              │
│  │  │ Module           │  Printer         │   │              │
│  │  └──────────────────┴──────────────────┘   │              │
│  └──────────────────────────────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘

        HTTP/REST API         Ethernet
        │                     │
        └────────┬────────────┘
                 │
        ┌────────▼───────────────────┐
        │  Booth Dashboard Server    │
        │  (Node.js + Express)       │
        │  ┌──────────────────────┐  │
        │  │ REST API Endpoints   │  │
        │  │ WebSocket Events     │  │
        │  │ Health Monitoring    │  │
        │  └──────────────────────┘  │
        │  ┌──────────────────────┐  │
        │  │ PostgreSQL Database  │  │
        │  │ - Booth Registry     │  │
        │  │ - Health History     │  │
        │  │ - Session Logs       │  │
        │  │ - Photo Metadata     │  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
                 │
                 │ HTTP
                 │
        ┌────────▼─────────────────┐
        │  React Dashboard UI      │
        │  (Vite + Tailwind)       │
        │  ┌────────────────────┐  │
        │  │ Booth Monitoring   │  │
        │  │ Analytics/Metrics  │  │
        │  │ Session History    │  │
        │  │ Alerts & Status    │  │
        │  └────────────────────┘  │
        └──────────────────────────┘
```

## Complete Workflow

### Phase 1: System Ready State

```
1. Arduino boots, initializes GPIO pins, enters IDLE state
2. Raspberry Pi starts photobooth_main.py service
3. Pi connects to Arduino via Bluetooth
4. Pi registers booth with dashboard server
5. Dashboard receives registration and marks booth ONLINE
6. System waits for user interaction
```

### Phase 2: User Initiates Photobooth (Payment Required)

```
1. User makes payment (external payment system)
2. Payment confirmed triggers Arduino button activation OR
   Direct button press by user
3. Arduino detects button press (debounced at 50ms)
4. Arduino enters COUNTING_DOWN state
5. Arduino LED begins rapid blinking (countdown feedback)
6. Arduino sends "BOOTH_START" to Raspberry Pi via Bluetooth
```

### Phase 3: Countdown Sequence (3 seconds)

```
Timeline:
0.0s: Arduino sends "BOOTH_START"
1.0s: LED flashing (faster)
2.0s: LED flashing (even faster)
3.0s: LED stops, ready to capture

Raspberry Pi waits for signal, prepares camera
```

### Phase 4: Capture 4 Photos

```
Timing (1500ms intervals between photos):

Time    Arduino Action          Raspberry Pi Action
────────────────────────────────────────────────
0.0s    Flash trigger (200ms)   Wait for PHOTO_1 signal
0.0s    Camera trigger (300ms)  Receives PHOTO_1 signal
1.5s    Flash trigger (200ms)   Captures photo 1
1.5s    Camera trigger (300ms)  Sends ACK, Receives PHOTO_2 signal
3.0s    Flash trigger (200ms)   Captures photo 2
3.0s    Camera trigger (300ms)   Sends ACK, Receives PHOTO_3 signal
4.5s    Flash trigger (200ms)   Captures photo 3
4.5s    Camera trigger (300ms)   Sends ACK, Receives PHOTO_4 signal
6.0s    Complete               Captures photo 4, Sends ACK

Total time: ~6 seconds for 4 photos
```

### Phase 5: Image Processing

```
For each of 4 photos (parallel where possible):

1. Load image from disk
2. Convert to grayscale (B&W)
3. Enhance contrast (1.5x)
4. Adjust brightness (1.2x flash boost)
5. Resize to 280x280 pixels
6. Save processed image

Total time: ~8-12 seconds
```

### Phase 6: Photostrip Layout

```
1. Create 600x800 white canvas (grayscale)
2. Position photo 1 at (160, 20) - centered
3. Position photo 2 at (160, 320)
4. Position photo 3 at (160, 620)
5. Position photo 4 at (160, 920)
6. Add light gray borders around each photo
7. Save as JPEG (95% quality)

Layout:
┌──────────────────┐
│                  │
│    [PHOTO 1]     │ ← 280x280
│                  │
├──────────────────┤
│                  │
│    [PHOTO 2]     │ ← 280x280
│                  │
├──────────────────┤
│                  │
│    [PHOTO 3]     │ ← 280x280
│                  │
├──────────────────┤
│                  │
│    [PHOTO 4]     │ ← 280x280
│                  │
└──────────────────┘

Dimensions: 600px wide × 800px height
Print size: 4"×6" (101.6mm × 152.4mm)
Resolution: 300 DPI
```

### Phase 7: Print to Printer

```
1. Raspberry Pi sends "PRINTING" status to Arduino
2. Arduino LED blinks 3 times to indicate printing
3. Pi submits photostrip to CUPS printer
4. CUPS queues print job to USB photo printer
5. Printer receives 4x6 image at 300 DPI
6. Thermal/inkjet prints on 4x6 photo paper
7. Print job completes (~15-30 seconds)
8. Raspberry Pi confirms with "COMPLETE" message
9. Arduino LED blinks 4 times (success indicator)
10. System returns to IDLE state
```

### Phase 8: Dashboard Logging

```
Parallel to printing, Raspberry Pi sends to dashboard:

POST /api/booths/{booth_id}/session
{
  "booth_id": "booth-001",
  "started_at": "2024-01-15T14:30:00Z",
  "photos": [
    {
      "number": 1,
      "captured_at": "2024-01-15T14:30:03Z",
      "file_size": 2048576
    },
    ...
  ],
  "printed": true,
  "printed_at": "2024-01-15T14:30:25Z",
  "print_duration_seconds": 22,
  "status": "completed"
}

Dashboard updates:
- Booth status → ACTIVE
- Photos taken counter increment
- Session count increment
- Real-time chart updates
- Health metrics recorded
```

## Communication Protocols

### Arduino ↔ Raspberry Pi (Bluetooth)

```
Protocol: UART 9600 baud, 8N1
Interface: HC-05 Bluetooth Module

Message Format:
[MESSAGE_TYPE]_[PARAMETER]

Arduino → Raspberry Pi:
- BOOTH_START            (user triggered, countdown starts)
- PHOTO_1                (photo 1 capture signal)
- PHOTO_2                (photo 2 capture signal)
- PHOTO_3                (photo 3 capture signal)
- PHOTO_4                (photo 4 capture signal)
- PHOTOS_COMPLETE        (all 4 photos captured)

Raspberry Pi → Arduino:
- READY                  (system initialized)
- PHOTO_ACK_1            (photo 1 received)
- PHOTO_ACK_2            (photo 2 received)
- PHOTO_ACK_3            (photo 3 received)
- PHOTO_ACK_4            (photo 4 received)
- PRINTING               (starting print process)
- COMPLETE               (photobooth cycle finished)
- ERROR                  (error occurred)
```

### Raspberry Pi ↔ Dashboard Server (HTTP/REST)

```
Base URL: http://[DASHBOARD_IP]:5000

POST /api/booths/register
  Register booth with dashboard
  Response: { booth_id, hardware_id, status: "online" }

POST /api/booths/{booth_id}/session
  Log completed photobooth session
  Response: { status: "logged", session_id }

POST /api/booths/{booth_id}/health
  Submit health metrics
  Response: { status: "received" }

GET /api/booths/{booth_id}
  Get current booth status
  Response: Booth object with metadata

POST /api/booths/{booth_id}/error
  Report error to dashboard
  Response: { status: "logged" }
```

## Data Flow

### Image Data Path

```
Camera Module (USB/CSI)
    ↓
Capture to /home/pi/photobooth/photos/photo_*.jpg
    ↓
Load into PIL Image
    ↓
Convert to Grayscale
    ↓
Enhance Contrast & Brightness
    ↓
Save to /home/pi/photobooth/processing/processed_*.jpg
    ↓
Load 4 processed images
    ↓
Create photostrip layout
    ↓
Save to /home/pi/photobooth/output/photostrip_*.jpg
    ↓
CUPS Print Queue
    ↓
USB Photo Printer
    ↓
Physical 4x6 Print
```

### Metadata Flow

```
Session Initiated
    ↓
Photo 1 Captured → Log to Current Session
Photo 2 Captured → Log to Current Session
Photo 3 Captured → Log to Current Session
Photo 4 Captured → Log to Current Session
    ↓
Processing Complete
    ↓
Print Successful
    ↓
Submit Session to Dashboard
    ↓
Dashboard stores in PostgreSQL
    ↓
Frontend displays in analytics
```

## Error Handling

### Arduino Error States

```
Button Held >10s:     Emergency stop, LED blinks red
Camera Timeout:       Retry up to 3x, then error
Flash Failure:        Log and continue (non-critical)
Bluetooth Disconnect: Attempt reconnect every 5s
```

### Raspberry Pi Error States

```
Camera Not Found:     Log error, notify Arduino, halt capture
Printer Offline:      Queue job, retry every 30s
Disk Space Low:       Archive photos, clean processing dir
Processing Failure:   Log error, notify Arduino, request retry
Bluetooth Disconnect: Attempt reconnect, queue messages
Dashboard Unreachable: Log locally, retry on network recovery
```

### Dashboard Server Error Handling

```
Invalid Session Data:   Return 400, log validation error
Booth Not Registered:   Return 404, return registration instructions
Database Connection:    Return 503, implement queue + retry
Printer Offline:        Record in alerts, notify admin
```

## Performance Metrics

| Component | Task | Time | Notes |
|-----------|------|------|-------|
| Button Press | Debounce detection | 50ms | Hardware debounce |
| Countdown | User feedback | 3000ms | LED feedback only |
| Photo Capture | Single photo | 500-800ms | Camera + flash |
| 4x Photo Capture | All 4 photos | ~6s | 1.5s intervals |
| Image Processing | Per photo | 2-3s | Grayscale + enhance |
| 4x Image Processing | All 4 photos | ~8-12s | Can be parallel |
| Photostrip Gen | Layout + save | 2-3s | Single thread |
| Print Job | Submit to CUPS | 1-2s | Queue operation |
| Printing | Actual print | 15-30s | Thermal/inkjet speed |
| **Total Session Time** | Start to finish | ~50-60s | End-to-end |

## Scalability

### Single Booth
- Handles ~100 sessions/day
- Storage: ~2GB/day (4 photos @ 2MB each, 100 sessions)
- Bandwidth: Minimal (dashboard updates only)

### Multiple Booths (Future)
- Central dashboard monitors 10+ booths
- Shared database collects all metrics
- Real-time WebSocket updates
- Bulk export capabilities

## Security Considerations

1. **Bluetooth**: HC-05 paired, PIN protected
2. **Network**: HTTPS for dashboard communication
3. **Storage**: Photos encrypted at rest (optional)
4. **Access**: Booth firmware signed/authenticated
5. **Logging**: All actions audited in PostgreSQL

## Deployment Checklist

- [ ] Arduino flashed with photobooth_controller.ino
- [ ] Raspberry Pi OS installed and updated
- [ ] PiCamera2 module connected and enabled
- [ ] HC-05 Bluetooth paired with RPi
- [ ] CUPS printer configured and tested
- [ ] Dashboard server running and accessible
- [ ] Booth registered with dashboard
- [ ] All GPIO pins verified with multimeter
- [ ] Relay circuits tested independently
- [ ] Camera and flash mechanically mounted
- [ ] System tested end-to-end with test print
