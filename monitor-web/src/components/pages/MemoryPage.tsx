"use client";

import MemoryMonitor from "@/components/monitors/MemoryMonitor";

interface MemoryPageProps {
  refreshKey: number;
}

export function MemoryPage({ refreshKey }: MemoryPageProps) {
  return (
    <div className="space-y-6">
      <div key={`memory-${refreshKey}`} className="animate-fade-in">
        <MemoryMonitor />
      </div>
    </div>
  );
}