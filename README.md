# FlowForge - BPMN 2.0 Flow Editor

A modern, high-performance BPMN 2.0 flow editor built with Next.js, React, and a self-built graphics engine inspired by React Flow.

## Tech Stack

- **Frontend**: Next.js 16.2.4, React 19.2.5, TypeScript 5, Zustand 5, Tailwind CSS 4, shadcn/ui
- **Graphics Engine**: Self-built (SVG rendering + batch updates + virtualization)
- **Backend**: Go 1.22 (Gin), MongoDB 7, zerolog
- **Testing**: Vitest + Testing Library (frontend), Go testing (backend)
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Go 1.22+ (for backend)
- MongoDB 7+ (for backend)

### Development

1. Clone the project
```bash
git clone https://github.com/your-org/flowforge.git
cd flowforge
```

2. Install frontend dependencies
```bash
npm install
```

3. Start frontend development server
```bash
npm run dev
```

4. (Optional) Start backend server
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

### Docker Deployment

```bash
docker-compose up -d
```

## Project Structure

```
flowforge/
├── src/                          # Frontend source
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   │   ├── bpmn/                 # BPMN editor components
│   │   ├── flow/                 # Flow engine components
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/                      # Core libraries
│   │   ├── flow/                 # Graphics engine
│   │   ├── bpmn/                 # BPMN parser/serializer
│   │   ├── store/                # Zustand state management
│   │   ├── api/                  # API client
│   │   └── logger.ts             # Frontend logger
│   ├── hooks/                    # Custom hooks
│   ├── types/                    # TypeScript types
│   └── __tests__/                # Frontend tests
├── backend/                      # Go backend service
│   ├── cmd/                      # Command entry
│   ├── internal/                 # Internal packages
│   │   ├── config/               # Configuration
│   │   ├── handler/              # HTTP handlers
│   │   ├── logger/               # Backend logger (zerolog)
│   │   └── domain/               # Domain models
│   └── Dockerfile                # Backend Docker config
├── docker-compose.yml            # Docker Compose config
└── Dockerfile                    # Frontend Docker config
```

## Developer Commands

```bash
# Frontend (from project root)
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run test             # Run tests (watch mode)
npm run test:run         # Run tests (single run)
npm run test:coverage    # Run tests with coverage report

# Backend (from backend/)
go mod tidy              # Install dependencies
go run cmd/server/main.go  # Start backend server (port 8080)
go test ./...            # Run all tests
go test ./... -coverprofile=coverage.out  # Run tests with coverage
go tool cover -html=coverage.out  # View HTML coverage report

# Docker (full stack)
docker-compose up -d     # Frontend + API + MongoDB
```

## Testing

### Frontend Testing

- **Framework**: Vitest + Testing Library
- **Coverage**: `npm run test:coverage`
- **Test files**: `src/__tests__/`

Current coverage:
- Statements: 27.75%
- Branches: 16.11%
- Functions: 25%
- Lines: 28.78%

### Backend Testing

- **Framework**: Go testing
- **Coverage**: `go test ./... -coverprofile=coverage.out`
- **Test files**: `*_test.go` in each package

Current coverage:
- config: 100%
- logger: 94.4%
- handler: 41.7%

## Core Features

- ✅ Complete BPMN 2.0 element support
- ✅ Large flow optimization (200-1000 nodes)
- ✅ Undo/redo history
- ✅ Drag and drop interaction
- ✅ Zoom and pan
- ✅ Property editing panel
- ✅ BPMN XML import/export
- ✅ Structured logging (zerolog backend, custom frontend logger)
- ✅ Unit testing with coverage reports
- 🚧 Real-time collaboration (planned)
- 🚧 Version management (planned)

## Performance Optimizations

- **Virtualized rendering**: Only render nodes in viewport
- **Batch updates**: Batch DOM updates to reduce re-renders
- **React.memo**: Prevent unnecessary component updates
- **Zustand shallow comparison**: Optimize state selection

## API Endpoints

### Processes

- `GET /api/v1/processes` - List processes (with pagination, filtering, search)
- `POST /api/v1/processes` - Create process
- `GET /api/v1/processes/:id` - Get process
- `PUT /api/v1/processes/:id` - Update process
- `DELETE /api/v1/processes/:id` - Delete process

### Health Check

- `GET /health` - Server health check

## Environment Variables

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Backend
PORT=8080
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=flowforge
JWT_SECRET=your-secret-key-change-in-production
LOG_LEVEL=info  # debug|info|warn|error|fatal|panic
```

## Logging

### Frontend Logger

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { data });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Backend Logger (zerolog)

```go
import "github.com/flowforge/backend/internal/logger"

logger.Init("debug")  // Set log level
logger.Info().Str("key", "value").Msg("message")
logger.Error().Err(err).Msg("error occurred")
```

## License

MIT
