'use client';

import React, { useCallback, useRef } from 'react';
import { Viewport } from '@/lib/flow/core/viewport';
import { NodeRenderer } from '@/lib/flow/nodes/node-renderer';
import { EdgeRenderer } from '@/lib/flow/edges/edge-renderer';
import { useFlowStore } from '@/lib/store';
import { NodeProps, EdgeProps, FlowNode, FlowEdge, NodeType } from '@/types/flow';
import { logger } from '@/lib/logger';

const defaultNodeTypes: Record<string, React.ComponentType<NodeProps>> = {};
const defaultEdgeTypes: Record<string, React.ComponentType<EdgeProps>> = {};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedNodes = useFlowStore((state) => state.selectedNodes);
  const selectedEdges = useFlowStore((state) => state.selectedEdges);
  const deselectAll = useFlowStore((state) => state.deselectAll);
  const addNode = useFlowStore((state) => state.addNode);
  const pushHistory = useFlowStore((state) => state.pushHistory);
  const viewport = useFlowStore((state) => state.viewport);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { deleteNode, deleteEdge } = useFlowStore.getState();
        
        logger.debug('Deleting selected elements', { nodes: selectedNodes.length, edges: selectedEdges.length });
        selectedNodes.forEach((id) => deleteNode(id));
        selectedEdges.forEach((id) => deleteEdge(id));
      }
      
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        useFlowStore.getState().selectAll();
        logger.debug('Selected all elements');
      }
      
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().undo();
        logger.debug('Undo');
      }
      
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().redo();
        logger.debug('Redo');
      }
      
      if (event.key === 'Escape') {
        deselectAll();
        logger.debug('Deselected all elements');
      }
    },
    [selectedNodes, selectedEdges, deselectAll]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const nodeType = event.dataTransfer.getData('application/bpmn-type') as NodeType;
      if (!nodeType) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

      const size = defaultSizes[nodeType] || { width: 128, height: 80 };

      const newNode: FlowNode = {
        id: `${nodeType}_${Date.now()}`,
        type: nodeType,
        position: { x: x - size.width / 2, y: y - size.height / 2 },
        size,
        data: { name: nodeType },
        selected: false,
        dragging: false,
      };

      addNode(newNode);
      pushHistory();
      logger.debug('Added node via drag', { id: newNode.id, type: nodeType });
    },
    [addNode, pushHistory, viewport]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-50 ${className}`}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
    >
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
      
      <Viewport minZoom={minZoom} maxZoom={maxZoom}>
        <EdgeRenderer edgeTypes={edgeTypes} />
        <NodeRenderer nodeTypes={nodeTypes} />
      </Viewport>
      
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
