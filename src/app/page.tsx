'use client';

import { BpmnEditor } from '@/components/bpmn';

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-xl font-semibold">FlowForge - BPMN Editor</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <BpmnEditor />
      </main>
    </div>
  );
}
