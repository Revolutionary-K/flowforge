# FlowForge BPMN 2.0 流程编辑器设计文档

**文档版本**: 1.1.0  
**创建日期**: 2026-05-05  
**最后更新**: 2026-05-05  
**状态**: 设计评审中（更新：移除bpmn.js依赖，采用独立实现）

---

## 1. 项目概述

### 1.1 项目背景

FlowForge是一个企业级BPMN 2.0流程编辑器，旨在提供一个现代化、高性能、可扩展的流程设计与管理平台。

### 1.2 核心目标

- **完整BPMN 2.0支持**：支持所有BPMN元素类型（事件、任务、网关、连接等）
- **大型流程优化**：支持200-1000个节点的大型流程，保持流畅的交互体验
- **实时协作**：支持多用户同时编辑同一流程
- **版本管理**：完整的版本历史和回滚能力
- **标准兼容**：支持标准BPMN 2.0 XML的导入导出

### 1.3 技术栈

| 层级 | 技术选择 | 说明 |
|------|----------|------|
| **前端框架** | Next.js 14 + React 18 | SSR支持，App Router |
| **UI组件库** | shadcn/ui | 现代化、可定制的组件库 |
| **CSS框架** | Tailwind CSS | 原子化CSS，高效开发 |
| **构建工具** | Vite | 快速的开发体验 |
| **图形引擎** | 自研（参考React Flow） | 基于SVG/Canvas的独立实现 |
| **状态管理** | Zustand | 轻量级、高性能状态管理 |
| **后端框架** | Go (Gin/Echo) | 高性能、并发友好 |
| **数据库** | MongoDB | 文档模型，适合BPMN数据 |
| **缓存** | Redis | 会话管理、实时协作状态 |
| **部署** | Docker + Kubernetes | 容器化部署，易于扩展 |

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层 (Client)                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 + React 18                                       │
│  ├── 自研图形引擎（参考React Flow架构）                        │
│  │   ├── SVG渲染层（节点、边、连接线）                         │
│  │   ├── 交互层（拖拽、缩放、平移、选择）                     │
│  │   ├── 布局引擎（自动布局、对齐辅助）                       │
│  │   └── BPMN语义层（元素类型、规则验证）                     │
│  ├── UI组件库 (shadcn/ui)                                    │
│  ├── 状态管理 (Zustand)                                      │
│  └── 样式 (Tailwind CSS)                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API网关层 (Gateway)                     │
├─────────────────────────────────────────────────────────────┤
│  Nginx / Traefik                                             │
│  ├── 负载均衡                                                │
│  ├── SSL终止                                                 │
│  ├── 请求路由                                                │
│  └── 静态资源缓存                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务层 (Services)                       │
├─────────────────────────────────────────────────────────────┤
│  Go (Gin/Echo)                                               │
│  ├── 认证服务 (JWT + OAuth2)                                 │
│  ├── 流程服务 (CRUD + 版本管理)                               │
│  ├── 协作服务 (WebSocket实时通信)                             │
│  └── 执行服务 (流程引擎集成)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层 (Data)                           │
├─────────────────────────────────────────────────────────────┤
│  MongoDB                                                     │
│  ├── 用户集合 (users)                                        │
│  ├── 流程集合 (processes)                                    │
│  ├── 版本集合 (versions)                                     │
│  └── 执行历史 (executions)                                   │
│                                                              │
│  Redis                                                       │
│  ├── 会话缓存                                                │
│  ├── 实时协作状态                                            │
│  └── 限流计数器                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 前端架构

