import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  fetchCpuData, 
  fetchMemoryData, 
  fetchDiskData, 
  fetchNetworkData, 
  fetchSystemInfo 
} from '@/lib/api';
import type { 
  CpuData, 
  MemoryData, 
  DiskData, 
  NetworkData, 
  SystemInfo 
} from '@/types/api';

// 监控数据状态接口
interface MonitoringState {
  // 监控数据
  cpuData: CpuData | null;
  memoryData: MemoryData | null;
  diskData: DiskData | null;
  networkData: NetworkData | null;
  systemInfo: SystemInfo | null;
  
  // 加载状态
  loading: {
    cpu: boolean;
    memory: boolean;
    disk: boolean;
    network: boolean;
    system: boolean;
  };
  
  // 错误状态
  errors: {
    cpu: string | null;
    memory: string | null;
    disk: string | null;
    network: string | null;
    system: string | null;
  };
  
  // Actions
  fetchCpu: () => Promise<void>;
  fetchMemory: () => Promise<void>;
  fetchDisk: () => Promise<void>;
  fetchNetwork: () => Promise<void>;
  fetchSystem: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  clearErrors: () => void;
}

export const useMonitoringStore = create<MonitoringState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      cpuData: null,
      memoryData: null,
      diskData: null,
      networkData: null,
      systemInfo: null,
      
      loading: {
        cpu: false,
        memory: false,
        disk: false,
        network: false,
        system: false,
      },
      
      errors: {
        cpu: null,
        memory: null,
        disk: null,
        network: null,
        system: null,
      },
      
      // Actions
      fetchCpu: async () => {
        set(
          (state) => ({
            loading: { ...state.loading, cpu: true },
            errors: { ...state.errors, cpu: null },
          }),
          false,
          'fetchCpu/start'
        );
        
        try {
          const response = await fetchCpuData();
          if (response.success) {
            set(
              (state) => ({
                cpuData: response.data,
                loading: { ...state.loading, cpu: false },
              }),
              false,
              'fetchCpu/success'
            );
          } else {
            throw new Error(response.message || 'Failed to fetch CPU data');
          }
        } catch (error) {
          set(
            (state) => ({
              loading: { ...state.loading, cpu: false },
              errors: { ...state.errors, cpu: error instanceof Error ? error.message : 'Unknown error' },
            }),
            false,
            'fetchCpu/error'
          );
        }
      },
      
      fetchMemory: async () => {
        set(
          (state) => ({
            loading: { ...state.loading, memory: true },
            errors: { ...state.errors, memory: null },
          }),
          false,
          'fetchMemory/start'
        );
        
        try {
          const response = await fetchMemoryData();
          if (response.success) {
            set(
              (state) => ({
                memoryData: response.data,
                loading: { ...state.loading, memory: false },
              }),
              false,
              'fetchMemory/success'
            );
          } else {
            throw new Error(response.message || 'Failed to fetch memory data');
          }
        } catch (error) {
          set(
            (state) => ({
              loading: { ...state.loading, memory: false },
              errors: { ...state.errors, memory: error instanceof Error ? error.message : 'Unknown error' },
            }),
            false,
            'fetchMemory/error'
          );
        }
      },
      
      fetchDisk: async () => {
        set(
          (state) => ({
            loading: { ...state.loading, disk: true },
            errors: { ...state.errors, disk: null },
          }),
          false,
          'fetchDisk/start'
        );
        
        try {
          const response = await fetchDiskData();
          if (response.success) {
            set(
              (state) => ({
                diskData: response.data,
                loading: { ...state.loading, disk: false },
              }),
              false,
              'fetchDisk/success'
            );
          } else {
            throw new Error(response.message || 'Failed to fetch disk data');
          }
        } catch (error) {
          set(
            (state) => ({
              loading: { ...state.loading, disk: false },
              errors: { ...state.errors, disk: error instanceof Error ? error.message : 'Unknown error' },
            }),
            false,
            'fetchDisk/error'
          );
        }
      },
      
      fetchNetwork: async () => {
        set(
          (state) => ({
            loading: { ...state.loading, network: true },
            errors: { ...state.errors, network: null },
          }),
          false,
          'fetchNetwork/start'
        );
        
        try {
          const response = await fetchNetworkData();
          if (response.success) {
            set(
              (state) => ({
                networkData: response.data,
                loading: { ...state.loading, network: false },
              }),
              false,
              'fetchNetwork/success'
            );
          } else {
            throw new Error(response.message || 'Failed to fetch network data');
          }
        } catch (error) {
          set(
            (state) => ({
              loading: { ...state.loading, network: false },
              errors: { ...state.errors, network: error instanceof Error ? error.message : 'Unknown error' },
            }),
            false,
            'fetchNetwork/error'
          );
        }
      },
      
      fetchSystem: async () => {
        set(
          (state) => ({
            loading: { ...state.loading, system: true },
            errors: { ...state.errors, system: null },
          }),
          false,
          'fetchSystem/start'
        );
        
        try {
          const response = await fetchSystemInfo();
          if (response.success) {
            set(
              (state) => ({
                systemInfo: response.data,
                loading: { ...state.loading, system: false },
              }),
              false,
              'fetchSystem/success'
            );
          } else {
            throw new Error(response.message || 'Failed to fetch system info');
          }
        } catch (error) {
          set(
            (state) => ({
              loading: { ...state.loading, system: false },
              errors: { ...state.errors, system: error instanceof Error ? error.message : 'Unknown error' },
            }),
            false,
            'fetchSystem/error'
          );
        }
      },
      
      fetchAllData: async () => {
        const { fetchCpu, fetchMemory, fetchDisk, fetchNetwork, fetchSystem } = get();
        await Promise.all([
          fetchCpu(),
          fetchMemory(),
          fetchDisk(),
          fetchNetwork(),
          fetchSystem(),
        ]);
      },
      
      clearErrors: () => 
        set({
          errors: {
            cpu: null,
            memory: null,
            disk: null,
            network: null,
            system: null,
          },
        }, false, 'clearErrors'),
    }),
    {
      name: 'monitoring-data-store',
    }
  )
);