'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';

interface BpmnPropertiesProps {
  readOnly: boolean;
}

export function BpmnProperties({ readOnly }: BpmnPropertiesProps) {
  const { nodes, edges, selectedNodes, selectedEdges, updateNode, updateEdge } = useFlowStore();
  
  const selectedNode = selectedNodes.length === 1
    ? nodes.find((n) => n.id === selectedNodes[0])
    : null;
  
  const selectedEdge = selectedEdges.length === 1
    ? edges.find((e) => e.id === selectedEdges[0])
    : null;
  
  const element = selectedNode || selectedEdge;
  
  if (!element) {
    return (
      <div className="w-64 border-l bg-white">
        <div className="px-4 py-3 font-medium text-sm border-b">
          Properties
        </div>
        <div className="p-4 text-sm text-gray-500">
          Select an element to view its properties
        </div>
      </div>
    );
  }
  
  const handleNameChange = (value: string) => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, name: value },
      });
    } else if (selectedEdge) {
      updateEdge(selectedEdge.id, {
        data: { ...selectedEdge.data, name: value },
      });
    }
  };
  
  const handleDescriptionChange = (value: string) => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, documentation: value },
      });
    }
  };

  return (
    <div className="w-64 border-l bg-white">
      <div className="px-4 py-3 font-medium text-sm border-b">
        Properties
      </div>
      <ScrollArea className="h-[calc(100%-49px)]">
        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">
              Basic Info
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="element-id">ID</Label>
                <Input
                  id="element-id"
                  value={element.id}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="element-type">Type</Label>
                <Input
                  id="element-type"
                  value={selectedNode?.type || selectedEdge?.type || ''}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="element-name">Name</Label>
                <Input
                  id="element-name"
                  value={element.data.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  readOnly={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {selectedNode && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Documentation
              </div>
              <div>
                <Label htmlFor="element-doc">Description</Label>
                <Textarea
                  id="element-doc"
                  value={selectedNode.data.documentation || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  readOnly={readOnly}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          {selectedEdge && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Condition
              </div>
              <div>
                <Label htmlFor="edge-condition">Condition Expression</Label>
                <Input
                  id="edge-condition"
                  value={selectedEdge.data.conditionExpression || ''}
                  onChange={(e) => {
                    updateEdge(selectedEdge.id, {
                      data: { ...selectedEdge.data, conditionExpression: e.target.value },
                    });
                  }}
                  readOnly={readOnly}
                  className="mt-1"
                  placeholder="${variable == value}"
                />
              </div>
            </div>
          )}
          
          <Separator />
          
          {selectedNode && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Position & Size
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pos-x">X</Label>
                  <Input
                    id="pos-x"
                    type="number"
                    value={selectedNode.position.x}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        position: { ...selectedNode.position, x: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y">Y</Label>
                  <Input
                    id="pos-y"
                    type="number"
                    value={selectedNode.position.y}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        position: { ...selectedNode.position, y: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="size-w">Width</Label>
                  <Input
                    id="size-w"
                    type="number"
                    value={selectedNode.size.width}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        size: { ...selectedNode.size, width: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="size-h">Height</Label>
                  <Input
                    id="size-h"
                    type="number"
                    value={selectedNode.size.height}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        size: { ...selectedNode.size, height: Number(e.target.value) },
                      });
                    }}
                    readOnly={readOnly}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
