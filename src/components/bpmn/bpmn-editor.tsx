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
import { logger } from '@/lib/logger';
import {
  StartEventNode,
  EndEventNode,
  UserTaskNode,
  ServiceTaskNode,
  ExclusiveGatewayNode,
  ParallelGatewayNode,
} from './nodes/BpmnNodes';

const bpmnNodeTypes: Record<string, React.ComponentType<NodeProps>> = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  userTask: UserTaskNode,
  serviceTask: ServiceTaskNode,
  exclusiveGateway: ExclusiveGatewayNode,
  parallelGateway: ParallelGatewayNode,
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
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    logger.info('[BpmnEditor] Component mounted', { processId, readOnly, hasInitialXml: !!initialXml });
    logger.debug('[BpmnEditor] Registered nodeTypes', { types: Object.keys(bpmnNodeTypes) });
    setIsMounted(true);
  }, []);

  useEffect(() => {
    logger.debug('[BpmnEditor] Nodes changed', { count: nodes.length });
  }, [nodes.length]);

  useEffect(() => {
    logger.debug('[BpmnEditor] Edges changed', { count: edges.length });
  }, [edges.length]);

  useEffect(() => {
    if (initialXml) {
      logger.info('[BpmnEditor] Loading initial BPMN XML');
      try {
        const { nodes, edges } = parseBpmnXml(initialXml);
        logger.debug('[BpmnEditor] Parsed BPMN XML', { nodeCount: nodes.length, edgeCount: edges.length });
        loadFromSnapshot({
          nodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 1 },
        });
        logger.info('[BpmnEditor] BPMN XML loaded successfully', { nodeCount: nodes.length, edgeCount: edges.length });
      } catch (error) {
        logger.error('[BpmnEditor] Failed to parse BPMN XML', error);
      }
    }
  }, [initialXml, loadFromSnapshot]);

  const handleSave = useCallback(() => {
    if (onSave) {
      logger.debug('Saving BPMN process');
      const xml = serializeToBpmnXml(nodes, edges, processId);
      onSave(xml);
      logger.info('BPMN process saved');
    }
  }, [nodes, edges, processId, onSave]);

  const handleExport = useCallback(
    (format: 'bpmn' | 'svg' | 'png') => {
      logger.debug(`Exporting as ${format}`);
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
        logger.info(`Exported as ${format}`);
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
          {isMounted ? (
            <Flow
              nodeTypes={bpmnNodeTypes}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-50" />
          )}
        </div>
        
        <BpmnProperties readOnly={readOnly} />
      </div>
    </div>
  );
}
