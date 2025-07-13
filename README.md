# Monday.com Batch Webhook + Fly.io

Production-ready Monday.com webhook service that automatically generates 6-digit batch codes when tasks are created. Built with Next.js 14 and deployed on Fly.io.

## Features

✅ **Monday.com Integration** - Automatic batch code generation on task creation  
✅ **Next.js 14** with App Router and TypeScript  
✅ **Fly.io deployment** with auto-scaling  
✅ **Docker + docker-compose** for local development  
✅ **6-digit alphanumeric codes** using nanoid  
✅ **Production observability** with structured logging  
✅ **Challenge verification** for Monday.com webhook setup  

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo> monday-batch-webhook
cd monday-batch-webhook
npm install
```

### 2. Configure Monday.com
```bash
# Set your Monday.com API key
export MONDAY_API_KEY="your_monday_api_key"

# Find your board and column IDs
node scripts/list-boards.js
node scripts/get-board-columns.js <BOARD_ID>

# Set environment variables
export MONDAY_BOARD_ID="your_board_id"
export MONDAY_COLUMN_ID="your_text_column_id"
```

### 3. Local Development
```bash
# Start development server
npm run dev
# Visit: http://localhost:3005/api/webhook

# Test with Docker
docker-compose up --build
```

### 4. Deploy to Fly.io

**First time setup:**
```bash
# Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
fly auth login

# Launch app (will create fly.toml)
fly launch --name monday-batch-webhook --region sea

# Set your secrets
fly secrets set MONDAY_API_KEY="your_monday_api_key"
fly secrets set MONDAY_BOARD_ID="your_board_id" 
fly secrets set MONDAY_COLUMN_ID="your_text_column_id"

# Deploy
fly deploy
```

**Subsequent deployments:**
```bash
# Just push to main branch - GitHub Actions will auto-deploy
git push origin main

# Or deploy manually
fly deploy
```

### 5. Configure Monday.com Webhook
1. Get your Fly.io URL: `https://monday-batch-webhook.fly.dev`
2. In Monday.com, go to your board → Integrations → Webhooks
3. Add webhook URL: `https://monday-batch-webhook.fly.dev/api/webhook`
4. Select events: "When an item is created"
5. Test by creating a task - should auto-populate with batch code!

## How It Works

1. **Task Creation**: Someone creates a task in your Monday.com board
2. **Webhook Triggered**: Monday.com sends POST to `/api/webhook`
3. **Code Generated**: System generates 6-digit code (e.g., "ABC123")
4. **Column Updated**: Code is written to your specified column via Monday.com API
5. **Logging**: All actions logged for debugging

## Environment Variables

Required for production:

```bash
MONDAY_API_KEY=your_monday_api_token
MONDAY_BOARD_ID=your_board_id_number
MONDAY_COLUMN_ID=your_text_column_id
```

## Project Structure

```
├── app/
│   ├── api/webhook/route.ts    # Main webhook endpoint
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Status page
├── lib/
│   ├── code-generator.ts       # 6-digit code generation
│   └── monday-api.ts           # Monday.com API client
├── scripts/
│   ├── list-boards.js          # Find your boards
│   └── get-board-columns.js    # Find column IDs
├── fly.toml                    # Fly.io configuration
├── Dockerfile                  # Production container
└── .github/workflows/          # Auto-deployment
```

## API Endpoints

### `GET /api/webhook`
Returns service status and configuration check.

**Response:**
```json
{
  "status": "ready",
  "service": "monday-batch-webhook",
  "timestamp": "2025-07-13T15:30:00.000Z",
  "environment": "production",
  "configured": true,
  "message": "Monday.com batch webhook endpoint is operational"
}
```

### `POST /api/webhook`
Handles Monday.com webhook events:

- **Challenge verification**: Responds to Monday.com setup challenges
- **Task creation**: Generates batch codes for new tasks
- **Board filtering**: Only processes tasks from configured board
- **Error handling**: Comprehensive logging and retry logic

## Troubleshooting

### Common Issues

**"Missing API key" error:**
```bash
# Check your secrets are set
fly secrets list

# Set missing secrets
fly secrets set MONDAY_API_KEY="your_key"
```

**"Task not from configured board" message:**
- Webhook is working but ignoring tasks from other boards
- Check `MONDAY_BOARD_ID` matches your target board

**Challenge verification fails:**
- Monday.com couldn't verify your webhook URL
- Check your Fly.io app is deployed and accessible
- Test: `curl https://your-app.fly.dev/api/webhook`

### Debugging Commands

```bash
# Check app status
fly status

# View logs in real-time
fly logs

# Check environment variables
fly secrets list

# SSH into your app
fly ssh console
```

### Local Testing

```bash
# Test status endpoint
curl http://localhost:3005/api/webhook

# Test Monday.com challenge
curl -X POST http://localhost:3005/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"challenge": "test123"}'

# Should respond: {"challenge": "test123"}
```

## Deployment

This project uses GitHub Actions for automatic deployment:

1. **Push to main** → Triggers deployment
2. **Fly.io builds** Docker container  
3. **Auto-deploys** to production
4. **Health checks** verify deployment

Manual deployment:
```bash
fly deploy
```

## Production Features

- **Auto-scaling**: Scales to 0 when idle, starts on requests
- **Health checks**: Built-in monitoring at `/api/webhook`
- **HTTPS**: Automatic SSL/TLS termination
- **Structured logging**: JSON logs with detailed webhook info
- **Error handling**: Retry logic for Monday.com API calls
- **Container optimization**: Minimal Alpine Linux image

## License

MIT License - feel free to use for any project!
