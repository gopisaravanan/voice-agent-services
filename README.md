# Voice Agent Backend API

Production-ready Express.js API server for voice transcription, summarization, and email delivery.

> **New here?** Start with **[START_HERE.md](./START_HERE.md)** for quick setup guide!
>
> **Ready to deploy?** Check **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** for 5-minute deployment!

## Features

- 🎙️ Audio transcription using OpenAI Whisper
- 📝 AI-powered summarization using GPT-4o (5 bullet points + next steps)
- 📧 Email delivery with beautiful HTML templates
- 🔒 Production-grade security (Helmet, CORS, rate limiting)
- 📊 Structured logging with Winston
- 🐳 Docker support with health checks
- ⚡ Graceful shutdown handling
- 🛡️ Input validation and error handling

## Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key
- SMTP email account (Gmail, SendGrid, etc.)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required: OPENAI_API_KEY, SMTP_* variables

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username | `your@email.com` |
| `SMTP_PASS` | SMTP password | App password for Gmail |

### Optional (with defaults)
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

**Example `.env` file:**
```env
OPENAI_API_KEY=sk-your-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

## API Documentation

Base URL: `http://localhost:5000` (development) or your production URL

### Authentication
Currently no authentication required. Consider adding API keys for production use.

### Rate Limits
- General API: 100 requests per 15 minutes per IP
- File uploads: 10 requests per 15 minutes per IP  
- Email sending: 20 requests per hour per IP

---

### `GET /api/health`
Health check and configuration verification.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "server": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "nodeEnv": "production",
  "openaiConfigured": true,
  "smtpConfigured": true,
  "emailVerified": true
}
```

**Response (503 Service Unavailable):** When configuration is incomplete
```json
{
  "status": "degraded",
  "openaiConfigured": false,
  "smtpConfigured": true
}
```

---

### `POST /api/transcribe`
Transcribe audio file using OpenAI Whisper.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audio` (File, max 25MB)
- Supported formats: webm, wav, mp3, ogg

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/transcribe \
  -F "audio=@recording.webm"
