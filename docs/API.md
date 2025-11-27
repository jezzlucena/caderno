# Project Caderno API Documentation

This document describes the REST API endpoints for Project Caderno.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

Most endpoints require authentication via JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| General API | 100 requests/minute |
| Authentication | 5 requests/minute |
| Email Operations | 3 requests/hour |
| Federation | 60 requests/minute |

---

## Authentication Endpoints

### Register a New User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "keySalt": "base64-encoded-salt"
}
```

**Errors:**
- `400` - Invalid email or password (min 8 characters)
- `400` - Email already registered

---

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "keySalt": "base64-encoded-salt"
}
```

**Errors:**
- `401` - Invalid credentials

---

### Verify Email

```http
GET /api/auth/verify-email/:token
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- `400` - Invalid or expired token

---

### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": true,
    "keySalt": "base64-encoded-salt",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Entries Endpoints

All entries are end-to-end encrypted. The server only stores encrypted data and never sees plaintext content.

### List All Entries

```http
GET /api/entries
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": 1,
      "encryptedTitle": "base64-encrypted-title",
      "encryptedContent": "base64-encrypted-content",
      "iv": "base64-iv",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Entry

```http
GET /api/entries/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "entry": {
    "id": 1,
    "encryptedTitle": "base64-encrypted-title",
    "encryptedContent": "base64-encrypted-content",
    "iv": "base64-iv",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `404` - Entry not found

---

### Create Entry

```http
POST /api/entries
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "encryptedTitle": "base64-encrypted-title",
  "encryptedContent": "base64-encrypted-content",
  "iv": "base64-iv"
}
```

**Response (201 Created):**
```json
{
  "entry": {
    "id": 1,
    "encryptedTitle": "base64-encrypted-title",
    "encryptedContent": "base64-encrypted-content",
    "iv": "base64-iv",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update Entry

```http
PUT /api/entries/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "encryptedTitle": "base64-encrypted-title",
  "encryptedContent": "base64-encrypted-content",
  "iv": "base64-iv"
}
```

**Response (200 OK):**
```json
{
  "entry": {
    "id": 1,
    "encryptedTitle": "base64-encrypted-title",
    "encryptedContent": "base64-encrypted-content",
    "iv": "base64-iv",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Errors:**
- `404` - Entry not found

---

### Delete Entry

```http
DELETE /api/entries/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Entry deleted"
}
```

**Errors:**
- `404` - Entry not found

---

## Dead Man's Switches Endpoints

### List All Switches

```http
GET /api/switches
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "switches": [
    {
      "id": 1,
      "name": "Personal Safety Switch",
      "timerDays": 7,
      "triggerMessage": "If you're receiving this...",
      "isActive": true,
      "hasTriggered": false,
      "lastCheckIn": "2024-01-01T00:00:00.000Z",
      "triggeredAt": null,
      "encryptedPayload": "base64-encrypted-pdf",
      "payloadIv": "base64-iv",
      "recipients": [
        {
          "id": 1,
          "email": "trusted@example.com",
          "name": "Trusted Contact"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Switch

```http
GET /api/switches/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "switch": {
    "id": 1,
    "name": "Personal Safety Switch",
    "timerDays": 7,
    ...
  }
}
```

---

### Create Switch

```http
POST /api/switches
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Safety Switch",
  "timerDays": 7,
  "triggerMessage": "If you're receiving this message...",
  "recipients": [
    {
      "email": "contact@example.com",
      "name": "John Doe"
    }
  ],
  "encryptedPayload": "base64-encrypted-pdf (optional)",
  "payloadIv": "base64-iv (optional)",
  "payloadKey": "base64-key (optional)"
}
```

**Response (201 Created):**
```json
{
  "switch": {
    "id": 1,
    "name": "My Safety Switch",
    ...
  }
}
```

**Validation:**
- `name`: 1-100 characters
- `timerDays`: 1-365
- `triggerMessage`: max 5000 characters
- `recipients`: 1-10, valid email addresses

---

### Update Switch

```http
PUT /api/switches/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "timerDays": 14,
  "triggerMessage": "Updated message",
  "isActive": true,
  "recipients": [...]
}
```

**Response (200 OK):**
```json
{
  "switch": { ... }
}
```

**Errors:**
- `400` - Cannot update a triggered switch
- `404` - Switch not found

---

### Delete Switch

```http
DELETE /api/switches/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Switch deleted"
}
```

---

### Check In (Single Switch)

```http
POST /api/switches/:id/check-in
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "switch": { ... },
  "message": "Check-in successful. Timer has been reset.",
  "nextDeadline": "2024-01-08T00:00:00.000Z"
}
```

**Errors:**
- `400` - Switch has already triggered
- `400` - Switch is not active

---

### Check In (All Switches)

```http
POST /api/switches/check-in-all
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Checked in to 3 switch(es)",
  "switches": [...]
}
```

---

### Get Triggered Switch Payload (Public)

```http
GET /api/switches/:id/payload
```

**No authentication required** - This endpoint is used by recipients to download triggered switch payloads.

**Response (200 OK):**
```json
{
  "encryptedPayload": "base64-encrypted-pdf",
  "payloadIv": "base64-iv",
  "switchName": "Personal Safety Switch",
  "triggeredAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `403` - Switch has not been triggered yet
- `404` - No payload available

---

## Federation Endpoints

### Get Federation Profile

```http
GET /api/federation/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "profile": {
    "username": "johndoe",
    "displayName": "John Doe",
    "bio": "Journalist and truth-seeker",
    "avatarUrl": null,
    "federationEnabled": true,
    "hasKeys": true,
    "actorUrl": "https://example.com/users/johndoe",
    "handle": "@johndoe@example.com",
    "followerCount": 42,
    "followingCount": 10
  }
}
```

---

### Setup Federation

```http
POST /api/federation/setup
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Optional bio text"
}
```

**Response (200 OK):**
```json
{
  "message": "Federation enabled successfully",
  "profile": {
    "username": "johndoe",
    "displayName": "John Doe",
    "bio": "Optional bio text",
    "handle": "@johndoe@example.com",
    "actorUrl": "https://example.com/users/johndoe"
  }
}
```

**Validation:**
- `username`: 3-30 characters, alphanumeric and underscores only

---

### Update Federation Profile

```http
PUT /api/federation/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "displayName": "New Display Name",
  "bio": "Updated bio",
  "federationEnabled": true
}
```

---

### Publish Entry to Fediverse

```http
POST /api/federation/publish
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "My Public Entry",
  "content": "This is **markdown** content that will be published publicly."
}
```

**Response (201 Created):**
```json
{
  "message": "Entry published successfully",
  "entry": {
    "id": 1,
    "title": "My Public Entry",
    "activityId": "https://example.com/activities/uuid",
    "published": "2024-01-01T00:00:00.000Z",
    "url": "https://example.com/entries/1"
  }
}
```

**Note:** Published entries are **NOT encrypted** and will be visible to anyone on the fediverse.

---

### List Published Entries

```http
GET /api/federation/published
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": 1,
      "title": "My Public Entry",
      "content": "Markdown content...",
      "activityId": "https://example.com/activities/uuid",
      "published": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Unpublish Entry

```http
DELETE /api/federation/published/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Entry unpublished successfully"
}
```

---

### Get Followers

```http
GET /api/federation/followers
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "followers": [
    {
      "actorUrl": "https://mastodon.social/users/someone",
      "since": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Following

```http
GET /api/federation/following
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "following": [
    {
      "actorUrl": "https://mastodon.social/users/someone",
      "pending": false,
      "since": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## ActivityPub Endpoints

These endpoints implement the ActivityPub protocol for federation.

### WebFinger

```http
GET /.well-known/webfinger?resource=acct:username@domain
```

**Response (200 OK):**
```json
{
  "subject": "acct:johndoe@example.com",
  "aliases": ["https://example.com/users/johndoe"],
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/johndoe"
    }
  ]
}
```

---

### Actor Profile

```http
GET /users/:username
Accept: application/activity+json
```

**Response (200 OK):**
```json
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
  "id": "https://example.com/users/johndoe",
  "type": "Person",
  "preferredUsername": "johndoe",
  "name": "John Doe",
  "summary": "Bio text",
  "inbox": "https://example.com/users/johndoe/inbox",
  "outbox": "https://example.com/users/johndoe/outbox",
  "followers": "https://example.com/users/johndoe/followers",
  "following": "https://example.com/users/johndoe/following",
  "publicKey": {
    "id": "https://example.com/users/johndoe#main-key",
    "owner": "https://example.com/users/johndoe",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

---

### User Inbox

```http
POST /users/:username/inbox
```

**Headers:** HTTP Signature required

Receives ActivityPub activities (Follow, Undo, Accept, Reject, etc.)

---

### User Outbox

```http
GET /users/:username/outbox
Accept: application/activity+json
```

Returns published activities as an OrderedCollection.

---

### Followers Collection

```http
GET /users/:username/followers
Accept: application/activity+json
```

---

### Following Collection

```http
GET /users/:username/following
Accept: application/activity+json
```

---

## Health Check

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid token |
| `403` | Forbidden - Access denied |
| `404` | Not Found |
| `429` | Too Many Requests - Rate limited |
| `500` | Internal Server Error |

---

## Client-Side Encryption

Project Caderno uses client-side encryption for journal entries. The encryption flow:

1. **Key Derivation**: User password + server-provided salt → PBKDF2 → AES-256 key
2. **Encryption**: AES-256-GCM with unique IVs for title and content
3. **Storage**: Only encrypted data + IV stored on server

The server **never** sees plaintext content or the encryption key.

### Encryption Parameters

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **IV Size**: 12 bytes (96 bits)
- **Salt Size**: 16 bytes (128 bits)
