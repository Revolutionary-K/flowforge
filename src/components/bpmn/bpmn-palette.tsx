'use client';

import React, { useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';
import { NodeType, FlowNode } from '@/types/flow';

const bpmnElements = [
  {
    category: 'Events',
    items: [
      { type: 'startEvent' as NodeType, label: 'Start Event', icon: '▶' },
      { type: 'endEvent' as NodeType, label: 'End Event', icon: '⏹' },
      { type: 'intermediateEvent' as NodeType, label: 'Intermediate', icon: '⏰' },
      { type: 'boundaryEvent' as NodeType, label: 'Boundary', icon: '⛔' },
    ],
  },
  {
    category: 'Tasks',
    items: [
      { type: 'userTask' as NodeType, label: 'User Task', icon: '👤' },
      { type: 'serviceTask' as NodeType, label: 'Service Task', icon: '⚙️' },
      { type: 'scriptTask' as NodeType, label: 'Script Task', icon: '📜' },
      { type: 'businessRuleTask' as NodeType, label: 'Business Rule', icon: '📋' },
      { type: 'sendTask' as NodeType, label: 'Send Task', icon: '📤' },
      { type: 'receiveTask' as NodeType, label: 'Receive Task', icon: '📥' },
      { type: 'manualTask' as NodeType, label: 'Manual Task', icon: '✋' },
    ],
  },
  {
    category: 'Gateways',
    items: [
      { type: 'exclusiveGateway' as NodeType, label: 'Exclusive', icon: '✕' },
      { type: 'parallelGateway' as NodeType, label: 'Parallel', icon: '+' },
      { type: 'inclusiveGateway' as NodeType, label: 'Inclusive', icon: '○' },
      { type: 'eventBasedGateway' as NodeType, label: 'Event Based', icon: '◇' },
    ],
  },
  {
    category: 'Containers',
    items: [
      { type: 'subprocess' as NodeType, label: 'Subprocess', icon: '📁' },
      { type: 'callActivity' as NodeType, label: 'Call Activity', icon: '📞' },
      { type: 'lane' as NodeType, label: 'Lane', icon: '🏊' },
      { type: 'pool' as NodeType, label: 'Pool', icon: '🏊‍♂️' },
    ],
  },
];

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

interface PaletteItemProps {
  type: NodeType;
  label: string;
  icon: string;
}

function PaletteItem({ type, label, icon }: PaletteItemProps) {
  const addNode = useFlowStore((state) => state.addNode);
  const pushHistory = useFlowStore((state) => state.pushHistory);
  
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/bpmn-type', type);
      event.dataTransfer.effectAllowed = 'copy';
    },
    [type]
  );
  
  const handleClick = useCallback(() => {
    const newNode: FlowNode = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      size: defaultSizes[type],
      data: { name: label },
      selected: false,
      dragging: false,
    };
    
    addNode(newNode);
    pushHistory();
  }, [type, label, addNode, pushHistory]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="
        flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
        hover:bg-gray-100 active:bg-gray-200 active:cursor-grabbing
        transition-colors duration-150
      "
      title={label}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function BpmnPalette() {
  return (
    <div className="w-48 border-r bg-white">
      <div className="px-4 py-3 font-medium text-sm border-b">
        Elements
      </div>
      <ScrollArea className="h-[calc(100%-49px)]">
        <div className="p-2">
          {bpmnElements.map((category, index) => (
            <React.Fragment key={category.category}>
              {index > 0 && <Separator className="my-2" />}
              <div className="mb-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                  {category.category}
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <PaletteItem key={item.type} {...item} />
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
