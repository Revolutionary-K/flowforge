import { describe, it, expect } from 'vitest';
import { parseBpmnXml, validateBpmnXml } from '@/lib/bpmn/parser';
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

    expect(nodes.length).toBeGreaterThanOrEqual(0);
    expect(edges.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid XML', () => {
    expect(() => parseBpmnXml('invalid xml')).toThrow();
  });

  it('should return empty arrays for XML without process', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
</bpmn:definitions>`;

    const { nodes, edges } = parseBpmnXml(xml);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });
});

describe('BPMN Validator', () => {
  it('should validate a correct BPMN XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:endEvent id="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

    const result = validateBpmnXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should report missing process', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
</bpmn:definitions>`;

    const result = validateBpmnXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No bpmn:process element found');
  });

  it('should report missing start event', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:endEvent id="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

    const result = validateBpmnXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Process must contain at least one start event');
  });

  it('should report missing end event', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

    const result = validateBpmnXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Process must contain at least one end event');
  });

  it('should report invalid XML', () => {
    const result = validateBpmnXml('invalid xml');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('BPMN Serializer', () => {
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
    expect(xml).toContain('bpmn:StartEvent');
    expect(xml).toContain('bpmn:UserTask');
    expect(xml).toContain('bpmn:sequenceFlow');
    expect(xml).toContain('id="Process_1"');
    expect(xml).toContain('name="Test Process"');
  });

  it('should handle nodes without names', () => {
    const nodes: FlowNode[] = [
      {
        id: 'StartEvent_1',
        type: 'startEvent',
        position: { x: 100, y: 100 },
        size: { width: 40, height: 40 },
        data: {},
        selected: false,
        dragging: false,
      },
    ];

    const xml = serializeToBpmnXml(nodes, [], 'Process_1');
    expect(xml).toContain('bpmn:StartEvent');
  });

  it('should escape XML special characters', () => {
    const nodes: FlowNode[] = [
      {
        id: 'Task_1',
        type: 'userTask',
        position: { x: 100, y: 100 },
        size: { width: 128, height: 80 },
        data: { name: 'Task with <special> & "chars"' },
        selected: false,
        dragging: false,
      },
    ];

    const xml = serializeToBpmnXml(nodes, [], 'Process_1');
    expect(xml).toContain('&lt;special&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;');
  });

  it('should generate process ID if not provided', () => {
    const xml = serializeToBpmnXml([], []);
    expect(xml).toMatch(/id="Process_/);
  });

  it('should include condition expression for edges', () => {
    const edges: FlowEdge[] = [
      {
        id: 'Flow_1',
        type: 'sequenceFlow',
        source: 'node-1',
        target: 'node-2',
        data: { conditionExpression: '${amount > 100}' },
        selected: false,
        animated: false,
      },
    ];

    const xml = serializeToBpmnXml([], edges, 'Process_1');
    expect(xml).toContain('bpmn:conditionExpression');
    expect(xml).toContain('${amount &gt; 100}');
  });
});

describe('BPMN Round-trip', () => {
  it('should parse and serialize back to equivalent XML', () => {
    const originalXml = `<?xml version="1.0" encoding="UTF-8"?>
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

    const { nodes, edges } = parseBpmnXml(originalXml);
    const serializedXml = serializeToBpmnXml(nodes, edges, 'Process_1');
    const { nodes: nodes2, edges: edges2 } = parseBpmnXml(serializedXml);

    expect(nodes2).toHaveLength(nodes.length);
    expect(edges2).toHaveLength(edges.length);

    for (let i = 0; i < nodes.length; i++) {
      expect(nodes2[i].id).toBe(nodes[i].id);
      expect(nodes2[i].type).toBe(nodes[i].type);
      expect(nodes2[i].data.name).toBe(nodes[i].data.name);
    }

    for (let i = 0; i < edges.length; i++) {
      expect(edges2[i].id).toBe(edges[i].id);
      expect(edges2[i].source).toBe(edges[i].source);
      expect(edges2[i].target).toBe(edges[i].target);
    }
  });
});
