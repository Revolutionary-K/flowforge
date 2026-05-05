import { useMemo } from 'react';
import { useFlowStore } from '@/lib/store';
import { FlowNode, Viewport } from '@/types/flow';

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export function useVirtualizedNodes(margin = 100) {
  const nodes = useFlowStore((state) => state.nodes);
  const viewport = useFlowStore((state) => state.viewport);

  const visibleNodes = useMemo(() => {
    const viewportBounds: ViewportBounds = {
      x: -viewport.x / viewport.zoom - margin,
      y: -viewport.y / viewport.zoom - margin,
      width: (typeof window !== 'undefined' ? window.innerWidth : 1920) / viewport.zoom + margin * 2,
      height: (typeof window !== 'undefined' ? window.innerHeight : 1080) / viewport.zoom + margin * 2,
    };

    return nodes.filter((node) => isNodeInViewport(node, viewportBounds));
  }, [nodes, viewport, margin]);

  return visibleNodes;
}
