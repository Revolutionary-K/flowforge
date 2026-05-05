# FlowForge BPMN 2.0 流程编辑器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的BPMN 2.0流程编辑器，支持大型流程（200-1000节点），采用自研图形引擎（参考React Flow架构）

**Architecture:** 
- 前端：Next.js 14 + React 18 + Zustand + Tailwind CSS
- 图形引擎：自研（SVG渲染 + 变更批处理 + 虚拟化）
- BPMN语义层：自研（XML解析/序列化 + 规则验证）
- 后端：Go (Gin/Echo) + MongoDB + Redis

**Tech Stack:** Next.js, React 18, Zustand, Tailwind CSS, shadcn/ui, Go, MongoDB, Redis

---

## 阶段一：项目初始化与核心图形引擎（第1-2周）

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: 初始化Next.js项目**

```bash
npx create-next-app@latest flowforge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd flowforge
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install zustand @radix-ui/react-icons class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node @types/react @types/react-dom
```

- [ ] **Step 3: 配置shadcn/ui**

```bash
npx shadcn-ui@latest init
```

选择配置：
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 4: 添加基础UI组件**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add scroll-area
```

- [ ] **Step 5: 验证项目启动**

```bash
npm run dev
```

访问 http://localhost:3000 确认项目正常运行

- [ ] **Step 6: 提交代码**

```bash
git add .
git commit -m "chore: initialize Next.js project with shadcn/ui"
```

---

### Task 2: 核心类型定义

**Files:**
- Create: `src/types/flow.ts`
- Create: `src/types/bpmn.ts`
- Create: `src/types/process.ts`
- Create: `src/types/api.ts`

- [ ] **Step 1: 定义图形引擎核心类型**

```typescript
// src/types/flow.ts

// 位置和大小
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

// 节点类型
export type NodeType = 
  | 'startEvent'
  | 'endEvent'
  | 'intermediateEvent'
  | 'boundaryEvent'
  | 'userTask'
  | 'serviceTask'
  | 'scriptTask'
  | 'businessRuleTask'
  | 'sendTask'
  | 'receiveTask'
  | 'manualTask'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'inclusiveGateway'
  | 'eventBasedGateway'
  | 'subprocess'
  | 'callActivity'
  | 'lane'
  | 'pool';

// 边类型
export type EdgeType = 
  | 'sequenceFlow'
  | 'messageFlow'
  | 'association';

// 连接点位置
export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

// 连接点类型
export type HandleType = 'source' | 'target';

// 连接点定义
export interface FlowHandle {
  id: string;
  type: HandleType;
  position: HandlePosition;
  nodeId: string;
}

// 节点定义
export interface FlowNode {
  id: string;
  type: NodeType;
  position: Position;
  size: Size;
  data: Record<string, any>;
  selected?: boolean;
  dragging?: boolean;
  parentId?: string;
  handles?: FlowHandle[];
}

// 边定义
export interface FlowEdge {
  id: string;
  type: EdgeType;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data: Record<string, any>;
  selected?: boolean;
  animated?: boolean;
  label?: string;
}

// 视口状态
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// 变更类型
export type NodeChange = 
  | { type: 'position'; id: string; position: Position }
  | { type: 'size'; id: string; size: Size }
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; node: FlowNode };

export type EdgeChange =
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; edge: FlowEdge };

// 快照（用于历史记录）
export interface FlowSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
}

// 节点Props（传递给自定义节点组件）
export interface NodeProps {
  id: string;
  data: Record<string, any>;
  selected: boolean;
  dragging: boolean;
  position: Position;
  size: Size;
  handles: FlowHandle[];
}

// 边Props（传递给自定义边组件）
export interface EdgeProps {
  id: string;
  source: Position;
  target: Position;
  sourceHandle?: FlowHandle;
  targetHandle?: FlowHandle;
  data: Record<string, any>;
  selected: boolean;
  animated: boolean;
  label?: string;
}
```

- [ ] **Step 2: 定义BPMN语义类型**

```typescript
// src/types/bpmn.ts

import { NodeType, EdgeType } from './flow';

// BPMN元素基础属性
export interface BpmnElement {
  id: string;
  name?: string;
  documentation?: string;
}

// BPMN事件
export interface BpmnEvent extends BpmnElement {
  eventType: 'start' | 'end' | 'intermediate' | 'boundary';
  trigger?: string;
  interrupting?: boolean;
}

// BPMN任务
export interface BpmnTask extends BpmnElement {
  taskType: 'user' | 'service' | 'script' | 'businessRule' | 'send' | 'receive' | 'manual';
  assignee?: string;
  candidateGroups?: string[];
  formKey?: string;
  script?: string;
}

// BPMN网关
export interface BpmnGateway extends BpmnElement {
  gatewayType: 'exclusive' | 'parallel' | 'inclusive' | 'eventBased';
  defaultFlow?: string;
}

// BPMN流程
export interface BpmnProcess extends BpmnElement {
  isExecutable: boolean;
  elements: BpmnElement[];
  flows: BpmnSequenceFlow[];
}

// BPMN顺序流
export interface BpmnSequenceFlow extends BpmnElement {
  sourceRef: string;
  targetRef: string;
  conditionExpression?: string;
}

// BPMN定义
export interface BpmnDefinitions {
  id: string;
  targetNamespace: string;
  processes: BpmnProcess[];
}

// 节点类型到BPMN类型的映射
export const NODE_TYPE_TO_BPMN: Record<NodeType, string> = {
  startEvent: 'bpmn:StartEvent',
  endEvent: 'bpmn:EndEvent',
  intermediateEvent: 'bpmn:IntermediateCatchEvent',
  boundaryEvent: 'bpmn:BoundaryEvent',
  userTask: 'bpmn:UserTask',
  serviceTask: 'bpmn:ServiceTask',
  scriptTask: 'bpmn:ScriptTask',
  businessRuleTask: 'bpmn:BusinessRuleTask',
  sendTask: 'bpmn:SendTask',
  receiveTask: 'bpmn:ReceiveTask',
  manualTask: 'bpmn:ManualTask',
  exclusiveGateway: 'bpmn:ExclusiveGateway',
  parallelGateway: 'bpmn:ParallelGateway',
  inclusiveGateway: 'bpmn:InclusiveGateway',
  eventBasedGateway: 'bpmn:EventBasedGateway',
  subprocess: 'bpmn:SubProcess',
  callActivity: 'bpmn:CallActivity',
  lane: 'bpmn:Lane',
  pool: 'bpmn:Participant',
};

// BPMN类型到节点类型的映射
export const BPMN_TYPE_TO_NODE: Record<string, NodeType> = Object.fromEntries(
  Object.entries(NODE_TYPE_TO_BPMN).map(([k, v]) => [v, k as NodeType])
);
```

- [ ] **Step 3: 定义API类型**

```typescript
// src/types/api.ts

// API响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 流程数据
export interface ProcessData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  bpmnXml: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// 版本数据
export interface VersionData {
  id: string;
  processId: string;
  version: number;
  changes: ChangeRecord[];
  snapshot: string;
  authorId: string;
  message?: string;
  createdAt: string;
}

