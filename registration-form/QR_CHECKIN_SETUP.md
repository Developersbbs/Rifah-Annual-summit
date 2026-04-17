# QR Check-in Module - Setup Guide

## Overview
Production-grade QR check-in system with secure signed QR codes, offline support, and real-time validation.

## Features
- ✅ Secure HMAC-signed QR codes
- ✅ Primary + Secondary member check-in support
- ✅ Duplicate prevention with atomic database updates
- ✅ Offline queue with automatic retry
- ✅ Real-time scan logging and audit trail
- ✅ Admin-only access control
- ✅ Mobile-friendly scanner UI
- ✅ Audio and vibration feedback

## Installation

### 1. Dependencies
Already installed:
```bash
npm install qrcode react-qr-scanner @types/qrcode
```

### 2. Environment Variables
Add to your `.env.local` file:
```env
QR_SECRET=your-secure-random-secret-key-here
```

**Important:** Generate a secure random secret for production. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Audio Files (Optional)
Place audio files in `/public/` directory:
- `/public/success.mp3` - Success sound
- `/public/error.mp3` - Error sound

If not provided, audio feedback will be silent (no errors).

## Database Schema Changes

The Participant schema has been extended with:

```typescript
{
  qrSignature: String,           // Audit signature
  qrVersion: { type: Number, default: 1 },
  scanLogs: [
    {
      type: { type: String, enum: ["primary", "secondary"] },
      memberId: String,
      scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deviceId: String,
      timestamp: Date,
      status: { type: String, enum: ["success", "duplicate", "invalid", "expired"] }
    }
  ]
}
```

## Usage

### QR Generation (Automatic on Registration)
QR codes are automatically generated when participants register:

```typescript
// In register-participant.ts
const primaryQR = await generateQR(participant._id.toString())
const secondaryMemberQRs = await generateSecondaryMemberQR(participantId, memberId)
```

### Admin Scanner
Access the QR scanner at: `/admin/checkin/qr-scanner`

**Features:**
- Full-screen camera view
- Real-time validation
- Success/error feedback with audio and vibration
- Offline queue indicator
- Recent scan history
- Duplicate prevention

### API Endpoint
`POST /api/checkin/qr`

**Request:**
```json
{
  "qr": "{\"payload\":\"...\",\"sig\":\"...\"}"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Primary checked in successfully",
  "participantName": "John Doe"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Already checked in"
}
```

## Security Features

### 1. HMAC Signature Verification
Every QR code contains:
- Payload: `{ pId, sId, exp }`
- Signature: HMAC-SHA256(payload, QR_SECRET)

### 2. Expiration
QR codes expire after 24 hours (configurable)

### 3. Access Control
Only users with `admin` or `super-admin` roles can check in participants

### 4. Audit Trail
All scans are logged with:
- Scanner user ID
- Device/user-agent
- Timestamp
- Status (success/duplicate/invalid/expired)

## Offline Support

### How It Works
1. When network fails, scans are queued in localStorage
2. Queue syncs every 3 seconds when online
3. Failed retries are marked and preserved

### Queue Structure
```typescript
interface OfflineQueueItem {
  qr: string
  timestamp: number
  status: "pending" | "done" | "failed"
}
```

### Usage
```typescript
import { useOfflineQueue } from "@/hooks/use-offline-queue"

const { isOnline, queueSize, addToQueue, clearQueue } = useOfflineQueue()
```

## Check-in Flow

### Primary Member Check-in
1. Scan QR code (no secondary member ID)
2. Verify signature and expiration
3. Atomic database update:
   ```typescript
   Participant.updateOne(
     { _id: pId, "checkIn.isCheckedIn": false },
     { $set: { "checkIn.isCheckedIn": true, ... } }
   )
   ```
4. Log scan in scanLogs array
5. Return success

### Secondary Member Check-in
1. Scan QR code (with secondary member ID)
2. Verify signature and expiration
3. Find secondary member in participant.secondaryMembers
4. Check if already checked in
5. Update member.isCheckedIn and member.checkedInAt
6. Log scan in scanLogs array
7. Update overall check-in status
8. Return success

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| Fake QR | Reject with "Invalid QR signature" |
| Expired QR | Reject with "QR expired" |
| Duplicate check-in | Reject with "Already checked in" |
| Invalid participant | Reject with "Invalid participant" |
| Not approved | Reject with "Participant is not approved" |
| Not registered | Reject with "Participant is not registered" |
| Network failure | Queue for retry |
| Unauthorized user | Return 401 Unauthorized |

## Testing

### Test QR Generation
```typescript
import { generateQR } from "@/lib/qr-generator"

const qr = await generateQR("participant-id")
console.log(qr) // Data URL
```

### Test QR Verification
```typescript
import { verifyQR } from "@/lib/qr-generator"

const result = verifyQR(qrDataString)
console.log(result) // { valid: boolean, payload?: QRPayload, error?: string }
```

### Test Check-in API
```bash
curl -X POST http://localhost:3000/api/checkin/qr \
  -H "Content-Type: application/json" \
  -d '{"qr":"{\"payload\":\"...\",\"sig\":\"...\"}"}'
```

## Files Created/Modified

### New Files
- `/lib/qr-generator.ts` - QR generation and verification utilities
- `/components/qr-scanner.tsx` - Scanner UI component
- `/hooks/use-offline-queue.ts` - Offline queue management
- `/app/api/checkin/qr/route.ts` - Check-in API endpoint
- `/app/admin/checkin/qr-scanner/page.tsx` - Admin scanner page
- `/types/react-qr-scanner.d.ts` - TypeScript declarations

### Modified Files
- `/models/Participant.ts` - Added QR fields
- `/app/actions/register-participant.ts` - Integrated QR generation

## Troubleshooting

### QR Scanner Not Working
- Ensure camera permissions are granted
- Check HTTPS requirement (browsers require HTTPS for camera access)
- Verify react-qr-scanner is compatible with your browser

### Check-in Failing
- Verify QR_SECRET is set in environment
- Check participant approval status
- Ensure user has admin/super-admin role
- Check network connectivity

### Offline Queue Not Syncing
- Verify localStorage is enabled
- Check browser console for errors
- Ensure API endpoint is accessible

## Production Checklist

- [ ] Set secure QR_SECRET in production environment
- [ ] Enable HTTPS for camera access
- [ ] Add success/error audio files
- [ ] Test on mobile devices
- [ ] Verify offline queue functionality
- [ ] Monitor scan logs for anomalies
- [ ] Set up alerts for failed check-ins
- [ ] Document QR code distribution process

## API Rate Limiting (Optional)
Consider adding rate limiting to `/api/checkin/qr` to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## Future Enhancements

- [ ] Real-time dashboard with Socket.io
- [ ] QR code email delivery
- [ ] Bulk check-in import
- [ ] Analytics and reporting
- [ ] Multi-event support
- [ ] QR code regeneration
- [ ] Print-ready QR templates
