import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 系统状态接口
export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: boolean;
  // 添加状态级别信息
  cpuLevel: "normal" | "warning" | "critical";
  memoryLevel: "normal" | "warning" | "critical";
  diskLevel: "normal" | "warning" | "critical";
}

// 应用状态接口
interface AppState {
  // UI状态
  sidebarCollapsed: boolean;
  isDarkMode: boolean;
  activeSection: string;
  refreshKey: number;
  isRefreshing: boolean;

  // 系统监控数据
  systemStatus: SystemStatus;
  lastUpdated: string;

  // 设置配置
  settings: {
    refreshInterval: number; // 数据刷新间隔（秒）
    historyPoints: number; // 历史数据点数
    autoRefresh: boolean; // 是否启用自动刷新
    themeMode: "system" | "light" | "dark"; // 主题模式
    sidebarDefaultState: "expanded" | "collapsed"; // 侧边栏默认状态
    enableAnimations: boolean; // 启用动画效果
  };

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (isDark: boolean) => void;
  setActiveSection: (section: string) => void;
  triggerRefresh: () => void;
  updateSystemStatus: (status: SystemStatus) => void;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
  loadSettings: () => void;
  applyTheme: (themeMode: "system" | "light" | "dark") => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      sidebarCollapsed: false,
      isDarkMode: false,
      activeSection: "overview",
      refreshKey: 0,
      isRefreshing: false,

      systemStatus: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: true,
      },
      lastUpdated: new Date().toISOString(),

      // 默认设置
      settings: {
        refreshInterval: 60, // 默认60秒刷新（1分钟）
        historyPoints: 20, // 默认20个历史数据点
        autoRefresh: true, // 默认启用自动刷新
        themeMode: "system", // 默认跟随系统
        sidebarDefaultState: "expanded", // 默认展开侧边栏
        enableAnimations: true, // 默认启用动画
      },

      // Actions
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }, false, "setSidebarCollapsed"),

      setDarkMode: (isDark) => {
        // 更新DOM类
        if (typeof window !== "undefined") {
          if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
          }
        }
        set({ isDarkMode: isDark }, false, "setDarkMode");
      },

      setActiveSection: (section) =>
        set({ activeSection: section }, false, "setActiveSection"),

      triggerRefresh: () => {
        set({ isRefreshing: true }, false, "triggerRefresh/start");
        set(
          (state) => ({
            refreshKey: state.refreshKey + 1,
          }),
          false,
          "triggerRefresh/increment"
        );
        // 模拟刷新延迟
        setTimeout(() => {
          set({ isRefreshing: false }, false, "triggerRefresh/end");
        }, 1000);
      },

      updateSystemStatus: (status) =>
        set(
          {
            systemStatus: status,
            lastUpdated: new Date().toISOString(),
          },
          false,
          "updateSystemStatus"
        ),

      toggleDarkMode: () => {
        const currentMode = get().isDarkMode;
        get().setDarkMode(!currentMode);
      },

      updateSettings: (newSettings) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };

        // 保存到localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "monitoring-settings",
            JSON.stringify(updatedSettings)
          );
        }

        set({ settings: updatedSettings }, false, "updateSettings");
      },

      loadSettings: () => {
        if (typeof window !== "undefined") {
          const savedSettings = localStorage.getItem("monitoring-settings");
          if (savedSettings) {
            try {
              const settings = JSON.parse(savedSettings);
              set({ settings }, false, "loadSettings");

              // 应用主题设置
              get().applyTheme(settings.themeMode || "system");

              // 应用侧边栏默认状态
              const shouldCollapse =
                settings.sidebarDefaultState === "collapsed";
              set(
                { sidebarCollapsed: shouldCollapse },
                false,
                "applySidebarDefault"
              );
            } catch (error) {
              console.error("Failed to load settings:", error);
            }
          } else {
            // 初次访问，应用默认主题
            get().applyTheme("system");
          }
        }
      },

      // 应用主题设置
      applyTheme: (themeMode: "system" | "light" | "dark") => {
        if (typeof window !== "undefined") {
          let shouldBeDark = false;

          if (themeMode === "system") {
            // 检测系统主题
            shouldBeDark = window.matchMedia(
              "(prefers-color-scheme: dark)"
            ).matches;

            // 监听系统主题变化
            const mediaQuery = window.matchMedia(
              "(prefers-color-scheme: dark)"
            );
            const handleChange = (e: MediaQueryListEvent) => {
              const currentSettings = get().settings;
              if (currentSettings.themeMode === "system") {
                if (e.matches) {
                  document.documentElement.classList.add("dark");
                  set({ isDarkMode: true }, false, "systemThemeChange");
                } else {
                  document.documentElement.classList.remove("dark");
                  set({ isDarkMode: false }, false, "systemThemeChange");
                }
              }
            };

            // 移除旧的监听器（如果存在）
            mediaQuery.removeEventListener("change", handleChange);
            // 添加新的监听器
            mediaQuery.addEventListener("change", handleChange);
          } else {
            shouldBeDark = themeMode === "dark";
          }

          // 更新DOM
          if (shouldBeDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }

          set({ isDarkMode: shouldBeDark }, false, "applyTheme");
        }
      },
    }),
    {
      name: "monitoring-app-store",
    }
  )
);
