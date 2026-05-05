'use client';

import React, { useCallback, useEffect } from 'react';
import { Flow } from '@/components/flow';
import { BpmnToolbar } from './bpmn-toolbar';
import { BpmnPalette } from './bpmn-palette';
import { BpmnProperties } from './bpmn-properties';
import { useFlowStore } from '@/lib/store';
import { parseBpmnXml } from '@/lib/bpmn/parser';
import { serializeToBpmnXml } from '@/lib/bpmn/serializer';
import { NodeProps } from '@/types/flow';

const bpmnNodeTypes: Record<string, React.ComponentType<NodeProps>> = {
  startEvent: ({ data, selected }: NodeProps) => (
    <div className={`
      w-10 h-10 rounded-full border-2 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="text-xs">▶</span>
    </div>
  ),
  endEvent: ({ data, selected }: NodeProps) => (
    <div className={`
      w-10 h-10 rounded-full border-4 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white'}
    `}>
      <span className="text-xs">⏹</span>
    </div>
  ),
  userTask: ({ data, selected }: NodeProps) => (
    <div className={`
      w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
    `}>
      <span className="text-lg mb-1">👤</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || 'User Task'}
      </span>
    </div>
  ),
  serviceTask: ({ data, selected }: NodeProps) => (
    <div className={`
      w-32 h-20 rounded-md border-2 flex flex-col items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
    `}>
      <span className="text-lg mb-1">⚙️</span>
      <span className="text-xs text-center truncate w-full px-1">
        {data.name || 'Service Task'}
      </span>
    </div>
  ),
  exclusiveGateway: ({ data, selected }: NodeProps) => (
    <div className={`
      w-12 h-12 border-2 rotate-45 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="-rotate-45 text-lg font-bold">✕</span>
    </div>
  ),
  parallelGateway: ({ data, selected }: NodeProps) => (
    <div className={`
      w-12 h-12 border-2 rotate-45 flex items-center justify-center
      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'}
    `}>
      <span className="-rotate-45 text-lg font-bold">+</span>
    </div>
  ),
};

interface BpmnEditorProps {
  processId?: string;
  initialXml?: string;
  readOnly?: boolean;
  onSave?: (xml: string) => void;
  onExport?: (format: 'bpmn' | 'svg' | 'png') => void;
}

export function BpmnEditor({
  processId,
  initialXml,
  readOnly = false,
  onSave,
  onExport,
}: BpmnEditorProps) {
  const { loadFromSnapshot, nodes, edges } = useFlowStore();

  useEffect(() => {
    if (initialXml) {
      try {
        const { nodes, edges } = parseBpmnXml(initialXml);
        loadFromSnapshot({
          nodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 1 },
        });
      } catch (error) {
        console.error('Failed to parse BPMN XML:', error);
      }
    }
  }, [initialXml, loadFromSnapshot]);

  const handleSave = useCallback(() => {
    if (onSave) {
      const xml = serializeToBpmnXml(nodes, edges, processId);
      onSave(xml);
    }
  }, [nodes, edges, processId, onSave]);

  const handleExport = useCallback(
    (format: 'bpmn' | 'svg' | 'png') => {
      if (onExport) {
        onExport(format);
      } else {
        const xml = serializeToBpmnXml(nodes, edges, processId);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `process.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [nodes, edges, processId, onExport]
  );

  return (
    <div className="flex flex-col h-full">
      <BpmnToolbar
        readOnly={readOnly}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {!readOnly && <BpmnPalette />}
        
        <div className="flex-1">
          <Flow
            nodeTypes={bpmnNodeTypes}
            className="w-full h-full"
          />
        </div>
        
        <BpmnProperties readOnly={readOnly} />
      </div>
    </div>
  );
}