// 变更记录
export interface ChangeRecord {
  type: 'add' | 'update' | 'delete';
  elementId: string;
  elementType: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

// 用户数据
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 4: 创建类型索引文件**

```typescript
// src/types/index.ts
export * from './flow';
export * from './bpmn';
export * from './process';
export * from './api';
```

- [ ] **Step 5: 提交代码**

```bash
git add src/types/
git commit -m "feat: add core type definitions for flow engine and BPMN"
```

---

### Task 3: Zustand状态管理

**Files:**
- Create: `src/lib/store/flow-store.ts`
- Create: `src/lib/store/index.ts`

- [ ] **Step 1: 创建Flow Store**

```typescript
// src/lib/store/flow-store.ts

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  FlowNode,
  FlowEdge,
  Viewport,
  NodeChange,
  EdgeChange,
  FlowSnapshot,
  Position,
} from '@/types/flow';

// 历史记录最大数量
const MAX_HISTORY = 50;

export interface FlowStore {
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

  // 协作状态
  collaboration: {
    userId: string | null;
    users: Map<string, { position: Position; color: string }>;
  };

  // 操作方法
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setViewport: (viewport: Viewport) => void;
  
  // 节点操作
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: Position) => void;
  moveNodes: (ids: string[], delta: Position) => void;
  
  // 边操作
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, data: Partial<FlowEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // 选择操作
  selectNode: (id: string, addToSelection?: boolean) => void;
  selectEdge: (id: string, addToSelection?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  // 批量操作
  applyNodeChanges: (changes: NodeChange[]) => void;
  applyEdgeChanges: (changes: EdgeChange[]) => void;
  
  // 重置
  reset: () => void;
  loadFromSnapshot: (snapshot: FlowSnapshot) => void;
}

// 辅助函数：应用节点变更
function applyNodeChangesToNodes(nodes: FlowNode[], changes: NodeChange[]): FlowNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  
  for (const change of changes) {
    switch (change.type) {
      case 'position': {
        const node = nodeMap.get(change.id);
        if (node) {
          node.position = change.position;
        }
        break;
      }
      case 'size': {
        const node = nodeMap.get(change.id);
        if (node) {
          node.size = change.size;
        }
        break;
      }
      case 'select': {
        const node = nodeMap.get(change.id);
        if (node) {
          node.selected = change.selected;
        }
        break;
      }
      case 'remove': {
        nodeMap.delete(change.id);
        break;
      }
      case 'add': {
        nodeMap.set(change.node.id, { ...change.node });
        break;
      }
    }
  }
  
  return Array.from(nodeMap.values());
}

// 辅助函数：应用边变更
function applyEdgeChangesToEdges(edges: FlowEdge[], changes: EdgeChange[]): FlowEdge[] {
  const edgeMap = new Map(edges.map(e => [e.id, { ...e }]));
  
  for (const change of changes) {
    switch (change.type) {
      case 'select': {
        const edge = edgeMap.get(change.id);
        if (edge) {
          edge.selected = change.selected;
        }
        break;
      }
      case 'remove': {
        edgeMap.delete(change.id);
        break;
      }
      case 'add': {
        edgeMap.set(change.edge.id, { ...change.edge });
        break;
      }
    }
  }
  
  return Array.from(edgeMap.values());
}

// 创建Store
export const useFlowStore = create<FlowStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodes: [],
      selectedEdges: [],
      history: { past: [], future: [] },
      collaboration: { userId: null, users: new Map() },

      // 节点变更处理
      onNodesChange: (changes: NodeChange[]) => {
        set((state) => {
          state.nodes = applyNodeChangesToNodes(state.nodes, changes);
          
          // 更新选择状态
          const selectedIds = state.nodes.filter(n => n.selected).map(n => n.id);
          state.selectedNodes = selectedIds;
        });
      },

      // 边变更处理
      onEdgesChange: (changes: EdgeChange[]) => {
        set((state) => {
          state.edges = applyEdgeChangesToEdges(state.edges, changes);
          
          // 更新选择状态
          const selectedIds = state.edges.filter(e => e.selected).map(e => e.id);
          state.selectedEdges = selectedIds;
        });
      },

      // 设置视口
      setViewport: (viewport: Viewport) => {
        set((state) => {
          state.viewport = viewport;
        });
      },

      // 添加节点
      addNode: (node: FlowNode) => {
        set((state) => {
          state.nodes.push(node);
        });
      },

      // 更新节点
      updateNode: (id: string, data: Partial<FlowNode>) => {
        set((state) => {
          const index = state.nodes.findIndex(n => n.id === id);
          if (index !== -1) {
            Object.assign(state.nodes[index], data);
          }
        });
      },

      // 删除节点
      deleteNode: (id: string) => {
        set((state) => {
          state.nodes = state.nodes.filter(n => n.id !== id);
          state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
          state.selectedNodes = state.selectedNodes.filter(nId => nId !== id);
        });
      },

      // 移动节点
      moveNode: (id: string, position: Position) => {
        set((state) => {
          const node = state.nodes.find(n => n.id === id);
          if (node) {
            node.position = position;
          }
        });
      },

      // 批量移动节点
      moveNodes: (ids: string[], delta: Position) => {
        set((state) => {
          for (const node of state.nodes) {
            if (ids.includes(node.id)) {
              node.position = {
                x: node.position.x + delta.x,
                y: node.position.y + delta.y,
              };
            }
          }
        });
      },

      // 添加边
      addEdge: (edge: FlowEdge) => {
        set((state) => {
          state.edges.push(edge);
        });
      },

      // 更新边
      updateEdge: (id: string, data: Partial<FlowEdge>) => {
        set((state) => {
          const index = state.edges.findIndex(e => e.id === id);
          if (index !== -1) {
            Object.assign(state.edges[index], data);
          }
        });
      },

      // 删除边
      deleteEdge: (id: string) => {
        set((state) => {
          state.edges = state.edges.filter(e => e.id !== id);
          state.selectedEdges = state.selectedEdges.filter(eId => eId !== id);
        });
      },

      // 选择节点
      selectNode: (id: string, addToSelection = false) => {
        set((state) => {
          if (!addToSelection) {
            // 取消其他选择
            for (const node of state.nodes) {
              node.selected = node.id === id;
            }
            for (const edge of state.edges) {
              edge.selected = false;
            }
            state.selectedNodes = [id];
            state.selectedEdges = [];
          } else {
            const node = state.nodes.find(n => n.id === id);
            if (node) {
              node.selected = !node.selected;
              if (node.selected) {
                state.selectedNodes.push(id);
              } else {
                state.selectedNodes = state.selectedNodes.filter(nId => nId !== id);
              }
            }
          }
        });
      },

      // 选择边
      selectEdge: (id: string, addToSelection = false) => {
        set((state) => {
          if (!addToSelection) {
            for (const node of state.nodes) {
              node.selected = false;
            }
            for (const edge of state.edges) {
              edge.selected = edge.id === id;
            }
            state.selectedNodes = [];
            state.selectedEdges = [id];
          } else {
            const edge = state.edges.find(e => e.id === id);
            if (edge) {
              edge.selected = !edge.selected;
              if (edge.selected) {
                state.selectedEdges.push(id);
              } else {
                state.selectedEdges = state.selectedEdges.filter(eId => eId !== id);
              }
            }
          }
        });
      },

      // 全选
      selectAll: () => {
        set((state) => {
          for (const node of state.nodes) {
            node.selected = true;
          }
          for (const edge of state.edges) {
            edge.selected = true;
          }
          state.selectedNodes = state.nodes.map(n => n.id);
          state.selectedEdges = state.edges.map(e => e.id);
        });
      },

      // 取消全选
      deselectAll: () => {
        set((state) => {
          for (const node of state.nodes) {
            node.selected = false;
          }
          for (const edge of state.edges) {
            edge.selected = false;
          }
          state.selectedNodes = [];
          state.selectedEdges = [];
        });
      },

      // 推送历史记录
      pushHistory: () => {
        set((state) => {
          const snapshot: FlowSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: { ...state.viewport },
          };
          
          state.history.past.push(snapshot);
          if (state.history.past.length > MAX_HISTORY) {
            state.history.past.shift();
          }
          state.history.future = [];
        });
      },

      // 撤销
      undo: () => {
        const { history } = get();
        if (history.past.length === 0) return;

        set((state) => {
          const snapshot = state.history.past.pop()!;
          
          // 保存当前状态到future
          const currentSnapshot: FlowSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: { ...state.viewport },
          };
          state.history.future.push(currentSnapshot);
          
          // 恢复状态
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.viewport = snapshot.viewport;
          state.selectedNodes = [];
          state.selectedEdges = [];
        });
      },

      // 重做
      redo: () => {
        const { history } = get();
        if (history.future.length === 0) return;

        set((state) => {
          const snapshot = state.history.future.pop()!;
          
          // 保存当前状态到past
          const currentSnapshot: FlowSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: { ...state.viewport },
          };
          state.history.past.push(currentSnapshot);
          
          // 恢复状态
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.viewport = snapshot.viewport;
          state.selectedNodes = [];
          state.selectedEdges = [];
        });
      },

      // 应用节点变更
      applyNodeChanges: (changes: NodeChange[]) => {
        set((state) => {
          state.nodes = applyNodeChangesToNodes(state.nodes, changes);
          state.selectedNodes = state.nodes.filter(n => n.selected).map(n => n.id);
        });
      },

      // 应用边变更
      applyEdgeChanges: (changes: EdgeChange[]) => {
        set((state) => {
          state.edges = applyEdgeChangesToEdges(state.edges, changes);
          state.selectedEdges = state.edges.filter(e => e.selected).map(e => e.id);
        });
      },

      // 重置
      reset: () => {
        set((state) => {
          state.nodes = [];
          state.edges = [];
          state.viewport = { x: 0, y: 0, zoom: 1 };
          state.selectedNodes = [];
          state.selectedEdges = [];
          state.history = { past: [], future: [] };
        });
      },

      // 从快照加载
      loadFromSnapshot: (snapshot: FlowSnapshot) => {
        set((state) => {
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.viewport = snapshot.viewport;
          state.selectedNodes = [];
          state.selectedEdges = [];
          state.history = { past: [], future: [] };
        });
      },
    }))
  )
);
```

- [ ] **Step 2: 创建Store索引**

```typescript
// src/lib/store/index.ts
export { useFlowStore } from './flow-store';
export type { FlowStore } from './flow-store';
```

- [ ] **Step 3: 提交代码**

```bash
git add src/lib/store/
git commit -m "feat: add Zustand flow store with history and selection"
```

---

### Task 4: SVG渲染引擎

**Files:**
- Create: `src/lib/flow/core/renderer.tsx`
- Create: `src/lib/flow/core/viewport.tsx`
- Create: `src/lib/flow/core/selection.tsx`
- Create: `src/lib/flow/nodes/node-renderer.tsx`
- Create: `src/lib/flow/edges/edge-renderer.tsx`

- [ ] **Step 1: 创建Viewport组件**

```tsx
// src/lib/flow/core/viewport.tsx

'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useFlowStore } from '@/lib/store';
import { Viewport as ViewportType, Position } from '@/types/flow';

interface ViewportProps {
  children: React.ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

export function Viewport({
  children,
  className = '',
  minZoom = 0.1,
  maxZoom = 2,
}: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewport = useFlowStore((state) => state.viewport);
  const setViewport = useFlowStore((state) => state.setViewport);
  const deselectAll = useFlowStore((state) => state.deselectAll);
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  // 处理缩放
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      
      const delta = event.deltaY;
      const zoomFactor = 0.001;
      const newZoom = Math.min(
        maxZoom,
        Math.max(minZoom, viewport.zoom - delta * zoomFactor)
      );
      
      // 计算缩放中心
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const zoomRatio = newZoom / viewport.zoom;
      const newX = mouseX - (mouseX - viewport.x) * zoomRatio;
      const newY = mouseY - (mouseY - viewport.y) * zoomRatio;
      
      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport, setViewport, minZoom, maxZoom]
  );

  // 处理平移开始
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // 只响应鼠标中键或按住空格键的左键
      if (event.button === 1 || (event.button === 0 && event.altKey)) {
        event.preventDefault();
        setIsPanning(true);
        setPanStart({ x: event.clientX - viewport.x, y: event.clientY - viewport.y });
      } else if (event.button === 0) {
        // 点击空白区域取消选择
        if (event.target === containerRef.current) {
          deselectAll();
        }
      }
    },
    [viewport, deselectAll]
  );

  // 处理平移
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isPanning) {
        const newX = event.clientX - panStart.x;
        const newY = event.clientY - panStart.y;
        setViewport({ ...viewport, x: newX, y: newY });
      }
    },
    [isPanning, panStart, viewport, setViewport]
  );

  // 处理平移结束
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 添加全局事件监听
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建NodeRenderer组件**

```tsx
// src/lib/flow/nodes/node-renderer.tsx

'use client';

import React, { memo } from 'react';
import { FlowNode, NodeProps } from '@/types/flow';
import { useFlowStore } from '@/lib/store';
import { Handle, Position } from './handle';

// 默认节点组件
const DefaultNode = memo(({ id, data, selected, handles }: NodeProps) => {
  return (
    <div
      className={`
        px-4 py-2 rounded-md border-2 bg-white shadow-sm
        ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200'}
        transition-shadow duration-150
      `}
    >
      {handles.map((handle) => (
        <Handle key={handle.id} {...handle} />
      ))}
      <div className="text-sm font-medium">{data.label || id}</div>
    </div>
  );
});
DefaultNode.displayName = 'DefaultNode';

// 节点包装器
interface NodeWrapperProps {
  node: FlowNode;
  nodeTypes: Record<string, React.ComponentType<NodeProps>>;
}

export const NodeWrapper = memo(({ node, nodeTypes }: NodeWrapperProps) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const moveNode = useFlowStore((state) => state.moveNode);
  const pushHistory = useFlowStore((state) => state.pushHistory);
  
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [nodeStart, setNodeStart] = React.useState({ x: 0, y: 0 });

  const NodeComponent = nodeTypes[node.type] || DefaultNode;

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0) return;
      