#### 2.2.1 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   ├── (dashboard)/              # 仪表板布局
│   │   ├── processes/            # 流程管理
│   │   └── settings/             # 设置页面
│   ├── editor/                   # BPMN编辑器页面
│   │   └── [processId]/          # 动态路由
│   └── api/                      # Next.js API Routes（BFF）
│
├── components/                   # 共享组件
│   ├── ui/                       # shadcn/ui组件
│   ├── bpmn/                     # BPMN相关组件
│   │   ├── BpmnEditor.tsx        # 主编辑器
│   │   ├── BpmnToolbar.tsx       # 工具栏
│   │   ├── BpmnProperties.tsx    # 属性面板
│   │   ├── BpmnPalette.tsx       # 元素面板
│   │   └── custom/               # 自定义BPMN元素
│   └── layout/                   # 布局组件
│
├── lib/                          # 核心库
│   ├── flow/                     # 自研图形引擎
│   │   ├── core/                 # 核心引擎
│   │   │   ├── engine.ts         # 主引擎（视口、变换）
│   │   │   ├── renderer.ts       # SVG渲染器
│   │   │   ├── viewport.ts       # 视口管理（缩放、平移）
│   │   │   └── selection.ts      # 选择管理
│   │   ├── nodes/                # 节点系统
│   │   │   ├── node.ts           # 节点基类
│   │   │   ├── node-renderer.tsx # 节点渲染组件
│   │   │   └── node-types/       # BPMN节点类型
│   │   ├── edges/                # 边系统
│   │   │   ├── edge.ts           # 边基类
│   │   │   ├── edge-renderer.tsx # 边渲染组件
│   │   │   └── edge-types/       # 边类型（顺序流、消息流）
│   │   ├── handles/              # 连接点系统
│   │   │   ├── handle.ts         # 连接点定义
│   │   │   └── handle-renderer.tsx
│   │   ├── interaction/          # 交互系统
│   │   │   ├── drag.ts           # 拖拽交互
│   │   │   ├── connect.ts        # 连接交互
│   │   │   └── resize.ts         # 调整大小
│   │   └── utils/                # 工具函数
│   │       ├── geometry.ts       # 几何计算
│   │       ├── path.ts           # 路径计算（贝塞尔曲线）
│   │       └── bounds.ts         # 边界计算
│   ├── bpmn/                     # BPMN语义层
│   │   ├── model.ts              # BPMN数据模型
│   │   ├── validator.ts          # BPMN规则验证
│   │   ├── parser.ts             # BPMN XML解析器
│   │   ├── serializer.ts         # BPMN XML序列化器
│   │   └── elements/             # BPMN元素定义
│   │       ├── events.ts         # 事件类型
│   │       ├── tasks.ts          # 任务类型
│   │       ├── gateways.ts       # 网关类型
│   │       └── flows.ts          # 连接类型
│   ├── api/                      # API客户端
│   ├── store/                    # Zustand状态管理
│   └── utils/                    # 工具函数
│
├── hooks/                        # 自定义Hooks
│   ├── useFlowEngine.ts          # 图形引擎Hook
│   ├── useNodes.ts               # 节点操作Hook
│   ├── useEdges.ts               # 边操作Hook
│   ├── useViewport.ts            # 视口操作Hook
│   ├── useDrag.ts                # 拖拽交互Hook
│   ├── useConnect.ts             # 连接交互Hook
│   ├── useBpmn.ts                # BPMN语义操作Hook
│   ├── useCollaboration.ts       # 实时协作Hook
│   └── useProcess.ts             # 流程数据Hook
│
└── types/                        # TypeScript类型定义
    ├── flow.ts                   # 图形引擎类型（Node, Edge, Handle）
    ├── bpmn.ts                   # BPMN语义类型
    ├── process.ts                # 流程类型
    └── api.ts                    # API类型
```

#### 2.2.2 核心数据模型（参考React Flow）

```typescript
// 节点数据模型
interface FlowNode {
  id: string;
  type: BpmnNodeType;  // 'startEvent' | 'userTask' | 'gateway' | ...
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: Record<string, any>;  // BPMN特定数据
  selected?: boolean;
  dragging?: boolean;
  parentId?: string;  // 子流程支持
}

