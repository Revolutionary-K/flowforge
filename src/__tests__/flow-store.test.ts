import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowStore } from '@/lib/store';
import { FlowNode, FlowEdge } from '@/types/flow';

describe('FlowStore', () => {
  beforeEach(() => {
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

    it('should move a node to a new position', () => {
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
        result.current.moveNode('node-1', { x: 200, y: 300 });
      });

      expect(result.current.nodes[0].position).toEqual({ x: 200, y: 300 });
    });

    it('should move multiple nodes by delta', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 100, y: 100 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.addNode({
          id: 'node-2',
          type: 'userTask',
          position: { x: 300, y: 100 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.moveNodes(['node-1', 'node-2'], { x: 50, y: 50 });
      });

      expect(result.current.nodes[0].position).toEqual({ x: 150, y: 150 });
      expect(result.current.nodes[1].position).toEqual({ x: 350, y: 150 });
    });
  });

  describe('Edge operations', () => {
    it('should add an edge', () => {
      const { result } = renderHook(() => useFlowStore());

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
        result.current.addEdge(edge);
      });

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0]).toEqual(edge);
    });

    it('should update an edge', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addEdge({
          id: 'edge-1',
          type: 'sequenceFlow',
          source: 'node-1',
          target: 'node-2',
          data: {},
          selected: false,
          animated: false,
        });
        result.current.updateEdge('edge-1', {
          data: { label: 'Updated' },
        });
      });

      expect(result.current.edges[0].data.label).toBe('Updated');
    });

    it('should delete an edge', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addEdge({
          id: 'edge-1',
          type: 'sequenceFlow',
          source: 'node-1',
          target: 'node-2',
          data: {},
          selected: false,
          animated: false,
        });
        result.current.deleteEdge('edge-1');
      });

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

    it('should add to selection with addToSelection flag', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.addNode({
          id: 'node-2',
          type: 'userTask',
          position: { x: 200, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.selectNode('node-1');
        result.current.selectNode('node-2', true);
      });

      expect(result.current.selectedNodes).toHaveLength(2);
      expect(result.current.selectedNodes).toContain('node-1');
      expect(result.current.selectedNodes).toContain('node-2');
    });

    it('should select all nodes and edges', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.addEdge({
          id: 'edge-1',
          type: 'sequenceFlow',
          source: 'node-1',
          target: 'node-2',
          data: {},
          selected: false,
          animated: false,
        });
        result.current.selectAll();
      });

      expect(result.current.selectedNodes).toHaveLength(1);
      expect(result.current.selectedEdges).toHaveLength(1);
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

    it('should not undo when history is empty', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(0);
    });

    it('should not redo when future is empty', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(0);
    });

    it('should clear future on new action after undo', () => {
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
        result.current.addNode({
          id: 'node-2',
          type: 'startEvent',
          position: { x: 0, y: 0 },
          size: { width: 40, height: 40 },
          data: {},
          selected: false,
          dragging: false,
        });
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(1);
    });
  });

  describe('Viewport', () => {
    it('should set viewport', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.setViewport({ x: 100, y: 200, zoom: 1.5 });
      });

      expect(result.current.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });
    });

    it('should partially update viewport', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.setViewport({ zoom: 2 });
      });

      expect(result.current.viewport.zoom).toBe(2);
    });
  });

  describe('Snapshot', () => {
    it('should load from snapshot', () => {
      const { result } = renderHook(() => useFlowStore());

      const snapshot = {
        nodes: [
          {
            id: 'node-1',
            type: 'userTask' as const,
            position: { x: 100, y: 100 },
            size: { width: 128, height: 80 },
            data: { name: 'Task 1' },
            selected: false,
            dragging: false,
          },
        ],
        edges: [
          {
            id: 'edge-1',
            type: 'sequenceFlow' as const,
            source: 'node-1',
            target: 'node-2',
            data: {},
            selected: false,
            animated: false,
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      act(() => {
        result.current.loadFromSnapshot(snapshot);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.edges).toHaveLength(1);
      expect(result.current.history.past).toHaveLength(0);
    });

    it('should reset store', () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.addNode({
          id: 'node-1',
          type: 'userTask',
          position: { x: 0, y: 0 },
          size: { width: 128, height: 80 },
          data: {},
          selected: false,
          dragging: false,
        });
        result.current.pushHistory();
        result.current.reset();
      });

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.edges).toHaveLength(0);
      expect(result.current.selectedNodes).toHaveLength(0);
      expect(result.current.selectedEdges).toHaveLength(0);
      expect(result.current.history.past).toHaveLength(0);
    });
  });
});
