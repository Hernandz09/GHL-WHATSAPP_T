import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/app.css';
import { InstanceControls } from './InstanceControls';
import { QrPreview } from './QrPreview';
import { MessageForm } from './MessageForm';
import { InstanceList } from './InstanceList';
import { Toast } from './Toast';
import { WhatsAppRain } from './WhatsAppRain';
import { DarkModeToggle } from './darkmode';
import { Icons } from './icons';
import { api } from '../services/api';
import type {
  ConnectionStatus,
  InstanceSummary,
  QRResponse,
  QueueStats,
  SendMessagePayload,
} from '../types/gateway';

type View = 'menu' | 'control' | 'instances' | 'messages';

export function AppContent() {
  const [instanceId, setInstanceId] = useState('wa-01');
  const [status, setStatus] = useState<ConnectionStatus | 'sin_datos'>('sin_datos');
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [instances, setInstances] = useState<InstanceSummary[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueStatsUpdatedAt, setQueueStatsUpdatedAt] = useState<number | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [view, setView] = useState<View>('menu');
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const lastStatusRef = useRef<ConnectionStatus | 'sin_datos'>(status);

  const apiHelpers = useMemo(() => api, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4200);
  }, []);

  const fetchInstances = useCallback(async () => {
    setLoadingInstances(true);
    try {
      const data = await apiHelpers.listInstances();
      setInstances(data.instances);
      setQueueStats(data.queueStats);
      setQueueStatsUpdatedAt(data.queueStats ? Date.now() : null);
    } catch (error: any) {
      showToast('error', error.message || 'No se pudieron cargar las instancias');
    } finally {
      setLoadingInstances(false);
    }
  }, [apiHelpers, showToast]);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const data = await apiHelpers.getStatus(instanceId);
      setStatus(data.status as ConnectionStatus);
      showToast('success', `Estado actualizado: ${data.status}`);
    } catch (error: any) {
      showToast('error', error.message || 'No se pudo consultar el estado');
    } finally {
      setLoadingStatus(false);
    }
  }, [apiHelpers, instanceId, showToast]);

  const handleGenerateQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      const data = await apiHelpers.generateQr(instanceId);
      setQrData(data);
      setStatus(data.status as ConnectionStatus);
      showToast('success', data.message || 'QR generado correctamente');
      fetchInstances();
    } catch (error: any) {
      showToast('error', error.message || 'No se pudo generar el QR');
    } finally {
      setLoadingQr(false);
    }
  }, [apiHelpers, instanceId, showToast, fetchInstances]);

  const handleLogout = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const data = await apiHelpers.logoutInstance(instanceId);
      showToast('success', data.message || 'Sesión cerrada');
      setStatus('disconnected');
      setQrData(null);
      fetchInstances();
    } catch (error: any) {
      showToast('error', error.message || 'No se pudo cerrar la sesión');
    } finally {
      setLoadingStatus(false);
    }
  }, [apiHelpers, instanceId, showToast, fetchInstances]);

  const handleSendMessage = useCallback(
    async (payload: SendMessagePayload): Promise<boolean> => {
      setSending(true);
      try {
        const trimmedTo = payload.to?.trim();
        if (!trimmedTo) {
          showToast('error', 'Ingresa el número destino en formato internacional (+51999999999).');
          return false;
        }
        if (payload.type === 'text' && !payload.message?.trim()) {
          showToast('error', 'El mensaje de texto no puede estar vacío.');
          return false;
        }
        if (payload.type === 'image' && !payload.mediaUrl?.trim()) {
          showToast('error', 'Para enviar imagen debes ingresar la URL de la imagen.');
          return false;
        }
        const latestStatus = await apiHelpers.getStatus(payload.instanceId);
        setStatus(latestStatus.status as ConnectionStatus);
        if (latestStatus.status !== 'connected') {
          showToast('error', `Instancia ${payload.instanceId} no está conectada (estado ${latestStatus.status}).`);
          return false;
        }
        const response = await apiHelpers.sendMessage(payload);
        showToast('success', response.message || 'Mensaje encolado');
        return true;
      } catch (error: any) {
        showToast('error', error.message || 'No se pudo encolar el mensaje');
        return false;
      } finally {
        setSending(false);
      }
    },
    [apiHelpers, showToast]
  );

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    if (view !== 'instances') return;
    fetchInstances();
    const interval = setInterval(() => {
      fetchInstances();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchInstances, view]);

  useEffect(() => {
    lastStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const { classList } = document.body;
    if (isDark) {
      classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return () => classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    if (view !== 'control') return;
    if (status === 'connected') return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const data = await apiHelpers.getStatus(instanceId);
        if (cancelled) return;
        const normalizedStatus = data.status as ConnectionStatus;
        const previous = lastStatusRef.current;
        if (previous !== normalizedStatus) {
          lastStatusRef.current = normalizedStatus;
          if (normalizedStatus === 'connected') {
            showToast('success', 'Instancia conectada');
            fetchInstances();
            // Limpiar la vista de QR para permitir generar otro inmediatamente
            setQrData(null);
            // Limpiar ID de instancia para preparar una nueva creación
            setInstanceId('');
            setStatus('sin_datos');
          }
        }
        setStatus(normalizedStatus);
      } catch (error: any) {
        console.warn('Fallo al consultar estado automático', error?.message);
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiHelpers, fetchInstances, instanceId, showToast, status, view]);


  const menuOptions: Array<{
    id: View;
    title: string;
    description: string;
    action: string;
    chips?: string[];
    badgeClass?: string;
  }> = [
    {
      id: 'control',
      title: 'Conectar / QR',
      description: 'Genera códigos QR, valida estado y cierra sesiones activas.',
      action: 'Ir a control',
      chips: ['QR estable', 'Alertas de desconexión'],
      badgeClass: 'badge-control',
    },
    {
      id: 'instances',
      title: 'Instancias & Métricas',
      description: 'Consulta las instancias activas y la salud de la cola de mensajes.',
      action: 'Ver listado',
      chips: ['Filtros avanzados', 'Salud de cola'],
      badgeClass: 'badge-instances',
    },
    {
      id: 'messages',
      title: 'Enviar Mensajes',
      description: 'Encola textos o imágenes respetando los delays del Gateway.',
      action: 'Abrir formulario',
      chips: ['Texto', 'Imágenes'],
      badgeClass: 'badge-messages',
    },
  ];

  return (
    <div className="app-background">
      <WhatsAppRain />
      <div className="app-shell">
        {toast && <Toast type={toast.type} message={toast.message} />}
        {view === 'menu' && (
          <header className="app-header">
            <div>
              <p className="app-tag">Integración WhatsApp ↔ GHL</p>
              <h1>Panel de Gateway</h1>
              <p className="app-subtitle">
                Conecta, supervisa y envía mensajes usando tu instancia de WhatsApp con Baileys.
              </p>
            </div>
          </header>
        )}
        <nav className="view-nav">
          <button className="btn-outline" onClick={() => setView('menu')}>
            {view === 'menu' ? 'Menú principal' : '← Volver al menú'}
          </button>
          {view === 'menu' && (
            <DarkModeToggle isDark={isDark} onToggle={() => setIsDark((prev) => !prev)} />
          )}
        </nav>

        {view === 'menu' ? (
          <section className="panel span-2 menu-grid">
            {menuOptions.map((option) => (
              <article key={option.id} className="menu-card">
                <div className="card-badge">
                  <span className={`badge ${option.badgeClass ?? ''}`}>
                    {option.id === 'control' && <Icons.QrCode className="icon icon-lg" />}
                    {option.id === 'instances' && <Icons.Users className="icon icon-lg" />}
                    {option.id === 'messages' && <Icons.Message className="icon icon-lg" />}
                  </span>
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                <div className="card-footer">
                  {!!option.chips?.length && (
                    <div className="chip-row">
                      {option.chips.map((chip) => (
                        <span key={chip} className="chip">{chip}</span>
                      ))}
                    </div>
                  )}
                  <button className="btn-primary btn-primary-raised" onClick={() => setView(option.id)}>
                    {option.action}
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <main className="grid">
            {view === 'control' && (
              <>
                <section className="panel span-2">
                  <InstanceControls
                    instanceId={instanceId}
                    status={status}
                    isProcessing={loadingQr || loadingStatus}
                    onInstanceChange={setInstanceId}
                    onGenerateQr={handleGenerateQr}
                    onCheckStatus={fetchStatus}
                    onLogout={handleLogout}
                  />
                </section>

                <section className="panel span-2">
                  <QrPreview
                    qr={qrData?.qr}
                    status={status}
                    message={qrData?.message}
                    isLoading={loadingQr}
                  />
                </section>
              </>
            )}

            {view === 'instances' && (
              <section className="panel span-2">
                <InstanceList
                  instances={instances}
                  isLoading={loadingInstances}
                  queueStats={queueStats}
                  queueStatsUpdatedAt={queueStatsUpdatedAt}
                  onRefresh={fetchInstances}
                />
              </section>
            )}

            {view === 'messages' && (
              <section className="panel span-2">
                <MessageForm
                  instanceId={instanceId}
                  disabled={sending}
                  isConnected={status === 'connected'}
                  onSubmit={handleSendMessage}
                  onInstanceChange={setInstanceId}
                />
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