// 边数据模型
interface FlowEdge {
  id: string;
  type: BpmnEdgeType;  // 'sequenceFlow' | 'messageFlow' | 'association'
  source: string;      // 源节点ID
  target: string;      // 目标节点ID
  sourceHandle?: string;  // 源连接点ID
  targetHandle?: string;  // 目标连接点ID
  data: Record<string, any>;
  selected?: boolean;
  animated?: boolean;
}

// 连接点数据模型
interface FlowHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'right' | 'bottom' | 'left';
  nodeId: string;
}

// 视口状态
interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// 编辑器状态（Zustand Store）
interface FlowStore {
  // 核心数据
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
  
  // 选择状态
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 历史记录
  history: {
    past: FlowSnapshot[];
    future: FlowSnapshot[];
  };
  
  // 操作方法
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, data: Partial<FlowEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // 批量操作
  applyNodeChanges: (changes: NodeChange[], nodes: FlowNode[]) => FlowNode[];
  applyEdgeChanges: (changes: EdgeChange[], edges: FlowEdge[]) => FlowEdge[];
  
  // 历史操作
  undo: () => void;
  redo: () => void;
}

// 变更类型（参考React Flow）
type NodeChange = 
  | { type: 'position'; id: string; position: Position }
  | { type: 'size'; id: string; size: Size }
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; node: FlowNode };

type EdgeChange =
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; edge: FlowEdge };
```

#### 2.2.3 BPMN编辑器组件

```typescript
interface BpmnEditorProps {
  processId: string;
  initialXml?: string;
  readOnly?: boolean;
  onSave?: (xml: string) => void;
  onExport?: (format: 'bpmn' | 'svg' | 'png') => void;
  
  // 自定义节点类型（参考React Flow）
  nodeTypes?: Record<string, React.ComponentType<NodeProps>>;
  edgeTypes?: Record<string, React.ComponentType<EdgeProps>>;
  
  // 性能选项
  onlyRenderVisible?: boolean;  // 只渲染可见节点
  minZoom?: number;
  maxZoom?: number;
}
```

### 2.3 后端架构

#### 2.3.1 Go服务结构

```
backend/
├── cmd/                          # 命令行入口
│   └── server/
│       └── main.go               # 服务启动
│
├── internal/                     # 内部包
│   ├── config/                   # 配置管理
│   ├── domain/                   # 领域模型
│   ├── repository/               # 数据访问层
│   ├── service/                  # 业务逻辑层
│   ├── handler/                  # HTTP处理器
│   └── middleware/               # 中间件
│
├── pkg/                          # 公共包
│   ├── bpmn/                     # BPMN解析库
│   ├── errors/                   # 错误定义
│   └── utils/                    # 工具函数
│
├── api/                          # API定义
│   └── openapi.yaml              # OpenAPI规范
│
└── migrations/                   # 数据库迁移
```

#### 2.3.2 核心领域模型

```go
type Process struct {
    ID          primitive.ObjectID `bson:"_id,omitempty"`
    Name        string             `bson:"name"`
    Description string             `bson:"description"`
    Category    string             `bson:"category"`
    Tags        []string           `bson:"tags"`
    OwnerID     primitive.ObjectID `bson:"owner_id"`
    BpmnXML     string             `bson:"bpmn_xml"`
    BpmnJSON    interface{}        `bson:"bpmn_json"`
    Version     int                `bson:"version"`
    Status      string             `bson:"status"`
    CreatedAt   time.Time          `bson:"created_at"`
    UpdatedAt   time.Time          `bson:"updated_at"`
}

type Version struct {
    ID        primitive.ObjectID `bson:"_id,omitempty"`
    ProcessID primitive.ObjectID `bson:"process_id"`
    Version   int                `bson:"version"`
    Changes   []Change           `bson:"changes"`
    Snapshot  string             `bson:"snapshot"`
    AuthorID  primitive.ObjectID `bson:"author_id"`
    Message   string             `bson:"message"`
    CreatedAt time.Time          `bson:"created_at"`
}
```

---

## 3. API设计

### 3.1 RESTful API端点

```yaml
# 认证
POST /api/v1/auth/login          # 登录
POST /api/v1/auth/register       # 注册
POST /api/v1/auth/refresh        # 刷新令牌
POST /api/v1/auth/logout         # 登出

