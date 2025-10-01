# Deprecated Services

## Files in this directory

### evolution-api.deprecated.ts
- **Original:** `evolution-api.ts`
- **Deprecated:** 2025-10-01
- **Reason:** Replaced by `evolution-api-unified.ts`
- **Details:** Basic Evolution API service with limited functionality. Consolidated into unified service.

### evolution.deprecated.ts
- **Original:** `evolution.ts`
- **Deprecated:** 2025-10-01
- **Reason:** Replaced by `evolution-api-unified.ts`
- **Details:** Extended Evolution API service with message sending. Consolidated into unified service.

## Migration Guide

### Old Import (evolution-api.ts)
```typescript
import { getEvolutionAPIService } from '../services/evolution-api';
```

### Old Import (evolution.ts)
```typescript
import { EvolutionService } from '../services/evolution';
```

### New Import (Unified)
```typescript
import { getEvolutionAPIService } from '../services/evolution-api-unified';
```

## API Changes

### Removed Methods (Not Available in Evolution API v2.3.0)
- `fetchContacts()` - ❌ Returns 404
- `fetchChats()` - ❌ Returns 404
- `fetchMessages()` - ❌ Returns 404
- `sendButtons()` - ❌ Deprecated by WhatsApp
- `sendList()` - ❌ Deprecated by WhatsApp

**Alternative:** Use webhook-based synchronization for contacts and chats:
- Configure webhooks with events: `CONTACTS_UPSERT`, `CHATS_SET`, `CHATS_UPSERT`
- Process webhook payloads in real-time

### Available Methods
- ✅ `createInstance()` - Create WhatsApp instance
- ✅ `connect()` - Get QR code for connection
- ✅ `getConnectionState()` - Check instance status
- ✅ `logout()` - Disconnect instance
- ✅ `deleteInstance()` - Delete instance permanently
- ✅ `listInstances()` - List all instances
- ✅ `restartInstance()` - Restart instance
- ✅ `sendText()` - Send text message
- ✅ `sendMedia()` - Send media (image/video/audio/document)
- ✅ `setWebhook()` - Configure webhook
- ✅ `getWebhook()` - Get webhook configuration
- ✅ `updateProfileName()` - Update profile name
- ✅ `updateProfileStatus()` - Update profile status

## When to Remove These Files

These deprecated files can be safely removed after:
1. All references in codebase are updated to use `evolution-api-unified.ts`
2. Backend is deployed and tested in production
3. No rollback is needed (minimum 1 week after deployment)

**Estimated Safe Removal Date:** 2025-10-08 or later
