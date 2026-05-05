import { FlowNode, FlowEdge } from '@/types/flow';
import { NODE_TYPE_TO_BPMN } from '@/types/bpmn';

function generateId(): string {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function serializeNode(node: FlowNode): string {
  const bpmnType = NODE_TYPE_TO_BPMN[node.type];
  if (!bpmnType) return '';
  
  const attrs = [
    `id="${node.id}"`,
    node.data.name ? `name="${escapeXml(node.data.name)}"` : '',
  ].filter(Boolean).join(' ');
  
  const documentation = node.data.documentation
    ? `\n      <bpmn:documentation>${escapeXml(node.data.documentation)}</bpmn:documentation>`
    : '';
  
  return `
    <${bpmnType} ${attrs}>${documentation}
    </${bpmnType}>`;
}

function serializeEdge(edge: FlowEdge): string {
  const attrs = [
    `id="${edge.id}"`,
    `sourceRef="${edge.source}"`,
    `targetRef="${edge.target}"`,
    edge.data.name ? `name="${escapeXml(edge.data.name)}"` : '',
  ].filter(Boolean).join(' ');
  
  const condition = edge.data.conditionExpression
    ? `\n      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(edge.data.conditionExpression)}</bpmn:conditionExpression>`
    : '';
  
  return `
    <bpmn:sequenceFlow ${attrs}>${condition}
    </bpmn:sequenceFlow>`;
}

export function serializeToBpmnXml(
  nodes: FlowNode[],
  edges: FlowEdge[],
  processId?: string,
  processName?: string
): string {
  const id = processId || `Process_${generateId()}`;
  const name = processName || 'Unnamed Process';
  
  const elementsXml = nodes.map(serializeNode).join('');
  const flowsXml = edges.map(serializeEdge).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="FlowForge"
                  exporterVersion="1.0.0">
  <bpmn:process id="${id}" name="${escapeXml(name)}" isExecutable="true">
    ${elementsXml}
    ${flowsXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${id}">
      ${nodes.map(node => `
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${node.size.width}" height="${node.size.height}" />
      </bpmndi:BPMNShape>`).join('')}
      ${edges.map(edge => `
      <bpmndi:BPMNEdge id="${edge.id}_di" bpmnElement="${edge.id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>`).join('')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
