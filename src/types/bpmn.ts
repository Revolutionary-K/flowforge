import { NodeType, EdgeType } from './flow';

export interface BpmnElement {
  id: string;
  name?: string;
  documentation?: string;
}

export interface BpmnEvent extends BpmnElement {
  eventType: 'start' | 'end' | 'intermediate' | 'boundary';
  trigger?: string;
  interrupting?: boolean;
}

export interface BpmnTask extends BpmnElement {
  taskType: 'user' | 'service' | 'script' | 'businessRule' | 'send' | 'receive' | 'manual';
  assignee?: string;
  candidateGroups?: string[];
  formKey?: string;
  script?: string;
}

export interface BpmnGateway extends BpmnElement {
  gatewayType: 'exclusive' | 'parallel' | 'inclusive' | 'eventBased';
  defaultFlow?: string;
}

export interface BpmnProcess extends BpmnElement {
  isExecutable: boolean;
  elements: BpmnElement[];
  flows: BpmnSequenceFlow[];
}

export interface BpmnSequenceFlow extends BpmnElement {
  sourceRef: string;
  targetRef: string;
  conditionExpression?: string;
}

export interface BpmnDefinitions {
  id: string;
  targetNamespace: string;
  processes: BpmnProcess[];
}

export const NODE_TYPE_TO_BPMN: Record<NodeType, string> = {
  startEvent: 'bpmn:StartEvent',
  endEvent: 'bpmn:EndEvent',
  intermediateEvent: 'bpmn:IntermediateCatchEvent',
  boundaryEvent: 'bpmn:BoundaryEvent',
  userTask: 'bpmn:UserTask',
  serviceTask: 'bpmn:ServiceTask',
  scriptTask: 'bpmn:ScriptTask',
  businessRuleTask: 'bpmn:BusinessRuleTask',
  sendTask: 'bpmn:SendTask',
  receiveTask: 'bpmn:ReceiveTask',
  manualTask: 'bpmn:ManualTask',
  exclusiveGateway: 'bpmn:ExclusiveGateway',
  parallelGateway: 'bpmn:ParallelGateway',
  inclusiveGateway: 'bpmn:InclusiveGateway',
  eventBasedGateway: 'bpmn:EventBasedGateway',
  subprocess: 'bpmn:SubProcess',
  callActivity: 'bpmn:CallActivity',
  lane: 'bpmn:Lane',
  pool: 'bpmn:Participant',
};

export const BPMN_TYPE_TO_NODE: Record<string, NodeType> = Object.fromEntries(
  Object.entries(NODE_TYPE_TO_BPMN).map(([k, v]) => [v, k as NodeType])
);
