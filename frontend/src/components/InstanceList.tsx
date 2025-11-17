import { useEffect, useMemo, useRef, useState } from 'react';
import type { InstanceSummary, QueueStats } from '../types/gateway';
import { Icons } from './icons';

interface InstanceListProps {
  instances: InstanceSummary[];
  isLoading?: boolean;
  queueStats?: QueueStats | null;
  queueStatsUpdatedAt?: number | null;
  onRefresh: () => void;
}

const STATUS_FILTERS: Array<{ value: '' | 'connected' | 'connecting' | 'disconnected'; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'connected', label: 'Conectados' },
  { value: 'connecting', label: 'Conectando' },
  { value: 'disconnected', label: 'Desconectados' },
];

export function InstanceList({
  instances,
  isLoading,
  queueStats,
  queueStatsUpdatedAt,
  onRefresh,
}: InstanceListProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'connected' | 'connecting' | 'disconnected'>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Icons.Connected />;
      case 'connecting':
        return <Icons.Connecting />;
      case 'disconnected':
        return <Icons.Disconnected />;
      default:
        return <Icons.Info />;
    }
  };

  const getStatusGlyphIcon = (status: '' | 'connected' | 'connecting' | 'disconnected') => {
    switch (status) {
      case 'connected':
        return <Icons.Check className="icon-sm" />;
      case 'connecting':
        return <Icons.Connecting className="icon-sm" />;
      case 'disconnected':
        return <Icons.Error className="icon-sm" />;
      default:
        return <Icons.Info className="icon-sm" />;
    }
  };

  const filteredInstances = useMemo(() => {
    const term = query.trim().toLowerCase();
    return instances.filter((instance) => {
      const matchesId = !term || instance.instanceId.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || instance.status === statusFilter;
      return matchesId && matchesStatus;
    });
  }, [instances, query, statusFilter]);

  return (
    <div className="slide-in">
      <div className="section-heading">
        <div>
          <h2>
            <Icons.Users className="icon-lg" />
            Instancias conectadas
          </h2>
        </div>
        <div className="view-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="form-field" style={{ margin: 0, minWidth: '180px' }}>
            <label htmlFor="instance-search">
              <Icons.Search className="icon-sm" />
              Buscar instancia
            </label>
            <input
              id="instance-search"
              type="text"
              placeholder="Filtra por ID de instancia"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: '220px' }} ref={menuRef}>
            <label htmlFor="status-filter">
              <Icons.Settings className="icon-sm" />
              Estado
            </label>
            <div className={`select-status ${isMenuOpen ? 'open' : ''}`}>
              <button
                id="status-filter"
                type="button"
                className="select-status-trigger"
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                <span className={`dot ${statusFilter || 'all'}`}></span>
                <span className="label">
                  {STATUS_FILTERS.find((o) => o.value === statusFilter)?.label || 'Todos'}
                </span>
                <span className={`status-glyph ${statusFilter || 'all'}`}>{getStatusGlyphIcon(statusFilter)}</span>
                <span className="chevron">▾</span>
              </button>
              {isMenuOpen && (
                <div className="select-status-menu">
                  {STATUS_FILTERS.map((option) => (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      className={`select-status-option ${statusFilter === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setStatusFilter(option.value as typeof statusFilter);
                        setIsMenuOpen(false);
                      }}
                    >
                      <span className={`dot ${option.value || 'all'}`}></span>
                      <span className="label">{option.label}</span>
                      <span className={`status-glyph ${option.value || 'all'}`}>
                        {getStatusGlyphIcon(option.value)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="btn-outline" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <div className="loading"></div> : <Icons.Refresh />}
            Actualizar
          </button>
        </div>
      </div>

      <table className="instances-table">
        <thead>
          <tr>
            <th>Instancia</th>
            <th>Estado</th>
            <th>QR pendiente</th>
          </tr>
        </thead>
        <tbody>
          {instances.length === 0 && query.trim().length === 0 && !statusFilter && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icons.Info className="icon" />
                No hay instancias registradas todavía.
              </td>
            </tr>
          )}
          {instances.length > 0 && filteredInstances.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icons.Info className="icon" />
                No se encontraron resultados con los filtros aplicados.
              </td>
            </tr>
          )}
          {filteredInstances.map((instance) => (
            <tr key={instance.instanceId}>
              <td>
                <Icons.Users className="icon-sm" />
                {instance.instanceId}
              </td>
              <td>
                <span className={`status-badge status-${instance.status}`}>
                  {getStatusIcon(instance.status)}
                  {instance.status}
                </span>
              </td>
              <td>{instance.hasQR ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {queueStats ? (
        <div className="pending-summary queue-meter">
          <Icons.Info className="icon" />
          <div className="queue-meter-row">
            <div className="queue-meter-item">
              <span className="queue-label">En espera</span>
              <strong>{queueStats.waiting + queueStats.delayed}</strong>
            </div>
            <div className="queue-meter-item">
              <span className="queue-label">En proceso</span>
              <strong>{queueStats.active}</strong>
            </div>
            <div className="queue-meter-item">
              <span className="queue-label">Fallidos</span>
              <strong>{queueStats.failed}</strong>
            </div>
            <div className="queue-meter-item">
              <span className="queue-label">Enviados</span>
              <strong>{queueStats.completed}</strong>
            </div>
            {queueStatsUpdatedAt && (
              <span className="queue-updated">
                Última actualización:{' '}
                {new Date(queueStatsUpdatedAt).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="pending-summary">
          <Icons.Info className="icon" />
          <span>No se pudieron obtener las métricas de la cola.</span>
        </div>
      )}
    </div>
  );
}