# 流程管理
GET    /api/v1/processes          # 获取流程列表
POST   /api/v1/processes          # 创建流程
GET    /api/v1/processes/:id      # 获取流程详情
PUT    /api/v1/processes/:id      # 更新流程
DELETE /api/v1/processes/:id      # 删除流程

# 版本管理
GET    /api/v1/processes/:id/versions      # 获取版本历史
POST   /api/v1/processes/:id/versions      # 创建新版本
GET    /api/v1/processes/:id/versions/:v   # 获取特定版本
POST   /api/v1/processes/:id/versions/:v/restore  # 恢复版本

# 导入导出
POST   /api/v1/processes/import   # 导入BPMN文件
GET    /api/v1/processes/:id/export/:format  # 导出

# 协作
WS     /api/v1/ws/processes/:id   # WebSocket连接
```

### 3.2 认证与授权

```go
type TokenClaims struct {
    UserID    string `json:"user_id"`
    Email     string `json:"email"`
    Role      string `json:"role"`
    ExpiresAt int64  `json:"exp"`
}

var PermissionMatrix = map[string][]string{
    "admin":  {"process:create", "process:read", "process:update", "process:delete", 
               "version:create", "version:read", "user:manage"},
    "editor": {"process:create", "process:read", "process:update", 
               "version:create", "version:read"},
    "viewer": {"process:read", "version:read"},
}
```

---

## 4. 数据库设计

### 4.1 MongoDB集合

#### users集合
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  name: "John Doe",
  password: "$2a$10$...", // bcrypt
  role: "editor",
  avatar: "https://...",
  preferences: {
    theme: "dark",
    language: "zh-CN",
    editorSettings: {
      gridSize: 20,
      snapToGrid: true,
      showGrid: true
    }
  },
  created_at: ISODate,
  updated_at: ISODate,
  last_login_at: ISODate
}
```

#### processes集合
```javascript
{
  _id: ObjectId,
  name: "采购审批流程",
  description: "用于采购申请的审批流程",
  category: "采购管理",
  tags: ["采购", "审批", "财务"],
  owner_id: ObjectId,
  bpmn_xml: "<?xml version='1.0'...>",
  bpmn_json: {
    id: "Process_1",
    name: "采购审批流程",
    elements: [...],
    connections: [...]
  },
  stats: {
    element_count: 15,
    task_count: 5,
    gateway_count: 2,
    event_count: 3
  },
  version: 5,
  status: "published",
  created_at: ISODate,
  updated_at: ISODate,
  published_at: ISODate
}
```

#### versions集合
```javascript
{
  _id: ObjectId,
  process_id: ObjectId,
  version: 5,
  changes: [
    {
      type: "update",
      element_id: "Task_1",
      element_type: "userTask",
      field: "name",
      old_value: "提交申请",
      new_value: "提交采购申请"
    }
  ],
  snapshot: "<?xml version='1.0'...>",
  author_id: ObjectId,
  message: "添加自动审批任务",
  created_at: ISODate
}
```

### 4.2 索引策略

```javascript
// 用户索引
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })

// 流程索引
db.processes.createIndex({ owner_id: 1, status: 1 })
db.processes.createIndex({ category: 1, created_at: -1 })
db.processes.createIndex({ tags: 1 })
db.processes.createIndex({ name: "text", description: "text" })
db.processes.createIndex({ "bpmn_json.elements.type": 1 })

// 版本索引
db.versions.createIndex({ process_id: 1, version: -1 })
db.versions.createIndex({ author_id: 1, created_at: -1 })
```

