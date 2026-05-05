import {
  BPMN_TYPE_TO_NODE,
} from '@/types/bpmn';
import { FlowNode, FlowEdge, NodeType } from '@/types/flow';

function parseXml(xml: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`);
  }
  
  return doc;
}

function getAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of element.attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

function parseBounds(element: Element): { x: number; y: number; width: number; height: number } | null {
  const boundsElement = element.querySelector('omg\\:Bounds, Bounds');
  if (!boundsElement) return null;
  
  return {
    x: parseFloat(boundsElement.getAttribute('x') || '0'),
    y: parseFloat(boundsElement.getAttribute('y') || '0'),
    width: parseFloat(boundsElement.getAttribute('width') || '0'),
    height: parseFloat(boundsElement.getAttribute('height') || '0'),
  };
}

function parseElement(element: Element, bpmnType: string): FlowNode | null {
  const nodeId = BPMN_TYPE_TO_NODE[bpmnType];
  if (!nodeId) return null;
  
  const attrs = getAttributes(element);
  const bounds = parseBounds(element);
  
  if (!bounds) return null;
  
  return {
    id: attrs.id,
    type: nodeId as NodeType,
    position: { x: bounds.x, y: bounds.y },
    size: { width: bounds.width, height: bounds.height },
    data: {
      name: attrs.name,
      documentation: element.querySelector('bpmn\\:documentation, documentation')?.textContent,
    },
    selected: false,
    dragging: false,
  };
}

function parseSequenceFlow(element: Element): FlowEdge | null {
  const attrs = getAttributes(element);
  
  if (!attrs.id || !attrs.sourceRef || !attrs.targetRef) return null;
  
  return {
    id: attrs.id,
    type: 'sequenceFlow',
    source: attrs.sourceRef,
    target: attrs.targetRef,
    data: {
      name: attrs.name,
      conditionExpression: element.querySelector('bpmn\\:conditionExpression, conditionExpression')?.textContent,
    },
    selected: false,
    animated: false,
  };
}

export function parseBpmnXml(xml: string): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const doc = parseXml(xml);
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  
  const bpmnTypes = Object.keys(BPMN_TYPE_TO_NODE);
  
  for (const bpmnType of bpmnTypes) {
    const elements = doc.querySelectorAll(`bpmn\\:${bpmnType}, ${bpmnType}`);
    
    for (const element of elements) {
      const node = parseElement(element, bpmnType);
      if (node) {
        nodes.push(node);
      }
    }
  }
  
  const sequenceFlows = doc.querySelectorAll('bpmn\\:sequenceFlow, sequenceFlow');
  for (const flow of sequenceFlows) {
    const edge = parseSequenceFlow(flow);
    if (edge) {
      edges.push(edge);
    }
  }
  
  return { nodes, edges };
}

export function validateBpmnXml(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const doc = parseXml(xml);
    
    const processes = doc.querySelectorAll('bpmn\\:process, process');
    if (processes.length === 0) {
      errors.push('No bpmn:process element found');
    }
    
    const startEvents = doc.querySelectorAll('bpmn\\:startEvent, startEvent');
    if (startEvents.length === 0) {
      errors.push('Process must contain at least one start event');
    }
    
    const endEvents = doc.querySelectorAll('bpmn\\:endEvent, endEvent');
    if (endEvents.length === 0) {
      errors.push('Process must contain at least one end event');
    }
    
  } catch (error: any) {
    errors.push(`XML parsing error: ${error.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
