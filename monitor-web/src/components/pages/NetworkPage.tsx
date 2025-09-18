"use client";

import NetworkMonitor from "@/components/monitors/NetworkMonitor";

interface NetworkPageProps {
  refreshKey: number;
}

export function NetworkPage({ refreshKey }: NetworkPageProps) {
  return (
    <div className="space-y-6">
      <div key={`network-${refreshKey}`} className="animate-fade-in">
        <NetworkMonitor />
      </div>
    </div>
  );
}