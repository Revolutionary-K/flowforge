'use client';

import React from 'react';
import { NodeProps } from '@/types/flow';

export function StartEventNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-10 h-10 rounded-full border-2 flex items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
      `}
    >
      <span className="text-xs">▶</span>
    </div>
  );
}

export function EndEventNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-10 h-10 rounded-full border-4 flex items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white'}
      `}
    >
      <span className="text-xs">⏹</span>
    </div>
  );
}

export function UserTaskNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
      `}
    >
      <span className="text-lg mb-1">👤</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || 'User Task'}
      </span>
    </div>
  );
}

export function ServiceTaskNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
      `}
    >
      <span className="text-lg mb-1">⚙️</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || 'Service Task'}
      </span>
    </div>
  );
}

export function ExclusiveGatewayNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-12 h-12 border-2 rotate-45 flex items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
      `}
    >
      <span className="-rotate-45 text-lg font-bold">✕</span>
    </div>
  );
}

export function ParallelGatewayNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        w-12 h-12 border-2 rotate-45 flex items-center justify-center
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
      `}
    >
      <span className="-rotate-45 text-lg font-bold">+</span>
    </div>
  );
}