```

**Response (200 OK):**
```json
{
  "success": true,
  "transcript": "This is the transcribed text from the audio file...",
  "fileSize": 245678
}
```

**Error Response (400/500):**
```json
{
  "error": "Transcription failed",
  "message": "Detailed error description"
}
```

---

### `POST /api/summarize`
Generate structured summary from transcript.

**Request:**
```json
{
  "transcript": "Long conversation text to summarize..."
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Your long text here..."}'
```

**Response (200 OK):**
```json
{
  "success": true,
  "summary": {
    "bullets": [
      "Key point 1 from the conversation",
      "Important decision made about X",
      "Discussion about Y feature",
      "Team member Z will handle task",
      "Meeting scheduled for next week"
    ],
    "nextStep": "Follow up with team on action items by Friday"
  },
  "transcriptLength": 1523
}
```

**Error Response (400/500):**
```json
{
  "error": "Summarization failed",
  "message": "Transcript cannot be empty"
}
```

---

### `POST /api/send-email`
Send or schedule email with conversation summary.

**Request:**
```json
{
  "email": "user@example.com",
  "summary": {
    "bullets": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
    "nextStep": "Action item"
  },
  "transcript": "Full transcript text...",
  "scheduleOption": "instant"
}
```

**Schedule Options:**
| Option | Delay | Use Case |
|--------|-------|----------|
| `instant` | None | Send immediately |
| `5min` | 5 minutes | Quick review before sending |
| `1hour` | 1 hour | Send during business hours |
| `1day` | 24 hours | Next day follow-up |

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "summary": {
      "bullets": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
      "nextStep": "Review and approve"
    },
    "transcript": "Full conversation transcript...",
    "scheduleOption": "instant"
  }'
```

**Response (200 OK - Instant):**
```json
{
  "success": true,
  "scheduled": false,
  "messageId": "<abc123@gmail.com>",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Email sent successfully"
}
```

**Response (200 OK - Scheduled):**
```json
{
  "success": true,
  "scheduled": true,
  "scheduledTime": "2024-01-01T13:00:00.000Z",
  "delay": "1 hour",
  "message": "Email scheduled to be sent in 1 hour"
}
```

**Error Response (400/500):**
```json
{
  "error": "Failed to send email",
  "message": "Invalid email address format"
}
```

## Project Structure

```
voice-agent-services/
├── config/
│   ├── logger.js          # Winston logging configuration
│   └── env.js             # Environment validation
├── middleware/
│   └── rateLimiter.js     # Rate limiting middleware
├── routes/
│   ├── health.js          # Health check endpoint
│   ├── transcribe.js      # Whisper transcription
│   ├── summarize.js       # GPT-4o summarization
│   └── email.js           # Email sending
├── services/
│   ├── openai.service.js  # OpenAI API integration
│   └── email.service.js   # Email & scheduling
├── uploads/               # Temporary file storage (auto-created)
├── logs/                  # Application logs (auto-created)
├── server.js              # Main server file
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── DEPLOYMENT.md          # Deployment guide
├── DEPLOYMENT_CHECKLIST.md # Pre-deployment checklist
└── package.json           # Dependencies and scripts
```

## Vercel Deployment (Production)

This application is configured for deployment on Vercel serverless platform.

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: production ready"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **"Add New Project"**
   - Import your GitHub repository
   - **Add Environment Variables**:
     - `OPENAI_API_KEY`
     - `SMTP_HOST`
     - `SMTP_PORT`
     - `SMTP_USER`
     - `SMTP_PASS`
     - `FRONTEND_URL`
   - Click **"Deploy"**

3. **Your API is live!**
   - URL: `https://your-project.vercel.app`
   - Auto-deploys on every push to main

### Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel

# Add environment variables
vercel env add OPENAI_API_KEY
# ... add other variables

# Deploy to production
vercel --prod
```

### ⚠️ Important: Vercel Plan

- **Hobby Plan** (Free): 10-second function timeout
  - May timeout on large audio files
  - Good for testing and small files

- **Pro Plan** ($20/month): 60-second timeout
  - Recommended for production
  - Better performance and analytics
  - Required for larger audio files

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete Vercel deployment guide.

Use **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** before deploying to production.

## Security Features

- ✅ **Helmet** - Security headers
- ✅ **CORS** - Restricted to frontend URL in production
- ✅ **Rate Limiting** - Prevents abuse
- ✅ **Input Validation** - All endpoints validate input
- ✅ **File Size Limits** - Max 25MB for uploads
- ✅ **Graceful Shutdown** - Handles SIGTERM/SIGINT
- ✅ **Error Handling** - No stack traces in production
- ✅ **Structured Logging** - Winston with log levels

## Monitoring & Logging

### Log Levels
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information (default in production)
- `debug` - Detailed debugging (development only)

### Vercel Logging
On Vercel, logs are automatically captured and viewable:

**Dashboard Logs:**
- Go to Vercel Dashboard → Your Project → Functions
- View real-time logs during development and production

**CLI Logs:**
```bash
# View logs
vercel logs [deployment-url]

# Real-time logs
vercel logs --follow
```

### Local Development Logs
```bash
# Development (colored console output)
npm run dev

# Logs include request details, errors, and performance metrics
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Brief error description",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input/validation error |
| 404 | Not Found | Route doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server/API error |
| 503 | Service Unavailable | Health check failed |

## Known Limitations

### Vercel Function Timeout
- **Hobby Plan**: 10-second timeout (may not work for large audio files)
- **Pro Plan**: 60-second timeout (recommended for production)
- Consider Pro plan if you see 504 timeout errors

### Email Scheduling
- Uses `setTimeout` - **not persistent across function executions**
- Lost on cold starts in serverless environment
- For production, consider:
  - Vercel Cron Jobs for scheduled tasks
  - Job queue (Bull/BullMQ with Redis)
  - Third-party scheduling service

### Rate Limiting
- Rate limit state is per-function instance
- Not shared across serverless functions
- For distributed rate limiting, use Vercel KV or Redis

## Development

### Prerequisites
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Adding Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name
```

## Contributing

1. Follow the coding standards in `.cursorrules`
2. Use structured logging (Winston) - no `console.log`
3. Add input validation for new endpoints
4. Update API documentation in README
5. Test all changes locally before committing

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env` file exists with all required variables
- Check spelling and format of variable names

### "Email configuration verification failed"
- Verify SMTP credentials
- For Gmail: use app password, not account password
- Check port (587 for TLS, 465 for SSL)

### "Transcription failed: Unauthorized"
- Check OpenAI API key is valid
- Verify API key has available credits

### "File too large"
- Whisper has 25MB limit
- Compress audio before uploading

## License

ISC

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Check application logs for errors
