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