---

## 5. 性能优化策略

### 5.1 前端性能优化（参考React Flow最佳实践）

#### 5.1.1 状态管理优化

```typescript
// 1. 使用Zustand的shallow比较避免不必要的重渲染
import { shallow } from 'zustand/shallow';

const selector = (store: FlowStore) => ({
  nodes: store.nodes,
  edges: store.edges,
  onNodesChange: store.onNodesChange,
  onEdgesChange: store.onEdgesChange,
});

function BpmnEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useFlowStore(selector, shallow);
  // ...
}

// 2. 避免在组件中直接访问nodes/edges
// ❌ 错误做法：每次nodes变化都会重渲染
const selectedNodes = useFlowStore(store => 
  store.nodes.filter(n => n.selected)
);

// ✅ 正确做法：使用独立的选择状态
const selectedNodeIds = useFlowStore(store => store.selectedNodes);
```

#### 5.1.2 组件Memo化

```typescript
// 1. 自定义节点组件必须使用React.memo
const BpmnUserTaskNode = React.memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`bpmn-node user-task ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <span className="node-icon">👤</span>
        <span className="node-label">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
BpmnUserTaskNode.displayName = 'BpmnUserTaskNode';

// 2. nodeTypes定义在组件外部，避免每次渲染创建新引用
const nodeTypes = {
  startEvent: BpmnStartEventNode,
  userTask: BpmnUserTaskNode,
  serviceTask: BpmnServiceTaskNode,
  exclusiveGateway: BpmnExclusiveGatewayNode,
  // ...
};

// 3. 回调函数使用useCallback
function BpmnEditor() {
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    // 处理节点点击
  }, []);
  
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
    // 处理边点击
  }, []);
  
  return <Flow nodes={nodes} edges={edges} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} />;
}
```

#### 5.1.3 虚拟化渲染

```typescript
// 只渲染视口内的节点（大型流程必备）
interface VirtualizationConfig {
  enabled: boolean;
  viewportMargin: number;  // 预加载边界（像素）
}

function useVirtualization(config: VirtualizationConfig) {
  const viewport = useFlowStore(store => store.viewport);
  const nodes = useFlowStore(store => store.nodes);
  
  const visibleNodes = useMemo(() => {
    if (!config.enabled) return nodes;
    
    const margin = config.viewportMargin;
    const viewportBounds = {
      x: -viewport.x / viewport.zoom - margin,
      y: -viewport.y / viewport.zoom - margin,
      width: window.innerWidth / viewport.zoom + margin * 2,
      height: window.innerHeight / viewport.zoom + margin * 2,
    };
    
    return nodes.filter(node => {
      const nodeBounds = {
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      };
      return isInViewport(nodeBounds, viewportBounds);
    });
  }, [nodes, viewport, config.enabled, config.viewportMargin]);
  
  return visibleNodes;
}
```

#### 5.1.4 CSS优化

```typescript
// 避免复杂的CSS样式影响性能
// ❌ 避免使用
const BadNode = () => (
  <div style={{ 
    backdropFilter: 'blur(2px)',  // 性能杀手
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    animation: 'pulse 2s infinite'
  }}>
    ...
  </div>
);

// ✅ 推荐使用
const GoodNode = () => (
  <div className="bpmn-node simple-shadow">
    ...
  </div>
);

// Tailwind CSS类
// .simple-shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
```

#### 5.1.5 变更批处理

```typescript
// 使用applyNodeChanges/applyEdgeChanges进行批量更新
// 参考React Flow的变更系统