      event.stopPropagation();
      selectNode(node.id, event.shiftKey);
      
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      setNodeStart({ ...node.position });
    },
    [node.id, node.position, selectNode]
  );

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      moveNode(node.id, {
        x: nodeStart.x + deltaX,
        y: nodeStart.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      pushHistory();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, nodeStart, node.id, moveNode, pushHistory]);

  const nodeProps: NodeProps = {
    id: node.id,
    data: node.data,
    selected: node.selected || false,
    dragging: isDragging,
    position: node.position,
    size: node.size,
    handles: node.handles || [],
  };

  return (
    <div
      className="absolute"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <NodeComponent {...nodeProps} />
    </div>
  );
});
NodeWrapper.displayName = 'NodeWrapper';

// 节点渲染器
interface NodeRendererProps {
  nodeTypes: Record<string, React.ComponentType<NodeProps>>;
}

export function NodeRenderer({ nodeTypes }: NodeRendererProps) {
  const nodes = useFlowStore((state) => state.nodes);
  
  return (
    <>
      {nodes.map((node) => (
        <NodeWrapper key={node.id} node={node} nodeTypes={nodeTypes} />
      ))}
    </>
  );
}
```

- [ ] **Step 3: 创建EdgeRenderer组件**

```tsx
// src/lib/flow/edges/edge-renderer.tsx

'use client';

import React, { memo } from 'react';
import { FlowEdge, EdgeProps, Position } from '@/types/flow';
import { useFlowStore } from '@/lib/store';

// 计算贝塞尔曲线路径
function getBezierPath(source: Position, target: Position): string {
  const midX = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
}

// 默认边组件
const DefaultEdge = memo(({ source, target, selected, animated, label }: EdgeProps) => {
  const path = getBezierPath(source, target);
  
  return (
    <g>
      {/* 边路径 */}
      <path
        d={path}
        fill="none"
        stroke={selected ? '#3b82f6' : '#6b7280'}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={animated ? '5 5' : 'none'}
        className={animated ? 'animate-dash' : ''}
      />
      
      {/* 选择区域（更宽的透明路径，方便点击） */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={10}
        className="cursor-pointer"
      />
      
      {/* 标签 */}
      {label && (
        <text
          x={(source.x + target.x) / 2}
          y={(source.y + target.y) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600 pointer-events-none"
        >
          {label}
        </text>
      )}
    </g>
  );
});
DefaultEdge.displayName = 'DefaultEdge';

// 边包装器
interface EdgeWrapperProps {
  edge: FlowEdge;
  edgeTypes: Record<string, React.ComponentType<EdgeProps>>;
}

const EdgeWrapper = memo(({ edge, edgeTypes }: EdgeWrapperProps) => {
  const nodes = useFlowStore((state) => state.nodes);
  const selectEdge = useFlowStore((state) => state.selectEdge);
  
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return null;
  
  // 计算源和目标位置（节点中心）
  const source: Position = {
    x: sourceNode.position.x + sourceNode.size.width / 2,
    y: sourceNode.position.y + sourceNode.size.height / 2,
  };
  const target: Position = {
    x: targetNode.position.x + targetNode.size.width / 2,
    y: targetNode.position.y + targetNode.size.height / 2,
  };
  
  const EdgeComponent = edgeTypes[edge.type] || DefaultEdge;
  
  const edgeProps: EdgeProps = {
    id: edge.id,
    source,
    target,
    data: edge.data,
    selected: edge.selected || false,
    animated: edge.animated || false,
    label: edge.label,
  };
  
  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      selectEdge(edge.id, event.shiftKey);
    },
    [edge.id, selectEdge]
  );
  
  return (
    <g onClick={handleClick}>
      <EdgeComponent {...edgeProps} />
    </g>
  );
});
EdgeWrapper.displayName = 'EdgeWrapper';

// 边渲染器
interface EdgeRendererProps {
  edgeTypes: Record<string, React.ComponentType<EdgeProps>>;
}

