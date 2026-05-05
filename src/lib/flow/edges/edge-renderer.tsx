'use client';

import React, { memo } from 'react';
import { FlowEdge, EdgeProps, Position } from '@/types/flow';
import { useFlowStore } from '@/lib/store';

function getBezierPath(source: Position, target: Position): string {
  const midX = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
}

const DefaultEdge = memo(({ source, target, selected, animated, label }: EdgeProps) => {
  const path = getBezierPath(source, target);
  
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={selected ? '#3b82f6' : '#6b7280'}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={animated ? '5 5' : 'none'}
      />
      
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={10}
        className="cursor-pointer"
      />
      
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
