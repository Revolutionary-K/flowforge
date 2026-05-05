'use client';

import React, { memo } from 'react';
import { FlowHandle, HandlePosition, HandleType } from '@/types/flow';

export type { HandlePosition, HandleType };

interface HandleProps extends FlowHandle {
  className?: string;
}

export const Handle = memo(({ type, position, className = '' }: HandleProps) => {
  const positionStyles: Record<HandlePosition, React.CSSProperties> = {
    top: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    right: { right: -4, top: '50%', transform: 'translateY(-50%)' },
    bottom: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    left: { left: -4, top: '50%', transform: 'translateY(-50%)' },
  };
  
  const typeStyles = type === 'source' 
    ? 'bg-blue-500 hover:bg-blue-600' 
    : 'bg-white border-2 border-blue-500 hover:bg-blue-50';
  
  return (
    <div
      className={`
        absolute w-3 h-3 rounded-full cursor-crosshair
        transition-colors duration-150
        ${typeStyles}
        ${className}
      `}
      style={positionStyles[position]}
      data-handle-type={type}
      data-handle-position={position}
    />
  );
});
Handle.displayName = 'Handle';