export function EdgeRenderer({ edgeTypes }: EdgeRendererProps) {
  const edges = useFlowStore((state) => state.edges);
  
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <g>
        {edges.map((edge) => (
          <EdgeWrapper key={edge.id} edge={edge} edgeTypes={edgeTypes} />
        ))}
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: 创建Handle组件**

```tsx
// src/lib/flow/nodes/handle.tsx

'use client';

import React, { memo } from 'react';
import { FlowHandle, HandlePosition, HandleType } from '@/types/flow';

export { HandlePosition, HandleType };

interface HandleProps extends FlowHandle {
  className?: string;
}

export const Handle = memo(({ type, position, className = '' }: HandleProps) => {
  const positionStyles: Record<HandlePosition, React.CSSProperties> = {
    top: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    right: { right: -4, top: '50%', transform: 'translateY(-50%)' },
    bottom: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    left: { left: -4, top: '50%', transform: 'translateY(-50%)' },
  };
  
  const typeStyles = type === 'source' 
    ? 'bg-blue-500 hover:bg-blue-600' 
    : 'bg-white border-2 border-blue-500 hover:bg-blue-50';
  
  return (
    <div
      className={`
        absolute w-3 h-3 rounded-full cursor-crosshair
        transition-colors duration-150
        ${typeStyles}
        ${className}
      `}
      style={positionStyles[position]}
      data-handle-type={type}
      data-handle-position={position}
    />
  );
});
Handle.displayName = 'Handle';
```

- [ ] **Step 5: 提交代码**

```bash
git add src/lib/flow/
git commit -m "feat: add SVG rendering engine with viewport, nodes, and edges"
```

---

### Task 5: Flow组件集成

**Files:**
- Create: `src/components/flow/flow.tsx`
- Create: `src/components/flow/index.ts`

- [ ] **Step 1: 创建Flow主组件**

```tsx
// src/components/flow/flow.tsx

'use client';

import React, { useCallback } from 'react';
import { Viewport } from '@/lib/flow/core/viewport';
import { NodeRenderer } from '@/lib/flow/nodes/node-renderer';
import { EdgeRenderer } from '@/lib/flow/edges/edge-renderer';
import { useFlowStore } from '@/lib/store';
import { NodeProps, EdgeProps, NodeType, FlowNode, FlowEdge } from '@/types/flow';

// 默认节点类型
const defaultNodeTypes: Record<string, React.ComponentType<NodeProps>> = {};

// 默认边类型
const defaultEdgeTypes: Record<string, React.ComponentType<EdgeProps>> = {};

interface FlowProps {
  className?: string;
  nodeTypes?: Record<string, React.ComponentType<NodeProps>>;
  edgeTypes?: Record<string, React.ComponentType<EdgeProps>>;
  minZoom?: number;
  maxZoom?: number;
  onNodeClick?: (node: FlowNode) => void;
  onEdgeClick?: (edge: FlowEdge) => void;
  onCanvasClick?: () => void;
}

export function Flow({
  className = '',
  nodeTypes = defaultNodeTypes,
  edgeTypes = defaultEdgeTypes,
  minZoom = 0.1,
  maxZoom = 2,
  onNodeClick,
  onEdgeClick,
  onCanvasClick,
}: FlowProps) {
  const selectedNodes = useFlowStore((state) => state.selectedNodes);
  const selectedEdges = useFlowStore((state) => state.selectedEdges);
  const deselectAll = useFlowStore((state) => state.deselectAll);

  // 处理键盘快捷键
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Delete键删除选中元素
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { deleteNode, deleteEdge } = useFlowStore.getState();
        
        selectedNodes.forEach((id) => deleteNode(id));
        selectedEdges.forEach((id) => deleteEdge(id));
      }
      
      // Ctrl+A全选
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        useFlowStore.getState().selectAll();
      }
      
      // Ctrl+Z撤销
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().undo();
      }
      
      // Ctrl+Shift+Z重做
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().redo();
      }
      
      // Escape取消选择
      if (event.key === 'Escape') {
        deselectAll();
      }
    },
    [selectedNodes, selectedEdges, deselectAll]
  );

  return (
    <div
      className={`relative w-full h-full bg-gray-50 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 网格背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.5" fill="#d1d5db" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* 视口容器 */}
      <Viewport minZoom={minZoom} maxZoom={maxZoom}>
        {/* 边渲染层 */}
        <EdgeRenderer edgeTypes={edgeTypes} />
        
        {/* 节点渲染层 */}
        <NodeRenderer nodeTypes={nodeTypes} />
      </Viewport>
      
      {/* 缩放控件 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          className="w-8 h-8 bg-white rounded-md shadow-sm border flex items-center justify-center hover:bg-gray-50"
          onClick={() => {
            const { viewport, setViewport } = useFlowStore.getState();
            setViewport({ ...viewport, zoom: Math.min(maxZoom, viewport.zoom * 1.2) });
          }}
        >
          +
        </button>
        <button
          className="w-8 h-8 bg-white rounded-md shadow-sm border flex items-center justify-center hover:bg-gray-50"
          onClick={() => {
            const { viewport, setViewport } = useFlowStore.getState();
            setViewport({ ...viewport, zoom: Math.max(minZoom, viewport.zoom * 0.8) });
          }}
        >
          -
        </button>
        <button
          className="w-8 h-8 bg-white rounded-md shadow-sm border flex items-center justify-center hover:bg-gray-50 text-xs"
          onClick={() => {
            useFlowStore.getState().setViewport({ x: 0, y: 0, zoom: 1 });
          }}
        >
          1:1
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建Flow索引**

```tsx
// src/components/flow/index.ts
export { Flow } from './flow';
```

- [ ] **Step 3: 提交代码**

```bash
git add src/components/flow/
git commit -m "feat: add Flow component with keyboard shortcuts and zoom controls"
```

---

## 阶段二：BPMN语义层与编辑器UI（第3-4周）

### Task 6: BPMN XML解析器

**Files:**
- Create: `src/lib/bpmn/parser.ts`
- Create: `src/lib/bpmn/serializer.ts`
- Create: `src/lib/bpmn/model.ts`

- [ ] **Step 1: 创建BPMN解析器**

```typescript
// src/lib/bpmn/parser.ts

import {
  BpmnDefinitions,
  BpmnProcess,
  BpmnElement,
  BpmnSequenceFlow,
  BPMN_TYPE_TO_NODE,
} from '@/types/bpmn';
import { FlowNode, FlowEdge, NodeType } from '@/types/flow';

// 简单的XML解析器（生产环境建议使用fast-xml-parser）
function parseXml(xml: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML解析错误: ${parserError.textContent}`);
  }
  
  return doc;
}

// 获取元素属性
function getAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of element.attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

// 解析位置和大小
function parseBounds(element: Element): { x: number; y: number; width: number; height: number } | null {
  const boundsElement = element.querySelector('omg\\:Bounds, Bounds');
  if (!boundsElement) return null;
  
  return {
    x: parseFloat(boundsElement.getAttribute('x') || '0'),
    y: parseFloat(boundsElement.getAttribute('y') || '0'),
    width: parseFloat(boundsElement.getAttribute('width') || '0'),
    height: parseFloat(boundsElement.getAttribute('height') || '0'),
  };
}

// 解析BPMN元素
function parseElement(element: Element, bpmnType: string): FlowNode | null {
  const nodeId = BPMN_TYPE_TO_NODE[bpmnType];
  if (!nodeId) return null;
  
  const attrs = getAttributes(element);
  const bounds = parseBounds(element);
  
  if (!bounds) return null;
  
  return {
    id: attrs.id,
    type: nodeId as NodeType,
    position: { x: bounds.x, y: bounds.y },
    size: { width: bounds.width, height: bounds.height },
    data: {
      name: attrs.name,
      documentation: element.querySelector('bpmn\\:documentation, documentation')?.textContent,
    },
    selected: false,
    dragging: false,
  };
}

// 解析顺序流
function parseSequenceFlow(element: Element): FlowEdge | null {
  const attrs = getAttributes(element);
  
  if (!attrs.id || !attrs.sourceRef || !attrs.targetRef) return null;
  
  return {
    id: attrs.id,
    type: 'sequenceFlow',
    source: attrs.sourceRef,
    target: attrs.targetRef,
    data: {
      name: attrs.name,
      conditionExpression: element.querySelector('bpmn\\:conditionExpression, conditionExpression')?.textContent,
    },
    selected: false,
    animated: false,
  };
}

// 解析BPMN XML
export function parseBpmnXml(xml: string): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const doc = parseXml(xml);
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  
  // 解析所有BPMN元素
  const bpmnTypes = Object.keys(BPMN_TYPE_TO_NODE);
  
  for (const bpmnType of bpmnTypes) {
    const elements = doc.querySelectorAll(`bpmn\\:${bpmnType}, ${bpmnType}`);
    
    for (const element of elements) {
      const node = parseElement(element, bpmnType);
      if (node) {
        nodes.push(node);
      }
    }
  }
  
  // 解析顺序流
  const sequenceFlows = doc.querySelectorAll('bpmn\\:sequenceFlow, sequenceFlow');
  for (const flow of sequenceFlows) {
    const edge = parseSequenceFlow(flow);
    if (edge) {
      edges.push(edge);
    }
  }
  
  return { nodes, edges };
}

// 验证BPMN XML
export function validateBpmnXml(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const doc = parseXml(xml);
    
    // 检查是否有process元素
    const processes = doc.querySelectorAll('bpmn\\:process, process');
    if (processes.length === 0) {
      errors.push('未找到bpmn:process元素');
    }
    
    // 检查是否有开始事件
    const startEvents = doc.querySelectorAll('bpmn\\:startEvent, startEvent');
    if (startEvents.length === 0) {
      errors.push('流程必须包含至少一个开始事件');
    }
    
    // 检查是否有结束事件
    const endEvents = doc.querySelectorAll('bpmn\\:endEvent, endEvent');
    if (endEvents.length === 0) {
      errors.push('流程必须包含至少一个结束事件');
    }
    
    // 检查顺序流的源和目标是否存在
    const sequenceFlows = doc.querySelectorAll('bpmn\\:sequenceFlow, sequenceFlow');
    const elementIds = new Set(nodes.map(n => n.id));
    
    for (const flow of sequenceFlows) {
      const sourceRef = flow.getAttribute('sourceRef');
      const targetRef = flow.getAttribute('targetRef');
      
      if (sourceRef && !elementIds.has(sourceRef)) {
        errors.push(`顺序流的源元素 ${sourceRef} 不存在`);
      }
      if (targetRef && !elementIds.has(targetRef)) {
        errors.push(`顺序流的目标元素 ${targetRef} 不存在`);
      }
    }
    
  } catch (error) {
    errors.push(`XML解析错误: ${error.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

- [ ] **Step 2: 创建BPMN序列化器**

```typescript
// src/lib/bpmn/serializer.ts

import { FlowNode, FlowEdge } from '@/types/flow';
import { NODE_TYPE_TO_BPMN } from '@/types/bpmn';

// 生成唯一ID
function generateId(): string {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}

// 序列化节点为XML
function serializeNode(node: FlowNode): string {
  const bpmnType = NODE_TYPE_TO_BPMN[node.type];
  if (!bpmnType) return '';
  
  const attrs = [
    `id="${node.id}"`,
    node.data.name ? `name="${escapeXml(node.data.name)}"` : '',
  ].filter(Boolean).join(' ');
  
  const documentation = node.data.documentation
    ? `\n      <bpmn:documentation>${escapeXml(node.data.documentation)}</bpmn:documentation>`
    : '';
  
  return `
    <${bpmnType} ${attrs}>${documentation}
    </${bpmnType}>`;
}

// 序列化边为XML
function serializeEdge(edge: FlowEdge): string {
  const attrs = [
    `id="${edge.id}"`,
    `sourceRef="${edge.source}"`,
    `targetRef="${edge.target}"`,
    edge.data.name ? `name="${escapeXml(edge.data.name)}"` : '',
  ].filter(Boolean).join(' ');
  
  const condition = edge.data.conditionExpression
    ? `\n      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(edge.data.conditionExpression)}</bpmn:conditionExpression>`
    : '';
  
  return `
    <bpmn:sequenceFlow ${attrs}>${condition}
    </bpmn:sequenceFlow>`;
}

// XML转义
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 序列化为BPMN XML
export function serializeToBpmnXml(
  nodes: FlowNode[],
  edges: FlowEdge[],
  processId?: string,
  processName?: string
): string {
  const id = processId || `Process_${generateId()}`;
  const name = processName || 'Unnamed Process';
  
  const elementsXml = nodes.map(serializeNode).join('');
  const flowsXml = edges.map(serializeEdge).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="FlowForge"
                  exporterVersion="1.0.0">
  <bpmn:process id="${id}" name="${escapeXml(name)}" isExecutable="true">
    ${elementsXml}
    ${flowsXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${id}">
      ${nodes.map(node => `
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${node.size.width}" height="${node.size.height}" />
      </bpmndi:BPMNShape>`).join('')}
      ${edges.map(edge => `
      <bpmndi:BPMNEdge id="${edge.id}_di" bpmnElement="${edge.id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>`).join('')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
```

- [ ] **Step 3: 提交代码**

```bash
git add src/lib/bpmn/
git commit -m "feat: add BPMN XML parser and serializer"
```

---

## 阶段三：编辑器UI与交互（第5-6周）

### Task 7: BPMN编辑器组件

**Files:**
- Create: `src/components/bpmn/bpmn-editor.tsx`
- Create: `src/components/bpmn/bpmn-toolbar.tsx`
- Create: `src/components/bpmn/bpmn-palette.tsx`
- Create: `src/components/bpmn/bpmn-properties.tsx`

- [ ] **Step 1: 创建BPMN编辑器主组件**

```tsx
// src/components/bpmn/bpmn-editor.tsx

'use client';

import React, { useCallback, useEffect } from 'react';
import { Flow } from '@/components/flow';
import { BpmnToolbar } from './bpmn-toolbar';
import { BpmnPalette } from './bpmn-palette';
import { BpmnProperties } from './bpmn-properties';
import { useFlowStore } from '@/lib/store';
import { parseBpmnXml, serializeToBpmnXml } from '@/lib/bpmn/parser';
import { FlowNode, FlowEdge } from '@/types/flow';

// BPMN节点类型
const bpmnNodeTypes = {
  startEvent: ({ data, selected }: any) => (
    <div className={`
      w-10 h-10 rounded-full border-2 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="text-xs">▶</span>
    </div>
  ),
  endEvent: ({ data, selected }: any) => (
    <div className={`
      w-10 h-10 rounded-full border-4 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white'}
    `}>
      <span className="text-xs">⏹</span>
    </div>
  ),
  userTask: ({ data, selected }: any) => (
    <div className={`
      w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
    `}>
      <span className="text-lg mb-1">👤</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || '用户任务'}
      </span>
    </div>
  ),
  serviceTask: ({ data, selected }: any) => (
    <div className={`
      w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
    `}>
      <span className="text-lg mb-1">⚙️</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || '服务任务'}
      </span>
    </div>
  ),
  exclusiveGateway: ({ data, selected }: any) => (
    <div className={`
      w-12 h-12 border-2 rotate-45 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="-rotate-45 text-lg font-bold">✕</span>
    </div>
  ),
  parallelGateway: ({ data, selected }: any) => (
    <div className={`
      w-12 h-12 border-2 rotate-45 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="-rotate-45 text-lg font-bold">+</span>
    </div>
  ),
};

interface BpmnEditorProps {
  processId?: string;
  initialXml?: string;
  readOnly?: boolean;
  onSave?: (xml: string) => void;
  onExport?: (format: 'bpmn' | 'svg' | 'png') => void;
}

export function BpmnEditor({
  processId,
  initialXml,
  readOnly = false,
  onSave,
  onExport,
}: BpmnEditorProps) {
  const { loadFromSnapshot, nodes, edges } = useFlowStore();

  // 加载初始XML
  useEffect(() => {
    if (initialXml) {
      try {
        const { nodes, edges } = parseBpmnXml(initialXml);
        loadFromSnapshot({
          nodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 1 },
        });
      } catch (error) {
        console.error('Failed to parse BPMN XML:', error);
      }
    }
  }, [initialXml, loadFromSnapshot]);

  // 保存处理
  const handleSave = useCallback(() => {
    if (onSave) {
      const xml = serializeToBpmnXml(nodes, edges, processId);
      onSave(xml);
    }
  }, [nodes, edges, processId, onSave]);

  // 导出处理
  const handleExport = useCallback(
    (format: 'bpmn' | 'svg' | 'png') => {
      if (onExport) {
        onExport(format);
      } else {
        // 默认导出行为
        const xml = serializeToBpmnXml(nodes, edges, processId);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `process.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [nodes, edges, processId, onExport]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <BpmnToolbar
        readOnly={readOnly}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 元素面板 */}
        {!readOnly && <BpmnPalette />}
        
        {/* 画布 */}
        <div className="flex-1">
          <Flow
            nodeTypes={bpmnNodeTypes}
            className="w-full h-full"
          />
        </div>
        
        {/* 属性面板 */}
        <BpmnProperties readOnly={readOnly} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建工具栏**

```tsx
// src/components/bpmn/bpmn-toolbar.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';
import {
  Save,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
} from 'lucide-react';

interface BpmnToolbarProps {
  readOnly: boolean;
  onSave: () => void;
  onExport: (format: 'bpmn' | 'svg' | 'png') => void;
}

export function BpmnToolbar({ readOnly, onSave, onExport }: BpmnToolbarProps) {
  const { undo, redo, selectedNodes, selectedEdges, deleteNode, deleteEdge } = useFlowStore();
  
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  
  const handleDelete = () => {
    selectedNodes.forEach((id) => deleteNode(id));
    selectedEdges.forEach((id) => deleteEdge(id));
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-white">
      {/* 文件操作 */}
      {!readOnly && (
        <>
          <Button variant="ghost" size="icon" onClick={onSave} title="保存">
            <Save className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="导出">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('bpmn')}>
                导出 BPMN XML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('svg')}>
                导出 SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('png')}>
                导出 PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
        </>
      )}
      
      {/* 编辑操作 */}
      <Button variant="ghost" size="icon" onClick={undo} title="撤销">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={redo} title="重做">
        <Redo2 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* 剪贴板操作 */}
      {!readOnly && (
        <>
          <Button variant="ghost" size="icon" disabled={!hasSelection} title="复制">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!hasSelection} title="剪切">
            <Scissors className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="粘贴">
            <Clipboard className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasSelection}
            onClick={handleDelete}
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
      
      <div className="flex-1" />
      
      {/* 视图操作 */}
      <Button variant="ghost" size="icon" title="放大">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="缩小">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="适应视图">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: 创建元素面板**

```tsx
// src/components/bpmn/bpmn-palette.tsx

'use client';

import React, { useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';
import { NodeType, FlowNode } from '@/types/flow';

// 元素定义
const bpmnElements = [
  {
    category: '事件',
    items: [
      { type: 'startEvent' as NodeType, label: '开始事件', icon: '▶' },
      { type: 'endEvent' as NodeType, label: '结束事件', icon: '⏹' },
      { type: 'intermediateEvent' as NodeType, label: '中间事件', icon: '⏰' },
      { type: 'boundaryEvent' as NodeType, label: '边界事件', icon: '⛔' },
    ],
  },
  {
    category: '任务',
    items: [
      { type: 'userTask' as NodeType, label: '用户任务', icon: '👤' },
      { type: 'serviceTask' as NodeType, label: '服务任务', icon: '⚙️' },
      { type: 'scriptTask' as NodeType, label: '脚本任务', icon: '📜' },
      { type: 'businessRuleTask' as NodeType, label: '业务规则', icon: '📋' },
      { type: 'sendTask' as NodeType, label: '发送任务', icon: '📤' },
      { type: 'receiveTask' as NodeType, label: '接收任务', icon: '📥' },
      { type: 'manualTask' as NodeType, label: '手动任务', icon: '✋' },
    ],
  },
  {
    category: '网关',
    items: [
      { type: 'exclusiveGateway' as NodeType, label: '排他网关', icon: '✕' },
      { type: 'parallelGateway' as NodeType, label: '并行网关', icon: '+' },
      { type: 'inclusiveGateway' as NodeType, label: '包容网关', icon: '○' },
      { type: 'eventBasedGateway' as NodeType, label: '事件网关', icon: '◇' },
    ],
  },
  {
    category: '容器',
    items: [
      { type: 'subprocess' as NodeType, label: '子流程', icon: '📁' },
      { type: 'callActivity' as NodeType, label: '调用活动', icon: '📞' },
      { type: 'lane' as NodeType, label: '泳道', icon: '🏊' },
      { type: 'pool' as NodeType, label: '池', icon: '🏊‍♂️' },
    ],
  },
];

// 默认节点大小
const defaultSizes: Record<NodeType, { width: number; height: number }> = {
  startEvent: { width: 40, height: 40 },
  endEvent: { width: 40, height: 40 },
  intermediateEvent: { width: 40, height: 40 },
  boundaryEvent: { width: 40, height: 40 },
  userTask: { width: 128, height: 80 },
  serviceTask: { width: 128, height: 80 },
  scriptTask: { width: 128, height: 80 },
  businessRuleTask: { width: 128, height: 80 },
  sendTask: { width: 128, height: 80 },
  receiveTask: { width: 128, height: 80 },
  manualTask: { width: 128, height: 80 },
  exclusiveGateway: { width: 48, height: 48 },
  parallelGateway: { width: 48, height: 48 },
  inclusiveGateway: { width: 48, height: 48 },
  eventBasedGateway: { width: 48, height: 48 },
  subprocess: { width: 200, height: 150 },
  callActivity: { width: 128, height: 80 },
  lane: { width: 300, height: 200 },
  pool: { width: 300, height: 200 },
};

interface PaletteItemProps {
  type: NodeType;
  label: string;
  icon: string;
}

function PaletteItem({ type, label, icon }: PaletteItemProps) {
  const addNode = useFlowStore((state) => state.addNode);
  const pushHistory = useFlowStore((state) => state.pushHistory);
  
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/bpmn-type', type);
      event.dataTransfer.effectAllowed = 'copy';
    },
    [type]
  );
  
  const handleClick = useCallback(() => {
    // 在画布中心添加节点
    const newNode: FlowNode = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: 100, y: 100 }, // 默认位置
      size: defaultSizes[type],
      data: { name: label },
      selected: false,
      dragging: false,
    };
    
    addNode(newNode);
    pushHistory();
  }, [type, label, addNode, pushHistory]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="
        flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
        hover:bg-gray-100 active:bg-gray-200 active:cursor-grabbing
        transition-colors duration-150
      "
      title={label}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function BpmnPalette() {
  return (
    <div className="w-48 border-r bg-white">
      <div className="px-4 py-3 font-medium text-sm border-b">
        元素面板
      </div>
      <ScrollArea className="h-[calc(100%-49px)]">
        <div className="p-2">
          {bpmnElements.map((category, index) => (
            <React.Fragment key={category.category}>
              {index > 0 && <Separator className="my-2" />}
              <div className="mb-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                  {category.category}
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <PaletteItem key={item.type} {...item} />
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 4: 创建属性面板**

```tsx
// src/components/bpmn/bpmn-properties.tsx

'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';

interface BpmnPropertiesProps {
  readOnly: boolean;
}

export function BpmnProperties({ readOnly }: BpmnPropertiesProps) {
  const { nodes, edges, selectedNodes, selectedEdges, updateNode, updateEdge } = useFlowStore();
  
  // 获取选中的元素
  const selectedNode = selectedNodes.length === 1
    ? nodes.find((n) => n.id === selectedNodes[0])
    : null;
  
  const selectedEdge = selectedEdges.length === 1
    ? edges.find((e) => e.id === selectedEdges[0])
    : null;
  
  const element = selectedNode || selectedEdge;
  
  if (!element) {
    return (
      <div className="w-64 border-l bg-white">
        <div className="px-4 py-3 font-medium text-sm border-b">
          属性面板
        </div>
        <div className="p-4 text-sm text-gray-500">
          选择一个元素以查看其属性
        </div>
      </div>
    );
  }
  
  const handleNameChange = (value: string) => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, name: value },
      });
    } else if (selectedEdge) {
      updateEdge(selectedEdge.id, {
        data: { ...selectedEdge.data, name: value },
      });
    }
  };
  
  const handleDescriptionChange = (value: string) => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, documentation: value },
      });
    }
  };

  return (
    <div className="w-64 border-l bg-white">
      <div className="px-4 py-3 font-medium text-sm border-b">
        属性面板
      </div>
      <ScrollArea className="h-[calc(100%-49px)]">
        <div className="p-4 space-y-4">
          {/* 基本信息 */}
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">
              基本信息
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="element-id">ID</Label>
                <Input
                  id="element-id"
                  value={element.id}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="element-type">类型</Label>
                <Input
                  id="element-type"
                  value={selectedNode?.type || selectedEdge?.type || ''}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="element-name">名称</Label>
                <Input
                  id="element-name"
                  value={element.data.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  readOnly={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* 文档 */}
          {selectedNode && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                文档
              </div>
              <div>
                <Label htmlFor="element-doc">描述</Label>
                <Textarea
                  id="element-doc"
                  value={selectedNode.data.documentation || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  readOnly={readOnly}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          {/* 条件表达式（仅对边有效） */}
          {selectedEdge && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                条件
              </div>
              <div>
                <Label htmlFor="edge-condition">条件表达式</Label>
                <Input
                  id="edge-condition"
                  value={selectedEdge.data.conditionExpression || ''}
                  onChange={(e) => {
                    updateEdge(selectedEdge.id, {
                      data: { ...selectedEdge.data, conditionExpression: e.target.value },
                    });
                  }}
                  readOnly={readOnly}
                  className="mt-1"
                  placeholder="${variable == value}"
                />
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* 位置信息（仅对节点有效） */}
          {selectedNode && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                位置与大小
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pos-x">X</Label>
                  <Input
                    id="pos-x"
                    type="number"
                    value={selectedNode.position.x}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        position: { ...selectedNode.position, x: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y">Y</Label>
                  <Input
                    id="pos-y"
                    type="number"
                    value={selectedNode.position.y}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        position: { ...selectedNode.position, y: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="size-w">宽度</Label>
                  <Input
                    id="size-w"
                    type="number"
                    value={selectedNode.size.width}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        size: { ...selectedNode.size, width: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="size-h">高度</Label>
                  <Input
                    id="size-h"
                    type="number"
                    value={selectedNode.size.height}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        size: { ...selectedNode.size, height: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 5: 提交代码**

```bash
git add src/components/bpmn/
git commit -m "feat: add BPMN editor UI components (editor, toolbar, palette, properties)"
```

---

## 阶段四：后端服务与集成（第7-8周）

### Task 8: Go后端服务

**Files:**
- Create: `backend/cmd/server/main.go`
- Create: `backend/internal/config/config.go`
- Create: `backend/internal/domain/process.go`
- Create: `backend/internal/handler/process_handler.go`
- Create: `backend/internal/repository/mongo/process_repo.go`
- Create: `backend/go.mod`

- [ ] **Step 1: 初始化Go模块**

```bash
mkdir -p backend
cd backend
go mod init github.com/flowforge/backend
```

- [ ] **Step 2: 创建配置管理**

```go
// backend/internal/config/config.go

package config

import (
	"os"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

type DatabaseConfig struct {
	URI      string
	Database string
}

type RedisConfig struct {
	URI      string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		},
		Database: DatabaseConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "flowforge"),
		},
		Redis: RedisConfig{
			URI:      getEnv("REDIS_URI", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			Expiration: 24 * time.Hour,
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

- [ ] **Step 3: 创建领域模型**

```go
// backend/internal/domain/process.go

package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Process struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name" binding:"required"`
	Description string             `bson:"description" json:"description"`
	Category    string             `bson:"category" json:"category"`
	Tags        []string           `bson:"tags" json:"tags"`
	OwnerID     primitive.ObjectID `bson:"owner_id" json:"ownerId"`
	BpmnXML     string             `bson:"bpmn_xml" json:"bpmnXml"`
	Version     int                `bson:"version" json:"version"`
	Status      string             `bson:"status" json:"status"` // draft, published, archived
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
	PublishedAt *time.Time         `bson:"published_at,omitempty" json:"publishedAt,omitempty"`
}

type Version struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProcessID primitive.ObjectID `bson:"process_id" json:"processId"`
	Version   int                `bson:"version" json:"version"`
	Changes   []Change           `bson:"changes" json:"changes"`
	Snapshot  string             `bson:"snapshot" json:"snapshot"`
	AuthorID  primitive.ObjectID `bson:"author_id" json:"authorId"`
	Message   string             `bson:"message" json:"message"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
}

type Change struct {
	Type        string      `bson:"type" json:"type"` // add, update, delete
	ElementID   string      `bson:"element_id" json:"elementId"`
	ElementType string      `bson:"element_type" json:"elementType"`
	OldValue    interface{} `bson:"old_value,omitempty" json:"oldValue,omitempty"`
	NewValue    interface{} `bson:"new_value,omitempty" json:"newValue,omitempty"`
}

// 创建流程请求
type CreateProcessRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	BpmnXML     string   `json:"bpmnXml"`
}

// 更新流程请求
type UpdateProcessRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Category    *string  `json:"category"`
	Tags        []string `json:"tags"`
	BpmnXML     *string  `json:"bpmnXml"`
	Status      *string  `json:"status"`
}

// 分页查询
type Pagination struct {
	Page     int `json:"page" form:"page"`
	PageSize int `json:"pageSize" form:"pageSize"`
}

func (p *Pagination) GetOffset() int {
	return (p.Page - 1) * p.PageSize
}

// 分页响应
type PaginatedResponse struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}
```

- [ ] **Step 4: 创建HTTP处理器**

```go
// backend/internal/handler/process_handler.go

package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/flowforge/backend/internal/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProcessHandler struct {
	collection *mongo.Collection
}

func NewProcessHandler(db *mongo.Database) *ProcessHandler {
	return &ProcessHandler{
		collection: db.Collection("processes"),
	}
}

// 列表查询
func (h *ProcessHandler) List(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// 构建查询
	filter := bson.M{"status": bson.M{"$ne": "archived"}}
	if category := c.Query("category"); category != "" {
		filter["category"] = category
	}
	if search := c.Query("search"); search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	// 查询总数
	total, err := h.collection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 查询数据
	skip := int64((page - 1) * pageSize)
	opts := options.Find().
		SetSkip(skip).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "updated_at", Value: -1}})

	cursor, err := h.collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var processes []domain.Process
	if err := cursor.All(ctx, &processes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, domain.PaginatedResponse{
		Items:      processes,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: int(total)/pageSize + 1,
	})
}

// 获取详情
func (h *ProcessHandler) Get(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var process domain.Process
	err = h.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&process)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, process)
}

// 创建
func (h *ProcessHandler) Create(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req domain.CreateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	process := domain.Process{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Tags:        req.Tags,
		BpmnXML:     req.BpmnXML,
		Version:     1,
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := h.collection.InsertOne(ctx, process)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, process)
}

// 更新
func (h *ProcessHandler) Update(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req domain.UpdateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update := bson.M{"$set": bson.M{"updated_at": time.Now()}}
	if req.Name != nil {
		update["$set"].(bson.M)["name"] = *req.Name
	}
	if req.Description != nil {
		update["$set"].(bson.M)["description"] = *req.Description
	}
	if req.Category != nil {
		update["$set"].(bson.M)["category"] = *req.Category
	}
	if req.Tags != nil {
		update["$set"].(bson.M)["tags"] = req.Tags
	}
	if req.BpmnXML != nil {
		update["$set"].(bson.M)["bpmn_xml"] = *req.BpmnXML
		update["$set"].(bson.M)["version"] = mongo.Pipeline{
			{{"$add", []string{"$version", 1}}},
		}
	}
	if req.Status != nil {
		update["$set"].(bson.M)["status"] = *req.Status
		if *req.Status == "published" {
			now := time.Now()
			update["$set"].(bson.M)["published_at"] = now
		}
	}

	result, err := h.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		return
	}

	var process domain.Process
	h.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&process)
	c.JSON(http.StatusOK, process)
}

// 删除
func (h *ProcessHandler) Delete(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Process deleted"})
}

// 注册路由
func (h *ProcessHandler) RegisterRoutes(r *gin.RouterGroup) {
	processes := r.Group("/processes")
	{
		processes.GET("", h.List)
		processes.POST("", h.Create)
		processes.GET("/:id", h.Get)
		processes.PUT("/:id", h.Update)
		processes.DELETE("/:id", h.Delete)
	}
}
```

- [ ] **Step 5: 创建主入口**

```go
// backend/cmd/server/main.go

package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/flowforge/backend/internal/config"
	"github.com/flowforge/backend/internal/handler"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 连接MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Database.URI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal(err)
	}

	db := client.Database(cfg.Database.Database)

	// 创建Gin引擎
	r := gin.Default()

	// CORS中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API路由
	api := r.Group("/api/v1")
	{
		processHandler := handler.NewProcessHandler(db)
		processHandler.RegisterRoutes(api)
	}

	// 启动服务器
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 6: 提交代码**

```bash
cd backend
go mod tidy
git add .
git commit -m "feat: add Go backend service with process CRUD API"
```

---

## 阶段五：集成与优化（第9-10周）

### Task 9: 前后端集成

**Files:**
- Create: `src/lib/api/client.ts`
- Create: `src/lib/api/processes.ts`
- Create: `src/hooks/useProcess.ts`

- [ ] **Step 1: 创建API客户端**

```typescript
// src/lib/api/client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
```

- [ ] **Step 2: 创建流程API**

```typescript
// src/lib/api/processes.ts

import { apiClient } from './client';
import { ProcessData, PaginatedResponse, ApiResponse } from '@/types/api';

export interface ListProcessesParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export const processesApi = {
  list: (params?: ListProcessesParams) =>
    apiClient.get<PaginatedResponse<ProcessData>>('/processes', params as any),

  get: (id: string) =>
    apiClient.get<ProcessData>(`/processes/${id}`),

  create: (data: { name: string; description?: string; category?: string; tags?: string[]; bpmnXml?: string }) =>
    apiClient.post<ProcessData>('/processes', data),

  update: (id: string, data: Partial<ProcessData>) =>
    apiClient.put<ProcessData>(`/processes/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/processes/${id}`),

  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/processes/import`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },

  export: (id: string, format: 'bpmn' | 'svg' | 'png') =>
    apiClient.get<string>(`/processes/${id}/export/${format}`),
};
```

- [ ] **Step 3: 创建useProcess Hook**

```typescript
// src/hooks/useProcess.ts

import { useState, useEffect, useCallback } from 'react';
import { processesApi, ListProcessesParams } from '@/lib/api/processes';
import { ProcessData, PaginatedResponse } from '@/types/api';

export function useProcessList(params?: ListProcessesParams) {
  const [data, setData] = useState<PaginatedResponse<ProcessData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await processesApi.list(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  return { data, loading, error, refetch: fetchProcesses };
}

export function useProcess(id: string) {
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    processesApi
      .get(id)
      .then(setProcess)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const update = useCallback(
    async (data: Partial<ProcessData>) => {
      const updated = await processesApi.update(id, data);
      setProcess(updated);
      return updated;
    },
    [id]
  );

  return { process, loading, error, update };
}
```

- [ ] **Step 4: 提交代码**

```bash
git add src/lib/api/ src/hooks/
git commit -m "feat: add API client and process hooks for frontend-backend integration"
```

---

### Task 10: 性能优化与测试

**Files:**
- Create: `src/components/flow/flow-optimized.tsx`
- Create: `src/__tests__/flow-store.test.ts`
- Create: `src/__tests__/bpmn-parser.test.ts`

- [ ] **Step 1: 创建优化后的Flow组件**

```tsx
// src/components/flow/flow-optimized.tsx

'use client';

import React, { useMemo, useCallback } from 'react';
import { useFlowStore } from '@/lib/store';
import { FlowNode } from '@/types/flow';

// 视口边界
interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 检查节点是否在视口内
function isNodeInViewport(node: FlowNode, viewport: ViewportBounds): boolean {
  const nodeRight = node.position.x + node.size.width;
  const nodeBottom = node.position.y + node.size.height;

  return (
    node.position.x < viewport.x + viewport.width &&
    nodeRight > viewport.x &&
    node.position.y < viewport.y + viewport.height &&
    nodeBottom > viewport.y
  );
}

// 使用虚拟化优化的节点列表
export function useVirtualizedNodes(margin = 100) {
  const nodes = useFlowStore((state) => state.nodes);
  const viewport = useFlowStore((state) => state.viewport);

  const visibleNodes = useMemo(() => {
    // 计算视口边界（考虑缩放）
    const viewportBounds: ViewportBounds = {
      x: -viewport.x / viewport.zoom - margin,
      y: -viewport.y / viewport.zoom - margin,
      width: window.innerWidth / viewport.zoom + margin * 2,
      height: window.innerHeight / viewport.zoom + margin * 2,
    };

    return nodes.filter((node) => isNodeInViewport(node, viewportBounds));
  }, [nodes, viewport, margin]);

  return visibleNodes;
}

// 优化的节点选择器
export function useNodeSelector(nodeId: string) {
  return useFlowStore(
    useCallback((state) => state.nodes.find((n) => n.id === nodeId), [nodeId])
  );
}

// 优化的边选择器
export function useEdgeSelector(edgeId: string) {
  return useFlowStore(
    useCallback((state) => state.edges.find((e) => e.id === edgeId), [edgeId])
  );
}

// 批量更新Hook
export function useBatchUpdate() {
  const pushHistory = useFlowStore((state) => state.pushHistory);
  const applyNodeChanges = useFlowStore((state) => state.applyNodeChanges);

  const batchMoveNodes = useCallback(
    (nodeIds: string[], delta: { x: number; y: number }) => {
      pushHistory();
      
      const changes = nodeIds.map((id) => ({
        type: 'position' as const,
        id,
        position: {
          x: 0, // Will be calculated by store
          y: 0,
        },
      }));

      // Use store's moveNodes instead
      useFlowStore.getState().moveNodes(nodeIds, delta);
    },
    [pushHistory]
  );

  return { batchMoveNodes };
}
```

- [ ] **Step 2: 创建Store单元测试**

```typescript
// src/__tests__/flow-store.test.ts

import { renderHook, act } from '@testing-library/react';
import { useFlowStore } from '@/lib/store';
import { FlowNode, FlowEdge } from '@/types/flow';

describe('FlowStore', () => {
  beforeEach(() => {
    // 重置store
    useFlowStore.getState().reset();
  });

  describe('Node operations', () => {
    it('should add a node', () => {
      const { result } = renderHook(() => useFlowStore());

      const node: FlowNode = {
        id: 'node-1',
        type: 'userTask',
        position: { x: 100, y: 100 },
        size: { width: 128, height: 80 },
        data: { name: 'Test Task' },
        selected: false,
        dragging: false,
      };

      act(() => {
        result.current.addNode(node);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0]).toEqual(node);
    });

    it('should update a node', () => {
      const { result } = renderHook(() => useFlowStore());

      const node: FlowNode = {
        id: 'node-1',
        type: 'userTask',
        position: { x: 100, y: 100 },
        size: { width: 128, height: 80 },
        data: { name: 'Test Task' },
        selected: false,
        dragging: false,
      };

      act(() => {
        result.current.addNode(node);
        result.current.updateNode('node-1', {
          data: { name: 'Updated Task' },
        });
      });

      expect(result.current.nodes[0].data.name).toBe('Updated Task');
    });

    it('should delete a node and connected edges', () => {
      const { result } = renderHook(() => useFlowStore());

      const node1: FlowNode = {
        id: 'node-1',
        type: 'startEvent',
        position: { x: 0, y: 0 },
        size: { width: 40, height: 40 },
        data: {},
        selected: false,
        dragging: false,
      };

      const node2: FlowNode = {
        id: 'node-2',
        type: 'endEvent',
        position: { x: 200, y: 0 },
        size: { width: 40, height: 40 },
        data: {},
        selected: false,
        dragging: false,
      };

      const edge: FlowEdge = {
        id: 'edge-1',
        type: 'sequenceFlow',
        source: 'node-1',
        target: 'node-2',
        data: {},
        selected: false,
        animated: false,
      };

      act(() => {
        result.current.addNode(node1);
        result.current.addNode(node2);
        result.current.addEdge(edge);
        result.current.deleteNode('node-1');
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.edges).toHaveLength(0);
    });
  });

  describe('Selection', () => {
    it('should select a node', () => {
      const { result } = renderHook(() => useFlowStore());

      const node: FlowNode = {
        id: 'node-1',
        type: 'userTask',
        position: { x: 100, y: 100 },
        size: { width: 128, height: 80 },
        data: {},
        selected: false,
        dragging: false,
      };

      act(() => {
        result.current.addNode(node);
        result.current.selectNode('node-1');
      });

      expect(result.current.selectedNodes).toContain('node-1');
      expect(result.current.nodes[0].selected).toBe(true);
    });

    it('should deselect all', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: true,
          dragging: false,
        });
        result.current.deselectAll();
      });

      expect(result.current.selectedNodes).toHaveLength(0);
      expect(result.current.nodes[0].selected).toBe(false);
    });
  });

  describe('History', () => {
    it('should undo', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.pushHistory();
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(0);
    });

    it('should redo', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.pushHistory();
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 3: 创建BPMN解析器测试**

```typescript
// src/__tests__/bpmn-parser.test.ts

import { parseBpmnXml, serializeToBpmnXml } from '@/lib/bpmn/parser';
import { FlowNode, FlowEdge } from '@/types/flow';

describe('BPMN Parser', () => {
  const sampleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始">
    </bpmn:startEvent>
    <bpmn:userTask id="Task_1" name="用户任务">
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1" name="结束">
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="100" width="40" height="40" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="200" y="80" width="128" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="400" y="100" width="40" height="40" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  it('should parse BPMN XML correctly', () => {
    const { nodes, edges } = parseBpmnXml(sampleBpmnXml);

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);

    // 检查节点
    const startEvent = nodes.find((n) => n.id === 'StartEvent_1');
    expect(startEvent).toBeDefined();
    expect(startEvent?.type).toBe('startEvent');
    expect(startEvent?.data.name).toBe('开始');

    const userTask = nodes.find((n) => n.id === 'Task_1');
    expect(userTask).toBeDefined();
    expect(userTask?.type).toBe('userTask');
    expect(userTask?.data.name).toBe('用户任务');

    // 检查边
    const flow1 = edges.find((e) => e.id === 'Flow_1');
    expect(flow1).toBeDefined();
    expect(flow1?.source).toBe('StartEvent_1');
    expect(flow1?.target).toBe('Task_1');
  });

  it('should serialize nodes and edges to BPMN XML', () => {
    const nodes: FlowNode[] = [
      {
        id: 'StartEvent_1',
        type: 'startEvent',
        position: { x: 100, y: 100 },
        size: { width: 40, height: 40 },
        data: { name: '开始' },
        selected: false,
        dragging: false,
      },
      {
        id: 'Task_1',
        type: 'userTask',
        position: { x: 200, y: 80 },
        size: { width: 128, height: 80 },
        data: { name: '用户任务' },
        selected: false,
        dragging: false,
      },
    ];

    const edges: FlowEdge[] = [
      {
        id: 'Flow_1',
        type: 'sequenceFlow',
        source: 'StartEvent_1',
        target: 'Task_1',
        data: {},
        selected: false,
        animated: false,
      },
    ];

    const xml = serializeToBpmnXml(nodes, edges, 'Process_1', '测试流程');

    expect(xml).toContain('bpmn:definitions');
    expect(xml).toContain('bpmn:startEvent');
    expect(xml).toContain('bpmn:userTask');
    expect(xml).toContain('bpmn:sequenceFlow');
  });

  it('should handle invalid XML', () => {
    expect(() => parseBpmnXml('invalid xml')).toThrow();
  });
});
```

- [ ] **Step 4: 提交代码**

```bash
git add src/__tests__/ src/components/flow/flow-optimized.tsx
git commit -m "feat: add performance optimizations and unit tests"
```

---

## 最终任务：项目配置与文档

### Task 11: 项目配置文件

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `.env.example`
- Update: `README.md`

- [ ] **Step 1: 创建Docker配置**

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8080/api/v1
    depends_on:
      - api

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DATABASE=flowforge
      - REDIS_URI=redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo-data:
```

- [ ] **Step 2: 创建环境变量示例**

```bash
# .env.example

# API配置
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# 数据库配置
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=flowforge

# Redis配置
REDIS_URI=localhost:6379

# JWT配置
JWT_SECRET=your-secret-key-change-in-production
```

- [ ] **Step 3: 更新README**

```markdown
# FlowForge - BPMN 2.0 流程编辑器

一个现代化、高性能的BPMN 2.0流程编辑器，支持大型流程设计与管理。

## 技术栈

- **前端**: Next.js 14, React 18, Zustand, Tailwind CSS, shadcn/ui
- **后端**: Go (Gin/Echo), MongoDB, Redis
- **图形引擎**: 自研（参考React Flow架构）

## 快速开始

### 前置条件

- Node.js 18+
- Go 1.21+
- MongoDB 7+
- Redis 7+

### 开发环境

1. 克隆项目
```bash
git clone https://github.com/your-org/flowforge.git
cd flowforge
```

2. 安装前端依赖
```bash
npm install
```

3. 启动前端开发服务器
```bash
npm run dev
```

4. 启动后端服务
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

### Docker部署

```bash
docker-compose up -d
```

## 项目结构

```
flowforge/
├── src/                    # 前端源码
│   ├── app/                # Next.js App Router
│   ├── components/         # React组件
│   ├── lib/                # 核心库
│   │   ├── flow/           # 图形引擎
│   │   ├── bpmn/           # BPMN语义层
│   │   ├── store/          # Zustand状态管理
│   │   └── api/            # API客户端
│   ├── hooks/              # 自定义Hooks
│   └── types/              # TypeScript类型
├── backend/                # Go后端服务
│   ├── cmd/                # 命令行入口
│   ├── internal/           # 内部包
│   └── pkg/                # 公共包
├── docs/                   # 文档
│   ├── superpowers/        # 设计文档
│   └── plans/              # 实现计划
└── docker-compose.yml      # Docker配置
```

## 核心功能

- ✅ 完整BPMN 2.0元素支持
- ✅ 大型流程优化（200-1000节点）
- ✅ 撤销/重做历史记录
- ✅ 拖拽交互
- ✅ 缩放和平移
- ✅ 属性编辑面板
- ✅ BPMN XML导入导出
- 🚧 实时协作（开发中）
- 🚧 版本管理（开发中）

## 性能优化

- 虚拟化渲染：只渲染视口内的节点
- 变更批处理：批量更新减少重渲染
- React.memo：避免不必要的组件更新
- Zustand shallow比较：优化状态选择

## 许可证

MIT
```

- [ ] **Step 4: 提交代码**

```bash
git add docker-compose.yml .env.example README.md
git commit -m "chore: add Docker configuration and documentation"
```

---

## 实现计划总结

### 阶段划分

| 阶段 | 时间 | 任务 | 交付物 |
|------|------|------|--------|
| 阶段一 | 第1-2周 | 项目初始化与核心图形引擎 | 项目脚手架、类型定义、状态管理、SVG渲染 |
| 阶段二 | 第3-4周 | BPMN语义层与编辑器UI | XML解析器、编辑器组件 |
| 阶段三 | 第5-6周 | 编辑器交互 | 拖拽、连接、属性编辑 |
| 阶段四 | 第7-8周 | 后端服务与集成 | Go API、前后端集成 |
| 阶段五 | 第9-10周 | 优化与测试 | 性能优化、单元测试、部署配置 |

### 关键里程碑

1. **第2周末**: 核心图形引擎可运行
2. **第4周末**: BPMN编辑器基础功能完成
3. **第6周末**: 完整编辑器交互
4. **第8周末**: 前后端集成完成
5. **第10周末**: 生产就绪

### 技术风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| SVG性能瓶颈 | Canvas回退、图层分离 |
| BPMN规范复杂度 | 分阶段实现、参考成熟实现 |
| 大型流程内存问题 | 虚拟化、懒加载 |
| 实时协作冲突 | 最后写入胜出策略 |

---

**Plan Author**: FlowForge Team  
**Created**: 2026-05-05  
**Version**: 1.0.0
