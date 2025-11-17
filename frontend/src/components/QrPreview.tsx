import { QRCodeCanvas } from 'qrcode.react';
import type { ConnectionStatus } from '../types/gateway';
import { Icons } from './icons';

interface QrPreviewProps {
  qr?: string;
  status: ConnectionStatus | 'sin_datos';
  message?: string;
  isLoading?: boolean;
}

export function QrPreview({ qr, status, message, isLoading }: QrPreviewProps) {
  const showPlaceholder = !qr;

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
          <Icons.QrCode className="icon-lg" />
          Código QR
        </h2>
        <p>Escanea el QR desde WhatsApp Web en tu teléfono para enlazar la sesión.</p>
      </div>

      <div className="qr-wrapper">
        {isLoading && (
          <div className="pulse">
            <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
            <p>Generando QR...</p>
          </div>
        )}

        {showPlaceholder && !isLoading && (
          <p className="qr-message">
            <Icons.Info className="icon-lg" />
            Aún no se ha generado un QR. Usa el botón "Generar QR" para iniciar la sesión.
          </p>
        )}

        {!showPlaceholder && qr && (
          <>
            <QRCodeCanvas value={qr} size={320} />
            <p className="qr-message">
              Estado: <span className={`status-badge status-${status}`}>
                {getStatusIcon(status)}
                {status}
              </span>
              <br />
              {message || 'Escanea el código desde tu celular.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
