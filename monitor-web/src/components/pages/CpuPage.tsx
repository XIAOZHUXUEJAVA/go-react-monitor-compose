"use client";

import CpuMonitor from "@/components/monitors/CpuMonitor";

interface CpuPageProps {
  refreshKey: number;
}

export function CpuPage({ refreshKey }: CpuPageProps) {
  return (
    <div className="space-y-6">
      <div key={`cpu-${refreshKey}`} className="animate-fade-in">
        <CpuMonitor />
      </div>
    </div>
  );
}