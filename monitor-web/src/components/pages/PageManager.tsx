"use client";

import { OverviewPage } from "./OverviewPage";
import { CpuPage } from "./CpuPage";
import { MemoryPage } from "./MemoryPage";
import { DiskPage } from "./DiskPage";
import { NetworkPage } from "./NetworkPage";
import { SystemPage } from "./SystemPage";
import { AnalyticsPage } from "./AnalyticsPage";
import { AlertsPage } from "./AlertsPage";
import { SettingsPage } from "./SettingsPage";

interface PageManagerProps {
  activeSection: string;
  refreshKey: number;
}

export function PageManager({ activeSection, refreshKey }: PageManagerProps) {
  const renderPage = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewPage refreshKey={refreshKey} />;
      case "cpu":
        return <CpuPage refreshKey={refreshKey} />;
      case "memory":
        return <MemoryPage refreshKey={refreshKey} />;
      case "disk":
        return <DiskPage refreshKey={refreshKey} />;
      case "network":
        return <NetworkPage refreshKey={refreshKey} />;
      case "system":
        return <SystemPage refreshKey={refreshKey} />;
      case "analytics":
        return <AnalyticsPage />;
      case "alerts":
        return <AlertsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <OverviewPage refreshKey={refreshKey} />;
    }
  };

  return <div className="animate-fade-in">{renderPage()}</div>;
}
