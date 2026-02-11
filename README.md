# Voice Agent Backend API

Express.js API server for voice transcription, summarization, and email delivery.

## Features

- Audio transcription using OpenAI Whisper
- Text summarization using GPT-4o
- Email delivery with Nodemailer
- Email scheduling with node-cron
- File upload handling with Multer
- CORS support

## Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with nodemon)
npm run dev
```

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## API Documentation

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "server": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "openaiConfigured": true,
  "smtpConfigured": true,
  "emailVerified": true
}
```

### POST /api/transcribe
Transcribe audio file.

**Request:**
- Content-Type: multipart/form-data
- Body: `audio` (File)

**Response:**
```json
{
  "success": true,
  "transcript": "Transcribed text...",
  "fileSize": 123456
}
```

### POST /api/summarize
Generate summary from transcript.

**Request:**
```json
{
  "transcript": "Long text to summarize..."
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "bullets": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
    "nextStep": "Clear action item"
  },
  "transcriptLength": 500
}
```

### POST /api/send-email
Send or schedule email.

**Request:**
```json
{
  "email": "user@example.com",
  "summary": {
    "bullets": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
    "nextStep": "Action item"
  },
  "transcript": "Full transcript...",
  "scheduleOption": "instant"
}
```

**Schedule Options:**
- `instant`: Send immediately
- `5min`: Send in 5 minutes
- `1hour`: Send in 1 hour
- `1day`: Send in 1 day

**Response:**
```json
{
  "success": true,
  "scheduled": false,
  "messageId": "...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Email sent successfully"
}
```

## Project Structure

```
voice-agent-services/
├── routes/
│   ├── health.js         # Health check endpoint
│   ├── transcribe.js     # Whisper transcription
│   ├── summarize.js      # GPT-4o summarization
│   └── email.js          # Email sending
├── services/
│   ├── openai.service.js # OpenAI integration
│   └── email.service.js  # Email & scheduling
├── uploads/              # Temporary file storage
├── server.js             # Main server file
├── .env                  # Environment variables
└── package.json
```

## Deployment

### Railway
1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

### Render
1. Create Web Service
2. Set root directory to `voice-agent-services`
3. Build: `npm install`
4. Start: `npm start`
5. Add environment variables
6. Deploy

## Error Handling

All endpoints return errors in the format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common status codes:
- 200: Success
- 400: Bad request (validation error)
- 500: Server error (API failures)
- 503: Service unavailable (health check fail)
