import type {
  InstancesResponse,
  LogoutResponse,
  QRResponse,
  QueueStats,
  SendMessagePayload,
  SendResponse,
  StatusResponse,
} from '../types/gateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Error desconocido en el Gateway');
  }
  return data as T;
}

async function requestOptional<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    return await request<T>(path, options);
  } catch {
    return null;
  }
}

export const api = {
  generateQr(instanceId: string): Promise<QRResponse> {
    return request(`/api/wa/qr/${instanceId}`);
  },
  getStatus(instanceId: string): Promise<StatusResponse> {
    return request(`/api/wa/status/${instanceId}`);
  },
  logoutInstance(instanceId: string): Promise<LogoutResponse> {
    return request(`/api/wa/logout/${instanceId}`, { method: 'POST' });
  },
  async listInstances(): Promise<{
    instances: InstancesResponse['instances'];
    queueStats: QueueStats | null;
  }> {
    const [instancesResponse, queueStats] = await Promise.all([
      request<InstancesResponse>('/api/wa/instances'),
      requestOptional<{ success: boolean; stats: QueueStats }>('/api/send/stats'),
    ]);

    return {
      instances: instancesResponse.instances,
      queueStats: queueStats?.stats ?? null,
    };
  },
  sendMessage(payload: SendMessagePayload): Promise<SendResponse> {
    return request('/api/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};


