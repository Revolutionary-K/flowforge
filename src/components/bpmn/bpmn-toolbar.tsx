'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useFlowStore } from '@/lib/store';
import {
  Save,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
} from 'lucide-react';

interface BpmnToolbarProps {
  readOnly: boolean;
  onSave: () => void;
  onExport: (format: 'bpmn' | 'svg' | 'png') => void;
}

export function BpmnToolbar({ readOnly, onSave, onExport }: BpmnToolbarProps) {
  const { undo, redo, selectedNodes, selectedEdges, deleteNode, deleteEdge } = useFlowStore();
  
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  
  const handleDelete = () => {
    selectedNodes.forEach((id) => deleteNode(id));
    selectedEdges.forEach((id) => deleteEdge(id));
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-white">
      {!readOnly && (
        <>
          <Button variant="ghost" size="icon" onClick={onSave} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Export">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('bpmn')}>
                Export BPMN XML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('svg')}>
                Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('png')}>
                Export PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
        </>
      )}
      
      <Button variant="ghost" size="icon" onClick={undo} title="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={redo} title="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {!readOnly && (
        <>
          <Button variant="ghost" size="icon" disabled={!hasSelection} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!hasSelection} title="Cut">
            <Scissors className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Paste">
            <Clipboard className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasSelection}
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
      
      <div className="flex-1" />
      
      <Button variant="ghost" size="icon" title="Zoom In">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Zoom Out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Fit View">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
