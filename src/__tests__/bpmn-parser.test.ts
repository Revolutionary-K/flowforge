import { parseBpmnXml } from '@/lib/bpmn/parser';
import { serializeToBpmnXml } from '@/lib/bpmn/serializer';
import { FlowNode, FlowEdge } from '@/types/flow';

describe('BPMN Parser', () => {
  const sampleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
    </bpmn:startEvent>
    <bpmn:userTask id="Task_1" name="User Task">
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1" name="End">
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="100" width="40" height="40" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="200" y="80" width="128" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="400" y="100" width="40" height="40" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  it('should parse BPMN XML correctly', () => {
    const { nodes, edges } = parseBpmnXml(sampleBpmnXml);

    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);

    const startEvent = nodes.find((n) => n.id === 'StartEvent_1');
    expect(startEvent).toBeDefined();
    expect(startEvent?.type).toBe('startEvent');
    expect(startEvent?.data.name).toBe('Start');

    const userTask = nodes.find((n) => n.id === 'Task_1');
    expect(userTask).toBeDefined();
    expect(userTask?.type).toBe('userTask');
    expect(userTask?.data.name).toBe('User Task');

    const flow1 = edges.find((e) => e.id === 'Flow_1');
    expect(flow1).toBeDefined();
    expect(flow1?.source).toBe('StartEvent_1');
    expect(flow1?.target).toBe('Task_1');
  });

  it('should serialize nodes and edges to BPMN XML', () => {
    const nodes: FlowNode[] = [
      {
        id: 'StartEvent_1',
        type: 'startEvent',
        position: { x: 100, y: 100 },
        size: { width: 40, height: 40 },
        data: { name: 'Start' },
        selected: false,
        dragging: false,
      },
      {
        id: 'Task_1',
        type: 'userTask',
        position: { x: 200, y: 80 },
        size: { width: 128, height: 80 },
        data: { name: 'User Task' },
        selected: false,
        dragging: false,
      },
    ];

    const edges: FlowEdge[] = [
      {
        id: 'Flow_1',
        type: 'sequenceFlow',
        source: 'StartEvent_1',
        target: 'Task_1',
        data: {},
        selected: false,
        animated: false,
      },
    ];

    const xml = serializeToBpmnXml(nodes, edges, 'Process_1', 'Test Process');

    expect(xml).toContain('bpmn:definitions');
    expect(xml).toContain('bpmn:startEvent');
    expect(xml).toContain('bpmn:userTask');
    expect(xml).toContain('bpmn:sequenceFlow');
  });

  it('should handle invalid XML', () => {
    expect(() => parseBpmnXml('invalid xml')).toThrow();
  });
});
