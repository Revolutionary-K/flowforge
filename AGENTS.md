# FlowForge - BPMN 2.0 Flow Editor

## ⚠️ Critical: Non-Standard Next.js

This project uses **Next.js 16.2.4** with breaking changes. **DO NOT** assume standard Next.js patterns. Before writing any code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Tech Stack

- **Frontend**: Next.js 16.2.4 (App Router), React 19.2.5, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui (base-nova style), clsx, tailwind-merge
- **State**: Zustand 5 with `immer` middleware for immutable updates
- **Graphics**: Self-built flow engine (NOT xyflow) - custom viewport, node-renderer, edge-renderer
- **Backend**: Go 1.22 with Gin, MongoDB 7, zerolog
- **Testing**: Vitest + Testing Library (frontend), Go testing (backend)
- **Deployment**: Docker + Docker Compose

## Project Structure

```
src/
├── app/                    # Next.js App Router (page.tsx is main entry)
├── components/
│   ├── bpmn/               # BPMN editor (BpmnEditor, BpmnPalette, BpmnProperties, BpmnToolbar)
│   ├── flow/               # Self-built flow engine component
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── store/              # Zustand store (useFlowStore) with immer
│   ├── bpmn/               # BPMN XML parser/serializer
│   ├── flow/               # Flow engine core
│   │   ├── core/           # Viewport, virtualization
│   │   ├── nodes/          # Node renderer, handle component
│   │   └── edges/          # Edge renderer
│   ├── api/                # API client
│   ├── logger.ts           # Frontend logger utility
│   └── utils.ts            # Utility functions (cn() for className merging)
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types (flow.ts, bpmn.ts, api.ts)
└── __tests__/              # Frontend tests (Vitest)
backend/                    # Go backend (Gin + MongoDB + zerolog)
```

## Developer Commands

```bash
# Frontend (from project root)
npm run dev              # Start dev server (default: http://localhost:3000)
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

## Architecture Notes

### State Management (Zustand + Immer)

The flow store (`src/lib/store/flow-store.ts`) uses Zustand with `immer` middleware:
- Direct mutation syntax is SAFE inside store actions (immer handles immutability)
- `pushHistory()` must be called manually before undo-able actions
- History is limited to 50 snapshots

### Self-Built Flow Engine

This project does **NOT** use xyflow/react-flow. The flow engine is custom-built:
- `src/lib/flow/core/viewport.tsx` - Viewport with zoom/pan
- `src/lib/flow/nodes/node-renderer.tsx` - Renders nodes
- `src/lib/flow/edges/edge-renderer.tsx` - Renders edges
- `src/components/flow/flow.tsx` - Main Flow component

Node types are registered as `Record<string, React.ComponentType<NodeProps>>`:
```tsx
const bpmnNodeTypes: Record<string, React.ComponentType<NodeProps>> = {
  startEvent: ({ data, selected }: NodeProps) => <div>...</div>,
  // ...
};
```

### BPMN Types

Custom BPMN types defined in `src/types/bpmn.ts`:
- `NODE_TYPE_TO_BPMN` maps internal NodeType → BPMN XML element names
- `BPMN_TYPE_TO_NODE` reverse mapping
- Parser (`src/lib/bpmn/parser.ts`) and serializer (`src/lib/bpmn/serializer.ts`) handle XML conversion

### Keyboard Shortcuts

Implemented in `src/components/flow/flow.tsx`:
- `Delete/Backspace` - Delete selected nodes/edges
- `Ctrl+A` - Select all
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Escape` - Deselect all

## Testing

### Frontend Testing (Vitest + Testing Library)

- **Config**: `vitest.config.ts`
- **Test files**: `src/__tests__/*.test.ts`
- **Commands**: `npm run test` (watch), `npm run test:run` (single), `npm run test:coverage` (coverage)

Current coverage:
- Statements: 27.75%
- Branches: 16.11%
- Functions: 25%
- Lines: 28.78%

### Backend Testing (Go testing)

- **Test files**: `*_test.go` in each package
- **Commands**: `go test ./...` (all), `go test ./... -coverprofile=coverage.out` (coverage)

Current coverage:
- config: 100%
- logger: 94.4%
- handler: 41.7%

### Writing Tests

**Frontend**: Use `describe/it/expect` from Vitest, `renderHook` from Testing Library for store tests.

**Backend**: Use standard Go testing patterns. Handler tests should use `httptest` and mock the collection.

## Logging

### Frontend Logger

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { data });  // Dev only
logger.info('Info message');               // Always
logger.warn('Warning message');            // Always
logger.error('Error message', error);      // Always
```

### Backend Logger (zerolog)

```go
import "github.com/flowforge/backend/internal/logger"

// In main.go
logger.Init(cfg.Log.Level)  // "debug", "info", "warn", "error", "fatal", "panic"

// Usage
logger.Info().Str("key", "value").Msg("message")
logger.Error().Err(err).Msg("error occurred")
logger.Debug().Int("count", 5).Msg("debug info")
```

## Environment Variables

```bash
# Frontend (NEXT_PUBLIC_ prefix exposes to browser)
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Backend
PORT=8080
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=flowforge
JWT_SECRET=your-secret-key-change-in-production
LOG_LEVEL=info  # debug|info|warn|error|fatal|panic
```

## Common Patterns

### Class Names

Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes:
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  variant === 'primary' ? "primary-class" : "secondary-class"
)} />
```

### Store Access

```tsx
// In component (reactive)
const nodes = useFlowStore((state) => state.nodes);

// In callbacks (non-reactive, get current state)
const { deleteNode } = useFlowStore.getState();
```

### Node Components

Node components receive `NodeProps` from `src/types/flow.ts`:
```tsx
interface NodeProps {
  id: string;
  data: Record<string, any>;
  selected: boolean;
  dragging: boolean;
  position: Position;
  size: Size;
  handles: FlowHandle[];
}
```

## Gotchas

1. **Tailwind CSS 4**: Uses `@tailwindcss/postcss` plugin, not `tailwind.config.js`
2. **shadcn/ui**: Config in `components.json`, style is `base-nova`
3. **Path aliases**: `@/*` maps to `src/*`
4. **No xyflow**: Don't import from `@xyflow/react` - the flow engine is custom
5. **Immer**: Store mutations look like direct assignments but are immutable thanks to immer
6. **Testing**: Frontend uses Vitest, backend uses Go testing - different frameworks
7. **Logging**: Frontend uses custom logger, backend uses zerolog
8. **CORS**: Configured in `next.config.ts` for frontend, Gin middleware for backend
