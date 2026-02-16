# Blackboard Learn SCORM xAPI Listener

A lightweight xAPI Learning Record Store (LRS) specifically designed for tracking Blackboard Learn SCORM content.

## ⚠️ Disclaimer

- **This is experimental software for demonstration and testing purposes only** and should not be used in a production setting
- No support or warranty is provided
- Blackboard Inc retains copyright
- For questions, contact: jeff.kelley@anthology.com

## Features

- ✅ xAPI 1.0.3 compliant for Blackboard Learn
- 🎓 Designed for SCORM content tracking
- 🔐 Simple authentication (Key: `key`, Secret: `secret`)
- 📊 Real-time dashboard to view SCORM interactions
- 🧪 Built-in test statement sender
- 🚀 Easy deployment to Render.com (FREE with HTTPS)

## Quick Start (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

**Note:** Blackboard requires HTTPS, so local testing won't work with actual Blackboard integration. You must deploy to get HTTPS.

## Deploy to Render.com (FREE + HTTPS Required for Blackboard)

Blackboard Learn requires HTTPS endpoints. Render.com provides free HTTPS hosting.

1. Push this code to a GitHub repository

2. Go to [Render.com](https://render.com) and sign up/login

3. Click "New +" → "Web Service"

4. Connect your GitHub repository

5. Configure:
   - **Name**: `blackboard-scorm-lrs` (or whatever you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

6. Click "Create Web Service"

7. Wait for deployment (2-3 minutes)

8. Your LRS will be available at: `https://your-app-name.onrender.com` (with HTTPS!)

9. Visit the URL to see your endpoint!

## Configure in Blackboard Learn

After deploying, configure your SCORM package or LTI settings:

### Method 1: SCORM Package Configuration
1. Before uploading SCORM package, edit the package settings
2. Enable xAPI tracking
3. Enter LRS details:
   - **Endpoint**: `https://your-app-name.onrender.com/xapi`
   - **Key**: `key`
   - **Secret**: `secret`

### Method 2: Blackboard LTI Tool Provider (System-wide)
1. Go to **Admin Panel** → **Tools and Utilities** → **LTI Tool Providers**
2. Click **Register Provider Domain**
3. Enter:
   - **Provider Domain**: `your-app-name.onrender.com`
   - **LRS Endpoint**: `https://your-app-name.onrender.com/xapi`
   - **Key**: `key`
   - **Secret**: `secret`
4. Save configuration

### Method 3: Building Block or Content Handler
Check your SCORM upload settings for xAPI/LRS configuration fields.

## Testing

After configuration:
1. Have a student (or test account) access the SCORM content in Blackboard
2. View the dashboard at `https://your-app-name.onrender.com`
3. You should see statements like:
   - "Student initialized the course"
   - "Student completed Module 1"
   - "Student scored 95% on Quiz 2"

## What You'll See

The LRS captures all SCORM interactions:
- ✅ Course launches
- ✅ Page views
- ✅ Completions
- ✅ Quiz attempts and scores
- ✅ Time spent
- ✅ Progress tracking

## API Endpoints

### `GET /xapi` or `GET /xapi/about`
Returns LRS version info (used by Blackboard for validation)

### `POST /xapi/statements`
Submit xAPI statements (requires Basic Auth)

**Headers:**
```
Authorization: Basic a2V5OnNlY3JldA==  (base64 of "key:secret")
Content-Type: application/json
X-Experience-API-Version: 1.0.3
```

### `GET /xapi/statements`
Retrieve statements (requires Basic Auth)

### `GET /api/statements`
Get all statements for dashboard (no auth)

### `DELETE /api/statements`
Clear all statements (no auth)

## Credentials

**Fixed credentials for simplicity:**
- **Key**: `key`
- **Secret**: `secret`

To use custom credentials, set environment variables:
- `XAPI_KEY`: Your custom key
- `XAPI_SECRET`: Your custom secret

## Limitations

⚠️ **This is a lightweight testing LRS:**
- Stores statements in memory (cleared on restart)
- Limited to 1000 most recent statements
- No persistent storage or database
- Not for production use with thousands of students

For production Blackboard deployments, consider:
- Learning Locker (open source, self-hosted)
- Watershed LRS (commercial)
- Veracity Learning (commercial)

## Troubleshooting

**"xAPI Version 1.0.3 is invalid or not supported"**
- Make sure you're using the `/xapi` endpoint (not `/xapi/statements`)
- Verify you deployed and are using HTTPS

**"Unauthorized" or "Invalid credentials"**
- Double-check Key: `key` and Secret: `secret` (lowercase)
- Verify Basic Auth is enabled in Blackboard

**No statements appearing**
- Check Render logs for incoming requests
- Verify SCORM package has xAPI enabled
- Test with the "Send Test Statement" button first

## License

MIT