function useBatchUpdates() {
  const { onNodesChange } = useFlowStore(selector, shallow);
  
  // 批量移动多个节点
  const moveNodes = useCallback((nodeIds: string[], delta: Position) => {
    const changes: NodeChange[] = nodeIds.map(id => ({
      type: 'position',
      id,
      position: {
        x: getNodeById(id).position.x + delta.x,
        y: getNodeById(id).position.y + delta.y,
      },
    }));
    onNodesChange(changes);
  }, [onNodesChange]);
  
  // 批量删除
  const deleteNodes = useCallback((nodeIds: string[]) => {
    const changes: NodeChange[] = nodeIds.map(id => ({
      type: 'remove',
      id,
    }));
    onNodesChange(changes);
  }, [onNodesChange]);
}
```

### 5.2 后端性能优化

#### 5.2.1 数据库查询优化
```go
func (r *ProcessRepository) GetByID(ctx context.Context, id string) (*Process, error) {
    // 先查缓存
    cacheKey := fmt.Sprintf("process:%s", id)
    cached, err := r.cache.Get(ctx, cacheKey).Result()
    if err == nil {
        var process Process
        json.Unmarshal([]byte(cached), &process)
        return &process, nil
    }
    
    // 缓存未命中，查数据库
    var process Process
    err = r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&process)
    if err != nil {
        return nil, err
    }
    
    // 写入缓存
    data, _ := json.Marshal(process)
    r.cache.Set(ctx, cacheKey, data, 5*time.Minute)
    
    return &process, nil
}
```

#### 5.2.2 连接池配置
```go
func NewMongoClient(uri string) (*mongo.Client, error) {
    opts := options.Client().
        ApplyURI(uri).
        SetMaxPoolSize(100).
        SetMinPoolSize(10).
        SetMaxConnIdleTime(30 * time.Second)
    
    return mongo.Connect(context.Background(), opts)
}
```

---

## 6. 实时协作设计

### 6.1 WebSocket通信协议

```typescript
interface CollaborationProtocol {
  type: 'element.add' | 'element.update' | 'element.delete' | 
        'element.move' | 'connection.add' | 'connection.update';
  
  payload: {
    elementId: string;
    properties: Record<string, any>;
    position?: { x: number; y: number };
  };
  
  metadata: {
    userId: string;
    timestamp: number;
    version: number;
  };
}
```

### 6.2 冲突解决策略

采用**最后写入胜出（Last Write Wins）**策略：

```typescript
interface ConflictResolution {
  strategy: 'last-write-wins';
  
  // 可选：操作转换（OT）
  // strategy: 'ot';
  
  // 可选：CRDT
  // strategy: 'crdt';
}
```

---

## 7. 测试策略

### 7.1 测试金字塔

```
        /\
       /  \        E2E测试 (10%)
      /    \       - 关键用户流程
     /------\      - 跨浏览器兼容
    /        \     
   /          \    集成测试 (30%)
  /            \   - API端点测试
 /              \  - 数据库集成
/________________\ - WebSocket测试

单元测试 (60%)
- 组件测试
- 工具函数测试
- 业务逻辑测试
```

### 7.2 性能测试指标

```typescript
interface PerformanceMetrics {
  // 渲染性能
  renderTime: number;           // < 100ms for 500 elements
  elementCount: number;
  frameRate: number;            // > 30fps
  
  // 内存使用
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  };
  
  // API性能
  apiCalls: {
    total: number;
    failed: number;
    avgLatency: number;         // < 200ms
  };
}
```

---

## 8. 部署架构

### 8.1 Docker Compose配置

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8080

  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/flowforge
      - REDIS_URI=redis://redis:6379

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
```

### 8.2 Kubernetes部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flowforge-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flowforge-api
  template:
    spec:
      containers:
        - name: api
          image: flowforge/api:latest
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

---

## 9. 安全设计

### 9.1 认证安全

- JWT令牌：RS256签名，15分钟过期
- 刷新令牌：7天过期，存储在HttpOnly Cookie
- 密码加密：bcrypt，cost factor 10

### 9.2 数据安全

- 输入验证：所有用户输入进行严格验证
- SQL注入防护：使用参数化查询
- XSS防护：输出编码，CSP策略
- CSRF防护：SameSite Cookie，CSRF Token

