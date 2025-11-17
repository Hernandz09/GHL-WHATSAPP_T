import type { ConnectionStatus } from '../types/gateway';
import { Icons } from './icons';

interface InstanceControlsProps {
  instanceId: string;
  status: ConnectionStatus | 'sin_datos';
  isProcessing: boolean;
  onInstanceChange: (value: string) => void;
  onGenerateQr: () => void;
  onCheckStatus: () => void;
  onLogout: () => void;
}

export function InstanceControls({
  instanceId,
  status,
  isProcessing,
  onInstanceChange,
  onGenerateQr,
  onCheckStatus,
  onLogout,
}: InstanceControlsProps) {
  const getStatusIcon = (status: ConnectionStatus | 'sin_datos') => {
    switch (status) {
      case 'connected': return <Icons.Connected />;
      case 'connecting': return <Icons.Connecting />;
      case 'disconnected':
      case 'sin_datos':
        return <Icons.Disconnected />;
      default: return <Icons.Info />;
    }
  };

  return (
    <div className="fade-in">
      <div className="section-heading">
        <h2>
          <Icons.Settings className="icon-lg" />
          Control de Instancia
        </h2>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="instanceId">
            <Icons.Users className="icon-sm" />
            ID de instancia
          </label>
          <input
            id="instanceId"
            type="text"
            value={instanceId}
            onChange={(e) => onInstanceChange(e.target.value)}
            placeholder="wa-01"
          />
        </div>

        <div className="form-field">
          <label>Estado actual</label>
          <span className={`status-badge status-${status}`}>
            {getStatusIcon(status)}
            {status === 'sin_datos' ? 'Sin datos' : status}
          </span>
        </div>
      </div>

      <div className="button-row">
        <button className="btn-primary" onClick={onGenerateQr} disabled={isProcessing}>
          {isProcessing ? <div className="loading"></div> : <Icons.QrCode />}
          Generar QR
        </button>
        <button className="btn-outline" onClick={onCheckStatus} disabled={isProcessing}>
          <Icons.Refresh />
          Verificar estado
        </button>
        <button className="btn-danger" onClick={onLogout} disabled={isProcessing}>
          <Icons.Logout />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}