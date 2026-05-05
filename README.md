# FlowForge - BPMN 2.0 Flow Editor

A modern, high-performance BPMN 2.0 flow editor built with Next.js, React, and a self-built graphics engine inspired by React Flow.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Zustand, Tailwind CSS, shadcn/ui
- **Graphics Engine**: Self-built (SVG rendering + batch updates + virtualization)
- **Backend**: Go (Gin/Echo), MongoDB
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- Go 1.21+ (for backend)
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
├── src/                    # Frontend source
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   │   ├── bpmn/           # BPMN editor components
│   │   ├── flow/           # Flow engine components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Core libraries
│   │   ├── flow/           # Graphics engine
│   │   ├── bpmn/           # BPMN semantic layer
│   │   ├── store/          # Zustand state management
│   │   └── api/            # API client
│   ├── hooks/              # Custom hooks
│   └── types/              # TypeScript types
├── backend/                # Go backend service
│   ├── cmd/                # Command entry
│   ├── internal/           # Internal packages
│   └── Dockerfile          # Backend Docker config
├── docs/                   # Documentation
│   ├── superpowers/        # Design docs
│   └── plans/              # Implementation plans
├── docker-compose.yml      # Docker Compose config
└── Dockerfile              # Frontend Docker config
```

## Core Features

- ✅ Complete BPMN 2.0 element support
- ✅ Large flow optimization (200-1000 nodes)
- ✅ Undo/redo history
- ✅ Drag and drop interaction
- ✅ Zoom and pan
- ✅ Property editing panel
- ✅ BPMN XML import/export
- 🚧 Real-time collaboration (planned)
- 🚧 Version management (planned)

## Performance Optimizations

- **Virtualized rendering**: Only render nodes in viewport
- **Batch updates**: Batch DOM updates to reduce re-renders
- **React.memo**: Prevent unnecessary component updates
- **Zustand shallow comparison**: Optimize state selection

## API Endpoints

### Processes

- `GET /api/v1/processes` - List processes
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
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=flowforge
JWT_SECRET=your-secret-key
```

## License

MIT
