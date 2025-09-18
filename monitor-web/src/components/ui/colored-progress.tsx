"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ColoredProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  showAnimation?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'dynamic';
  size?: 'sm' | 'md' | 'lg';
}

function ColoredProgress({
  className,
  value = 0,
  showAnimation = true,
  colorScheme = 'dynamic',
  size = 'md',
  ...props
}: ColoredProgressProps) {
  // 动态颜色方案
  const getColorClass = () => {
    if (colorScheme === 'dynamic') {
      if (value >= 90) return 'bg-gradient-to-r from-red-500 to-red-600';
      if (value >= 75) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      if (value >= 50) return 'bg-gradient-to-r from-blue-500 to-blue-600';
      return 'bg-gradient-to-r from-green-500 to-green-600';
    }

    const schemes = {
      default: 'bg-gradient-to-r from-blue-500 to-blue-600',
      success: 'bg-gradient-to-r from-green-500 to-green-600',
      warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      danger: 'bg-gradient-to-r from-red-500 to-red-600',
    };

    return schemes[colorScheme];
  };

  const getSizeClass = () => {
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };
    return sizes[size];
  };

  const getBackgroundClass = () => {
    if (value >= 90) return 'bg-red-100 dark:bg-red-900/20';
    if (value >= 75) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (value >= 50) return 'bg-blue-100 dark:bg-blue-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative w-full overflow-hidden rounded-full transition-all duration-300",
        getSizeClass(),
        getBackgroundClass(),
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 rounded-full transition-all duration-700 ease-out",
          getColorClass(),
          showAnimation && "animate-pulse"
        )}
        style={{ 
          transform: `translateX(-${100 - value}%)`,
          boxShadow: value > 0 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
        }}
      />
      {/* 添加光晕效果 */}
      {value > 0 && (
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full opacity-30",
            getColorClass()
          )}
          style={{
            width: `${value}%`,
            filter: 'blur(4px)',
            zIndex: -1,
          }}
        />
      )}
    </ProgressPrimitive.Root>
  );
}

export { ColoredProgress };