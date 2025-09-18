"use client";

import React from 'react';

interface ModernTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: string) => React.ReactNode;
  formatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  className?: string;
}

export function ModernTooltip({ 
  active, 
  payload, 
  label, 
  labelFormatter,
  formatter,
  className = ""
}: ModernTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className={`
      bg-white/95 dark:bg-gray-900/95 
      backdrop-blur-sm 
      border border-gray-200/50 dark:border-gray-700/50 
      rounded-xl 
      shadow-xl 
      p-3 
      min-w-[120px]
      ${className}
    `}>
      {label && (
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 border-b border-gray-200/50 dark:border-gray-700/50 pb-1">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">
              {formatter ? formatter(entry.value, entry.name || entry.dataKey, entry)[1] : entry.name}:
            </span>
            <span className="font-semibold tabular-nums">
              {formatter ? formatter(entry.value, entry.name || entry.dataKey, entry)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModernLegendProps {
  payload?: any[];
  className?: string;
}

export function ModernLegend({ payload, className = "" }: ModernLegendProps) {
  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-4 justify-center ${className}`}>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}