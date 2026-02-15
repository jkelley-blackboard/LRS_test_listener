# xAPI LRS Listener

A lightweight, deployable xAPI (Experience API) Learning Record Store listener with authentication.

## Features

- ✅ xAPI 1.0.3 compliant statement validation
- 🔐 HTTP Basic Authentication (Key + Secret)
- 📊 Real-time dashboard to view incoming statements
- 🎯 Valid/Invalid statement tracking
- 🧪 Built-in test statement sender
- 🚀 Easy deployment to Render.com or Railway.app

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

4. Copy the credentials shown in the dashboard to your xAPI source system

## Deploy to Render.com (FREE)

1. Push this code to a GitHub repository

2. Go to [Render.com](https://render.com) and sign up/login

3. Click "New +" → "Web Service"

4. Connect your GitHub repository

5. Configure:
   - **Name**: `xapi-lrs-listener` (or whatever you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

6. Click "Create Web Service"

7. Wait for deployment (2-3 minutes)

8. Your LRS will be available at: `https://your-app-name.onrender.com`

9. Visit the URL to get your credentials!

### Optional: Set Custom Credentials on Render

Add environment variables in Render dashboard:
- `XAPI_KEY`: Your custom key
- `XAPI_SECRET`: Your custom secret

## Deploy to Railway.app (FREE)

1. Push this code to a GitHub repository

2. Go to [Railway.app](https://railway.app) and sign up/login

3. Click "New Project" → "Deploy from GitHub repo"

4. Select your repository

5. Railway will auto-detect Node.js and deploy

6. Click on your deployment → "Settings" → "Generate Domain"

7. Your LRS will be available at the generated domain!

### Optional: Set Custom Credentials on Railway

In the "Variables" tab, add:
- `XAPI_KEY`: Your custom key
- `XAPI_SECRET`: Your custom secret

## Using with Your xAPI Source System

After deployment, you'll get:

1. **Endpoint URL**: `https://your-app.onrender.com/xapi/statements`
2. **Key**: Shown in the dashboard (or your custom key)
3. **Secret**: Shown in the dashboard (or your custom secret)

Enter these three values in your xAPI source system (LMS, authoring tool, etc.)

## Supported xAPI Source Systems

This LRS works with:
- Articulate Storyline 360
- Adobe Captivate
- Adapt Learning
- H5P
- Any xAPI-compliant content or LMS

## API Endpoints

### POST `/xapi/statements`
Submit xAPI statements (requires Basic Auth)

**Headers:**
```
Authorization: Basic base64(key:secret)
Content-Type: application/json
X-Experience-API-Version: 1.0.3
```

**Body:** xAPI statement JSON

### GET `/xapi/statements`
Retrieve statements (requires Basic Auth)

### GET `/api/statements`
Get all statements for dashboard (no auth)

### GET `/api/credentials`
Get server credentials (no auth)

### DELETE `/api/statements`
Clear all statements (no auth)

## Statement Validation

The LRS validates:
- ✅ Required properties (actor, verb, object)
- ✅ Actor IFI (Inverse Functional Identifier)
- ✅ Verb ID (must be valid IRI/URL)
- ✅ Activity ID (must be valid IRI/URL)
- ✅ Timestamp format (ISO 8601)

Invalid statements are stored but flagged for review.

## Limitations

⚠️ **This is a lightweight testing LRS:**
- Stores statements in memory (cleared on restart)
- Limited to 1000 most recent statements
- No persistent storage or database
- Single server instance only

For production use with thousands of statements, consider:
- Learning Locker (open source)
- Watershed LRS (commercial)
- SCORM Cloud (commercial)

## Environment Variables

- `PORT`: Server port (default: 3000)
- `XAPI_KEY`: Authentication key (auto-generated if not set)
- `XAPI_SECRET`: Authentication secret (auto-generated if not set)

## License

MIT
