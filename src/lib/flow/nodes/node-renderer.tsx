'use client';

import React, { memo } from 'react';
import { FlowNode, NodeProps } from '@/types/flow';
import { useFlowStore } from '@/lib/store';
import { Handle } from './handle';
import { logger } from '@/lib/logger';

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
  
  React.useEffect(() => {
    logger.debug('[NodeWrapper] Rendering node', { id: node.id, type: node.type, position: node.position });
  }, []);

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0) return;
      
      event.stopPropagation();
      logger.info('[NodeWrapper] Mouse down on node', { id: node.id, type: node.type });
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
      logger.info('[NodeWrapper] Drag ended', { id: node.id, position: node.position });
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

interface NodeRendererProps {
  nodeTypes: Record<string, React.ComponentType<NodeProps>>;
}

export function NodeRenderer({ nodeTypes }: NodeRendererProps) {
  const nodes = useFlowStore((state) => state.nodes);
  
  React.useEffect(() => {
    logger.debug('[NodeRenderer] Nodes updated', { count: nodes.length });
  }, [nodes.length]);
  
  return (
    <>
      {nodes.map((node) => (
        <NodeWrapper key={node.id} node={node} nodeTypes={nodeTypes} />
      ))}
    </>
  );
}