### 9.3 网络安全

- HTTPS强制：所有通信使用TLS 1.3
- CORS策略：严格的跨域限制
- 限流：API限流，防止DDoS攻击

---

## 10. 监控与日志

### 10.1 监控指标

```yaml
# Prometheus监控
- 请求延迟（P50, P95, P99）
- 错误率（4xx, 5xx）
- 数据库连接池使用率
- Redis命中率
- 内存使用
- CPU使用
- WebSocket连接数
```

### 10.2 日志策略

```go
// 结构化日志
type LogEntry struct {
    Level     string    `json:"level"`
    Message   string    `json:"message"`
    Timestamp time.Time `json:"timestamp"`
    UserID    string    `json:"user_id,omitempty"`
    RequestID string    `json:"request_id,omitempty"`
    Error     string    `json:"error,omitempty"`
    Duration  int64     `json:"duration,omitempty"`
}
```

---

## 11. 项目里程碑

### Phase 1: 核心功能（4周）
- [ ] 项目初始化与基础架构
- [ ] BPMN编辑器核心功能
- [ ] 基础UI组件
- [ ] 用户认证系统

### Phase 2: 高级功能（3周）
- [ ] 版本管理系统
- [ ] 实时协作功能
- [ ] 导入导出功能
- [ ] 性能优化

### Phase 3: 生产化（3周）
- [ ] 安全加固
- [ ] 监控与日志
- [ ] 部署自动化
- [ ] 文档完善

---

## 12. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 自研引擎开发周期长 | 高 | 分阶段实现，先核心后扩展 |
| BPMN规范复杂度高 | 高 | 严格遵循规范文档，参考成熟实现 |
| 大型流程性能问题 | 高 | 虚拟化渲染、变更批处理、React.memo |
| SVG渲染性能瓶颈 | 中 | Canvas回退方案、图层分离 |
| 实时协作冲突 | 中 | 最后写入胜出策略 |
| 浏览器兼容性 | 中 | 现代浏览器优先，渐进增强 |
| 安全漏洞 | 高 | 定期安全审计、依赖更新 |

---

## 附录

### A. BPMN 2.0元素支持列表

#### 事件（Events）
- 开始事件（Start Event）
- 结束事件（End Event）
- 中间事件（Intermediate Event）
- 边界事件（Boundary Event）

#### 任务（Tasks）
- 用户任务（User Task）
- 服务任务（Service Task）
- 脚本任务（Script Task）
- 业务规则任务（Business Rule Task）
- 发送任务（Send Task）
- 接收任务（Receive Task）
- 手动任务（Manual Task）

#### 网关（Gateways）
- 排他网关（Exclusive Gateway）
- 并行网关（Parallel Gateway）
- 包容网关（Inclusive Gateway）
- 事件网关（Event-Based Gateway）

#### 连接（Connections）
- 顺序流（Sequence Flow）
- 消息流（Message Flow）
- 关联（Association）

#### 容器（Containers）
- 子流程（Subprocess）
- 调用活动（Call Activity）
- 泳道（Lane）
- 池（Pool）

### B. 参考资源

- [BPMN 2.0规范](https://www.omg.org/spec/BPMN/2.0)
- [React Flow文档](https://reactflow.dev) - 架构设计参考
- [React Flow源码](https://github.com/xyflow/xyflow) - 性能优化参考
- [Next.js文档](https://nextjs.org/docs)
- [shadcn/ui文档](https://ui.shadcn.com)
- [Tailwind CSS文档](https://tailwindcss.com)
- [Zustand文档](https://zustand-demo.pmnd.rs)

---

**文档维护者**: FlowForge Team  
**最后更新**: 2026-05-05  
**版本历史**:
- v1.1.0 (2026-05-05): 移除bpmn.js依赖，采用独立实现（参考React Flow架构）
- v1.0.0 (2026-05-05): 初始设计文档
