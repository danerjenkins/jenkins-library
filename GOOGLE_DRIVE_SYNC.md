# Google Drive Sync Setup

This app supports manual Google Drive sync for backing up and restoring your library catalog.

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add your domain to **Authorized JavaScript origins**:
     - For local development: `http://localhost:5173`
     - For production: Add your deployed domain
   - Click "Create"
   - Copy the **Client ID**

### 2. Configure the App

When you first click "Push to Drive" or "Pull from Drive", you'll be prompted to enter your Google Client ID.

**Alternative**: Pre-configure it in localStorage:

```javascript
localStorage.setItem("googleClientId", "YOUR_CLIENT_ID_HERE");
```

### 3. Using Sync Features

#### Push to Drive

- Exports all local books to a JSON file
- Creates or updates `library-catalog-sync.json` in your Google Drive
- Only accessible by your app (file-scoped permission)

#### Pull from Drive

- Downloads the sync file from Google Drive
- Compares timestamps to detect conflicts
- If Drive data is older, shows a warning before overwriting
- Replaces all local books with Drive data after confirmation

### 4. Conflict Resolution

The app uses **last-write-wins** strategy:

- Compares `exportedAt` timestamp from Drive with local `updatedAt`
- If local data is newer, prompts for confirmation before overwriting
- No automatic merging - you choose which version to keep

## Security Notes

- **No secrets stored in code**: Client ID is user-provided
- **File-scoped access**: App only accesses files it created
- **Manual sync only**: No background/automatic syncing
- **IndexedDB is primary**: Drive is backup/sync, not primary storage

## Troubleshooting

### "Google Client ID not configured"

Enter your Client ID when prompted or set it in localStorage.

### "Not authenticated"

Click the sync button again to trigger Google sign-in.

### "Sync file not found"

Use "Push to Drive" first to create the sync file.

### CORS errors

Make sure your domain is added to "Authorized JavaScript origins" in Google Cloud Console.

## Data Format

The sync file (`library-catalog-sync.json`) contains:

```json
{
  "schemaVersion": 1,
  "exportedAt": 1234567890,
  "books": [
    {
      "id": "book_123_abc",
      "title": "Example Book",
      "author": "Author Name",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```
