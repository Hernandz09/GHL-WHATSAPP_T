export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface QRResponse {
  success: boolean;
  instanceId: string;
  status: ConnectionStatus | string;
  qr?: string;
  message?: string;
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  instanceId: string;
  status: ConnectionStatus | string;
}

export interface InstanceSummary {
  instanceId: string;
  status: ConnectionStatus | string;
  hasQR?: boolean;
}

export interface InstancesResponse {
  success: boolean;
  instances: InstanceSummary[];
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export type SendMessagePayload =
  | {
      instanceId: string;
      to: string;
      type: 'text';
      message: string;
      mediaUrl?: never;
    }
  | {
      instanceId: string;
      to: string;
      type: 'image';
      mediaUrl: string;
      message?: never;
    };

export interface SendResponse {
  success: boolean;
  message: string;
  instanceId: string;
  type: 'text' | 'image';
  jobId: string;
  status: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

