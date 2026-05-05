'use client';

import React, { useCallback } from 'react';
import { Viewport } from '@/lib/flow/core/viewport';
import { NodeRenderer } from '@/lib/flow/nodes/node-renderer';
import { EdgeRenderer } from '@/lib/flow/edges/edge-renderer';
import { useFlowStore } from '@/lib/store';
import { NodeProps, EdgeProps, FlowNode, FlowEdge } from '@/types/flow';

const defaultNodeTypes: Record<string, React.ComponentType<NodeProps>> = {};
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

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { deleteNode, deleteEdge } = useFlowStore.getState();
        
        selectedNodes.forEach((id) => deleteNode(id));
        selectedEdges.forEach((id) => deleteEdge(id));
      }
      
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        useFlowStore.getState().selectAll();
      }
      
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().undo();
      }
      
      if (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        useFlowStore.getState().redo();
      }
      
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
