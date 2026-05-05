'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useFlowStore } from '@/lib/store';
import { Position } from '@/types/flow';

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

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      
      const delta = event.deltaY;
      const zoomFactor = 0.001;
      const newZoom = Math.min(
        maxZoom,
        Math.max(minZoom, viewport.zoom - delta * zoomFactor)
      );
      
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

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button === 1 || (event.button === 0 && event.altKey)) {
        event.preventDefault();
        setIsPanning(true);
        setPanStart({ x: event.clientX - viewport.x, y: event.clientY - viewport.y });
      } else if (event.button === 0) {
        if (event.target === containerRef.current) {
          deselectAll();
        }
      }
    },
    [viewport, deselectAll]
  );

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

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

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
