# Cloud Sync Setup Guide

## Overview

Cloud Sync in Caderno allows you to securely backup and synchronize your journal entries across devices using decentralized IPFS (InterPlanetary File System) storage with end-to-end encryption. Your data is encrypted locally before being uploaded, ensuring that only you can access your journal entries.

## Visual Guide

### Main Interface - Accessing Cloud Sync

```
┌─────────────────────────────────────────────────────────────┐
│  Caderno                                            ☰ Menu ←─┐
├─────────────────────────────────────────────────────────────┤│
│                                                             ││
│  Your Journal Entries...                                    ││
│                                                             ││
└─────────────────────────────────────────────────────────────┘│
                                                               │
  Click Menu → Cloud Sync ─────────────────────────────────────┘
```

### Settings Screen - Cloud Sync Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                              ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🌐 Language                                      > │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ✨ AI Autocomplete                               > │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ☁️ Cloud Sync (IPFS Blockchain)                  > │←────┤
│  │ Sync your entries across devices securely          │     │
│  └────────────────────────────────────────────────────┘     │
│  ↑ Click here to configure Cloud Sync                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🕐 Scheduled Exports                             > │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cloud Sync Configuration Screen

```
┌─────────────────────────────────────────────────────────────┐
│  ← Settings          Cloud Sync                        ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  How to Get Your API Key                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. Visit files.lighthouse.storage                  │     │
│  │ 2. Create a free account                           │     │
│  │ 3. Generate your API key                           │     │
│  │ → Get your key here ────────────────────────────── │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  🔑 Lighthouse API Key                                      │
│  ┌────────────────────────────────────────────┐ [Show]      │
│  │ 7c9fd9••••••••••••••••••••••••••••         │←─ Paste     │
│  └────────────────────────────────────────────┘   here      │
│                                                             │
│  🔐 Sync Passphrase                                         │
│  ┌────────────────────────────────────────────┐ [Show]      │
│  │ ••••••••••••••••••••••••••••••••••         │←─ Create    │
│  └────────────────────────────────────────────┘   strong    │
│  ⚠️ Remember this! You'll need it to decrypt your data      │
│                                                             │
│  ☑️ Enable automatic sync                                   │
│  Automatically backup after each change                     │
│                                                             │
│                                          [Cancel]  [Save]   │
└─────────────────────────────────────────────────────────────┘
```

### Cloud Sync Modal - Upload & Download

```
┌─────────────────────────────────────────────────────────────┐
│  Cloud Sync                                            ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📤 Upload to IPFS                                          │
│  Back up 15 entries to IPFS with encryption                 │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │           [☁️ Upload to IPFS]  ←────── Click       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  Last synced: Today at 3:45 PM                              │
│  CID: QmX3j9F2kd...                                         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  📥 Download from IPFS                                      │
│  Restore entries from your last backup                      │
│                                                             │
│  ☑️ Merge with existing entries                             │
│  Keep local entries + add cloud entries                     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │        [⬇️ Download from IPFS]  ←────── Click      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│                                                   [Close]   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow - How It Works

```
┌──────────────┐
│ Your Device  │
│              │
│  📝 Entries  │
└──────┬───────┘
       │
       │ 1. Encrypt locally
       │    (AES-256)
       ↓
┌──────────────────┐
│ Encrypted Data   │
│ 🔒 [cipher text] │
└──────┬───────────┘
       │
       │ 2. Upload via
       │    Lighthouse API
       ↓
┌──────────────────┐      ┌──────────────────┐
│ IPFS Network     │──────│ Multiple Nodes   │
│                  │      │ (Distributed)    │
│ CID: QmX3j9...   │      │                  │
└──────────────────┘      └──────────────────┘
       │
       │ 3. Download when needed
       │    (from any device)
       ↓
