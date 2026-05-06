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
import { logger } from '@/lib/logger';

const MAX_HISTORY = 50;

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

export interface FlowStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
  selectedNodes: string[];
  selectedEdges: string[];
  history: {
    past: FlowSnapshot[];
    future: FlowSnapshot[];
  };
  collaboration: {
    userId: string | null;
    users: Map<string, { position: Position; color: string }>;
  };

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: Position) => void;
  moveNodes: (ids: string[], delta: Position) => void;
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, data: Partial<FlowEdge>) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string, addToSelection?: boolean) => void;
  selectEdge: (id: string, addToSelection?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  applyNodeChanges: (changes: NodeChange[]) => void;
  applyEdgeChanges: (changes: EdgeChange[]) => void;
  reset: () => void;
  loadFromSnapshot: (snapshot: FlowSnapshot) => void;
}

export const useFlowStore = create<FlowStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodes: [],
      selectedEdges: [],
      history: { past: [], future: [] },
      collaboration: { userId: null, users: new Map() },

      onNodesChange: (changes: NodeChange[]) => {
        set((state) => {
          state.nodes = applyNodeChangesToNodes(state.nodes, changes);
          const selectedIds = state.nodes.filter(n => n.selected).map(n => n.id);
          state.selectedNodes = selectedIds;
        });
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        set((state) => {
          state.edges = applyEdgeChangesToEdges(state.edges, changes);
          const selectedIds = state.edges.filter(e => e.selected).map(e => e.id);
          state.selectedEdges = selectedIds;
        });
      },

      setViewport: (viewport: Viewport) => {
        set((state) => {
          state.viewport = viewport;
        });
      },

      addNode: (node: FlowNode) => {
        logger.info('[Store] addNode called', { id: node.id, type: node.type, position: node.position });
        set((state) => {
          state.nodes.push(node);
          logger.debug('[Store] Node added to state', { totalNodes: state.nodes.length });
        });
      },

      updateNode: (id: string, data: Partial<FlowNode>) => {
        set((state) => {
          const index = state.nodes.findIndex(n => n.id === id);
          if (index !== -1) {
            Object.assign(state.nodes[index], data);
          }
        });
      },

      deleteNode: (id: string) => {
        logger.info('[Store] deleteNode called', { id });
        set((state) => {
          state.nodes = state.nodes.filter(n => n.id !== id);
          state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
          state.selectedNodes = state.selectedNodes.filter(nId => nId !== id);
          logger.debug('[Store] Node deleted', { remainingNodes: state.nodes.length });
        });
      },

      moveNode: (id: string, position: Position) => {
        set((state) => {
          const node = state.nodes.find(n => n.id === id);
          if (node) {
            node.position = position;
          }
        });
      },

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

      addEdge: (edge: FlowEdge) => {
        logger.info('[Store] addEdge called', { id: edge.id, source: edge.source, target: edge.target });
        set((state) => {
          state.edges.push(edge);
          logger.debug('[Store] Edge added to state', { totalEdges: state.edges.length });
        });
      },

      updateEdge: (id: string, data: Partial<FlowEdge>) => {
        set((state) => {
          const index = state.edges.findIndex(e => e.id === id);
          if (index !== -1) {
            Object.assign(state.edges[index], data);
          }
        });
      },

      deleteEdge: (id: string) => {
        set((state) => {
          state.edges = state.edges.filter(e => e.id !== id);
          state.selectedEdges = state.selectedEdges.filter(eId => eId !== id);
        });
      },

      selectNode: (id: string, addToSelection = false) => {
        logger.info('[Store] selectNode called', { id, addToSelection });
        set((state) => {
          if (!addToSelection) {
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

      undo: () => {
        const { history } = get();
        if (history.past.length === 0) return;

        set((state) => {
          const snapshot = state.history.past.pop()!;
          
          const currentSnapshot: FlowSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: { ...state.viewport },
          };
          state.history.future.push(currentSnapshot);
          
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.viewport = snapshot.viewport;
          state.selectedNodes = [];
          state.selectedEdges = [];
        });
      },

      redo: () => {
        const { history } = get();
        if (history.future.length === 0) return;

        set((state) => {
          const snapshot = state.history.future.pop()!;
          
          const currentSnapshot: FlowSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: { ...state.viewport },
          };
          state.history.past.push(currentSnapshot);
          
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.viewport = snapshot.viewport;
          state.selectedNodes = [];
          state.selectedEdges = [];
        });
      },

      applyNodeChanges: (changes: NodeChange[]) => {
        set((state) => {
          state.nodes = applyNodeChangesToNodes(state.nodes, changes);
          state.selectedNodes = state.nodes.filter(n => n.selected).map(n => n.id);
        });
      },

      applyEdgeChanges: (changes: EdgeChange[]) => {
        set((state) => {
          state.edges = applyEdgeChangesToEdges(state.edges, changes);
          state.selectedEdges = state.edges.filter(e => e.selected).map(e => e.id);
        });
      },

      reset: () => {
        logger.info('[Store] reset called');
        set((state) => {
          state.nodes = [];
          state.edges = [];
          state.viewport = { x: 0, y: 0, zoom: 1 };
          state.selectedNodes = [];
          state.selectedEdges = [];
          state.history = { past: [], future: [] };
        });
      },

      loadFromSnapshot: (snapshot: FlowSnapshot) => {
        logger.info('[Store] loadFromSnapshot called', { nodeCount: snapshot.nodes.length, edgeCount: snapshot.edges.length });
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
