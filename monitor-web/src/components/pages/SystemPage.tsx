"use client";

import SystemInfo from "@/components/monitors/SystemInfo";

interface SystemPageProps {
  refreshKey: number;
}

export function SystemPage({ refreshKey }: SystemPageProps) {
  return (
    <div className="space-y-6">
      <div key={`system-${refreshKey}`} className="animate-fade-in">
        <SystemInfo />
      </div>
    </div>
  );
}