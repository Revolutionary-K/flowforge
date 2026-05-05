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