┌──────────────┐
│ New Device   │
│              │
│  📝 Decrypt  │
│  ✅ Restored │
└──────────────┘
```

## Features

- **Decentralized Storage**: Uses IPFS blockchain technology for redundancy
- **End-to-End Encryption**: Your data is encrypted before upload
- **Cross-Device Sync**: Access your entries from any device
- **Manual or Automatic**: Sync on-demand or automatically
- **Free Storage**: Uses Lighthouse's free IPFS storage tier

## Security & Privacy

### How Your Data is Protected

1. **Local Encryption**: Data is encrypted on your device before upload
2. **Passphrase-Based**: Only you know the passphrase to decrypt
3. **No Plain Text**: Lighthouse never sees your unencrypted data
4. **IPFS Distribution**: Data is distributed across multiple nodes for redundancy

### What Gets Encrypted

- All journal entry content
- Entry titles
- Timestamps and metadata
- Everything except the Content Identifier (CID)

## Setup Instructions

### Step 1: Get Your Lighthouse API Key

1. Visit [files.lighthouse.storage](https://files.lighthouse.storage)
2. Sign up for a free account (you can use Google or GitHub)
3. Go to the "API Key" section in your dashboard
4. Click "Create New API Key" or "Generate API Key"
5. Give it a name (e.g., "Caderno Journal Sync")
6. Copy your API key

### Step 2: Configure Cloud Sync in Caderno

1. Open Caderno
2. Click the menu button (☰) in the top right
3. Select "Settings"
4. Navigate to "Cloud Sync (IPFS Blockchain)" section
5. Paste your Lighthouse API key in the "Lighthouse API Key" field
6. Enter a strong passphrase in the "Sync Passphrase" field
   - **IMPORTANT**: Remember this passphrase! You'll need it to decrypt your data
   - Use a strong, unique passphrase (mix of letters, numbers, symbols)
   - Store it safely (password manager recommended)
7. (Optional) Enable "Enable automatic sync" to sync after every change
8. Click "Save"

**⚠️ Critical**: Your passphrase is used to encrypt your data. If you lose it, your encrypted data cannot be recovered!

### Step 3: Upload Your First Backup

1. Click the menu button (☰) in the top right
2. Select "Cloud Sync"
3. Click "Upload to IPFS"
4. Wait for the upload to complete
5. You'll receive a CID (Content Identifier) - this is your backup's address on IPFS

### Step 4: Download/Restore from Backup

1. Click the menu button (☰) in the top right
2. Select "Cloud Sync"
3. Click "Download from IPFS"
4. Choose whether to merge with existing entries or replace them
5. Your entries will be decrypted and restored

## Usage Guide

### Manual Sync

**Uploading:**
1. Open Cloud Sync modal
2. Click "Upload to IPFS"
3. Your entries are encrypted and uploaded
4. Save the CID shown for reference

**Downloading:**
1. Open Cloud Sync modal
2. Click "Download from IPFS"
3. Choose merge or replace option
4. Your entries are downloaded and decrypted

### Automatic Sync

When enabled:
- Changes are automatically uploaded after every edit
- New backup created on IPFS for each significant change
- Latest CID is always stored locally

To enable:
1. Go to Settings → Cloud Sync
2. Check "Enable automatic sync"
3. Click "Save"

## Technical Details

### Architecture

```
Your Device → Encryption (AES-256) → Lighthouse API → IPFS Network → Distributed Storage
```

### Encryption Spec

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV**: Randomly generated for each encryption
- **Salt**: Unique salt for each backup

### IPFS & Content Addressing

- **CID**: Content Identifier - unique hash of your encrypted data
- **Immutability**: Once uploaded, content cannot be changed
- **Redundancy**: Data replicated across multiple IPFS nodes
- **Retrieval**: Use CID to retrieve data from any IPFS gateway

### Storage Limits

Lighthouse free tier includes:
- Limited storage space (check Lighthouse for current limits)
- Rate limiting on API calls
- For large journals, consider upgrading to a paid Lighthouse plan

## Syncing Across Devices

### Initial Setup on New Device

1. Install Caderno on the new device
2. Configure Cloud Sync with same API key
3. **Use the exact same passphrase** as your original device
4. Download from IPFS
5. Your entries will be decrypted and available

### Keeping Devices in Sync

**Manual Method:**
1. After making changes on Device A, upload to IPFS
2. On Device B, download from IPFS
3. Repeat as needed

**Automatic Method:**
1. Enable automatic sync on all devices
2. Each device uploads changes automatically
3. Manually download on other devices to get latest changes

**Note**: There is no real-time sync. You must manually download to get updates from other devices.

## Troubleshooting

### "No API key" error

- Make sure you've entered your Lighthouse API key in Settings
- Verify the API key is copied correctly
- Try generating a new API key from Lighthouse

### "No passphrase" error

- Enter a passphrase in Settings → Cloud Sync
- The passphrase field cannot be empty

### "Incorrect passphrase" error

- You're using a different passphrase than when data was encrypted
- Double-check your passphrase (case-sensitive)
- If forgotten, the data cannot be recovered

### Upload/Download failures

- Check your internet connection
- Verify your Lighthouse API key is valid
- Check Lighthouse dashboard for API usage limits
- Try again in a few moments (rate limiting)

### "No backup found" error

- You haven't uploaded any data yet
- The CID stored locally may be incorrect
- Upload a new backup first

### Merge vs Replace

**Merge:**
- Combines cloud entries with local entries
- Keeps all unique entries from both
- Duplicates are deduplicated by entry ID

**Replace:**
- Deletes all local entries
- Replaces with entries from cloud
- Use with caution!

## Best Practices

### Security

1. **Strong Passphrase**: Use a unique, complex passphrase
2. **Password Manager**: Store your passphrase in a password manager
3. **Backup Passphrase**: Write it down and store securely offline
4. **Don't Share**: Never share your passphrase with anyone
5. **Different from Lighthouse**: Use different passwords for Lighthouse account vs encryption passphrase

### Sync Strategy

1. **Regular Backups**: Upload backups regularly (daily recommended)
2. **Before Major Changes**: Upload before making significant edits
3. **Multiple Devices**: Always download before making changes on another device
4. **Verify**: Occasionally test downloading to ensure backups work

### Storage Management

1. **Monitor Usage**: Check Lighthouse dashboard for storage usage
2. **Clean Old Backups**: Old CIDs still consume space
3. **Upgrade if Needed**: Consider paid Lighthouse plan for large journals

## Privacy Considerations

### What Lighthouse Can See

- Your API key
- Upload/download activity timestamps
- Size of encrypted data
- Your CID (content identifier)

### What Lighthouse Cannot See

- Your journal entry content
- Entry titles or metadata
- Your encryption passphrase
- Anything inside your encrypted data

### What IPFS Network Can See

- Encrypted data blobs
- CIDs
- Data size
- Network transfer activity

### What IPFS Network Cannot See

- What's inside the encrypted data
- Who the data belongs to (unless linked to your identity)

## Removing Cloud Sync

To disable Cloud Sync:

1. Go to Settings → Cloud Sync
2. Click "Clear cloud sync settings"
3. Confirm the removal

This will:
- Remove your API key and passphrase from local storage
- Keep your existing journal entries intact
- Your data remains on IPFS (but you can't access it without the CID and passphrase)

## Recovery Scenarios

### Lost Passphrase

**⚠️ Not Recoverable**
- If you lose your passphrase, encrypted data cannot be decrypted
- This is by design for security
- Always keep your passphrase backed up securely

### Lost Lighthouse API Key

**✅ Recoverable**
- Generate a new API key from Lighthouse dashboard
- Update in Settings → Cloud Sync
- Your encrypted data on IPFS is not affected

### Lost CID

**⚠️ Challenging**
- Check Lighthouse dashboard for recent uploads
- Look through device local storage
- If completely lost, you'll need to create a new backup

### Corrupted Data

**✅ Recoverable (if you have backup)**
- Download from an earlier backup using a different CID
- Create a fresh upload
- Consider keeping multiple CID backups

## Support

For issues related to:
- **Lighthouse Service**: Contact Lighthouse support
- **IPFS Network**: Check IPFS status and documentation
- **Caderno Integration**: Report bugs using the `/reportbug` command in Caderno chat

## Additional Resources

- [Lighthouse Documentation](https://docs.lighthouse.storage/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Understanding Content Addressing](https://docs.ipfs.tech/concepts/content-addressing/)
- [Web3 Storage Best Practices](https://web3.storage/docs/)
