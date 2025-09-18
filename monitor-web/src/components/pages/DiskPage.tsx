"use client";

import DiskMonitor from "@/components/monitors/DiskMonitor";

interface DiskPageProps {
  refreshKey: number;
}

export function DiskPage({ refreshKey }: DiskPageProps) {
  return (
    <div className="space-y-6">
      <div key={`disk-${refreshKey}`} className="animate-fade-in">
        <DiskMonitor />
      </div>
    </div>
  );
}