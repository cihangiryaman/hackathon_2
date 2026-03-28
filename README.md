# Animal Recognition & Distress Detection API

A production-ready backend API service for animal recognition and **welfare assessment** from photos using Google Gemini 2.5 Flash. Designed to help identify animals in distress and guide appropriate intervention.

## Mission

**Recognize the plight of animals and identify situations where they need help.** This platform exists to assist wildlife rescue efforts by detecting signs of injury, illness, entrapment, or other distress situations.

## Features

- 🦊 **Animal Identification**: Identifies animals in photos with confidence scores
- 🚨 **Distress Detection**: Assesses animal welfare and detects signs of injury, illness, or danger
- 🔬 **Taxonomic Fallback**: Provides genus/family classification when species is uncertain
- ⚠️ **Safety Awareness**: Includes safety notes for both humans and animals
- 📋 **Actionable Guidance**: Provides recommended actions for distressed animals
- 🛡️ **Robust Validation**: File type, size, and magic byte validation
- 📊 **Structured Output**: Consistent JSON response format with detailed attributes
- 🚦 **Rate Limiting**: Built-in request rate limiting
- 📝 **Request Logging**: Comprehensive request/response logging
- 🐳 **Docker Ready**: Production Dockerfile included

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Flash
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 20 or higher
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
cd animal-recognition-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build image
docker build -t animal-recognition-api .

# Run container
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here animal-recognition-api
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-28T12:00:00.000Z",
  "service": "animal-recognition-api",
  "version": "1.0.0"
}
```

### Animal Recognition

```
POST /api/v1/animal-recognition
Content-Type: multipart/form-data
```

**Request:**
- Field name: `photo`
- Supported formats: JPEG, PNG, WebP
- Max file size: 10MB

**Response:**
```json
{
  "success": true,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-28T12:00:00.000Z",
  "result": {
    "likely_animal_name": "Red Fox",
    "scientific_name": "Vulpes vulpes",
    "category": "mammal",
    "confidence_score": 0.87,
    "possible_alternatives": [
      {
        "name": "Gray Fox",
        "scientific_name": "Urocyon cinereoargenteus",
        "confidence_score": 0.19
      }
    ],
    "visible_attributes": [
      "reddish-orange coat",
      "pointed ears",
      "long bushy tail with white tip",
      "visible limp in right front leg"
    ],
    "taxonomic_fallback": {
      "species": "Vulpes vulpes",
      "genus": "Vulpes",
      "family": "Canidae",
      "broader_group": "fox"
    },
    "is_wild_animal": true,
    "is_domestic_animal_possible": false,
    "distress_assessment": {
      "is_in_distress": true,
      "distress_confidence": 0.78,
      "distress_severity": "moderate",
      "distress_indicators": [
        "visible limp suggesting leg injury",
        "unusually close to human presence without fleeing"
      ],
      "distress_category": "injured",
      "immediate_action_needed": false,
      "recommended_action": "Contact local wildlife rescue. Do not attempt to capture."
    },
    "reasoning_summary": "The animal displays characteristic red fox features...",
    "uncertainty_note": "Species-level confidence is moderate because...",
    "safety_note": "Do not approach or attempt to handle wild animals...",
    "requires_human_review": true
  }
}
```

### Distress Severity Levels

| Severity | Description | Action |
|----------|-------------|--------|
| `none` | Animal appears healthy | No intervention needed |
| `mild` | Minor concern (unusual behavior, small scrape) | Monitor situation |
| `moderate` | Clear signs of a problem | Attention needed within hours/days |
| `severe` | Significant injury/illness/danger | Prompt professional help needed |
| `critical` | Life-threatening situation | IMMEDIATE intervention required |

### Distress Categories

| Category | Examples |
|----------|----------|
| `injured` | Visible wounds, broken limbs, bleeding |
| `trapped` | Caught in fence, netting, container |
| `sick` | Signs of illness, discharge, lethargy |
| `orphaned` | Young animal alone, no parent nearby |
| `environmental_danger` | On road, in pool, near toxins |
| `human_caused` | Signs of abuse, intentional harm |
| `unknown` | Unclear cause of distress |

## Testing with cURL

```bash
# Basic test with an image file
curl -X POST http://localhost:3000/api/v1/animal-recognition \
  -F "photo=@/path/to/animal-photo.jpg"

# With verbose output
curl -X POST http://localhost:3000/api/v1/animal-recognition \
  -F "photo=@/path/to/animal-photo.jpg" \
  -v

# Health check
curl http://localhost:3000/health
```

### PowerShell Example

```powershell
# Using Invoke-RestMethod
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/animal-recognition" `
  -Method Post `
  -Form @{ photo = Get-Item "C:\path\to\photo.jpg" }

$response | ConvertTo-Json -Depth 10
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | **Required** |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS` | Request timeout | `30000` |
| `GEMINI_MAX_RETRIES` | Max retry attempts | `3` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |
| `LOG_LEVEL` | Logging level | `info` |

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "request_id": "uuid",
  "timestamp": "ISO_DATE",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Optional additional details"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `FILE_REQUIRED` | 400 | No file uploaded |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | Unsupported file format |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `GEMINI_ERROR` | 502 | AI service error |
| `GEMINI_TIMEOUT` | 504 | AI service timeout |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Project Structure

```
├── src/
│   ├── config/           # Configuration and env validation
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Error handling, logging
│   ├── routes/           # Route definitions
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Business logic
│   │   ├── animal-recognition.service.ts  # Main service
│   │   ├── gemini-client.ts               # Gemini API client
│   │   └── prompt-builder.ts              # AI prompt engineering
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities (logger, validators, errors)
│   └── index.ts          # Application entry point
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Integration

This service is designed as a component for the AI Wildlife Help Assistant platform. The `analyzeAnimalPhoto` function can be imported and used directly:

```typescript
import { analyzeAnimalPhoto } from './services/animal-recognition.service.js';

const result = await analyzeAnimalPhoto(imageBuffer, 'image/jpeg', requestId);
```

## License

MIT
