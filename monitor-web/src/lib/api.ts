import {
  ApiResponse,
  CpuData,
  MemoryData,
  DiskData,
  NetworkData,
  SystemInfo,
  ProcessData,
} from "@/types/api";

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

// Generic API call function
async function apiCall<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// CPU data API call
export const fetchCpuData = async (): Promise<ApiResponse<CpuData>> => {
  return apiCall<CpuData>("/api/cpu");
};

// Memory data API call
export const fetchMemoryData = async (): Promise<ApiResponse<MemoryData>> => {
  return apiCall<MemoryData>("/api/memory");
};

// Disk data API call
export const fetchDiskData = async (): Promise<ApiResponse<DiskData>> => {
  return apiCall<DiskData>("/api/disk");
};

// Network data API call
export const fetchNetworkData = async (): Promise<ApiResponse<NetworkData>> => {
  return apiCall<NetworkData>("/api/network");
};

// System info API call
export const fetchSystemInfo = async (): Promise<ApiResponse<SystemInfo>> => {
  return apiCall<SystemInfo>("/api/system");
};

// Process data API call
export const fetchProcessData = async (
  limit: number = 10,
  sortBy: string = "cpu"
): Promise<ApiResponse<ProcessData>> => {
  return apiCall<ProcessData>(`/api/processes?limit=${limit}&sort=${sortBy}`);
};