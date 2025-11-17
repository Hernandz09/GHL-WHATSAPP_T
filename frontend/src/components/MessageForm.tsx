import { useRef, useState, useEffect } from 'react';
import type { SendMessagePayload } from '../types/gateway';
import { Icons } from './icons';

interface MessageFormProps {
  instanceId: string;
  disabled?: boolean;
  isConnected: boolean;
  onSubmit: (payload: SendMessagePayload) => Promise<boolean>;
  onInstanceChange?: (value: string) => void;
}

const DEFAULT_MESSAGE =
  'Hola 👋 Somos el equipo de soporte de GHL. Cuéntanos cómo podemos ayudarte.';

export function MessageForm({
  instanceId,
  disabled,
  isConnected,
  onSubmit,
  onInstanceChange,
}: MessageFormProps) {
    const [to, setTo] = useState('');
    const [type, setType] = useState<'text' | 'image'>('text');
    const [text, setText] = useState(DEFAULT_MESSAGE);
    const [mediaUrl, setMediaUrl] = useState('https://picsum.photos/512/512');
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const typeMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
          setIsTypeOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isConnected || disabled) return;
      if (!to.trim()) return;
      if (type === 'text' && !text.trim()) return;
      if (type === 'image' && !mediaUrl.trim()) return;
  
      const payload: SendMessagePayload =
        type === 'text'
          ? {
              instanceId,
              to,
              type: 'text',
              message: text,
            }
          : {
              instanceId,
              to,
              type: 'image',
              mediaUrl,
            };
  
      const sent = await onSubmit(payload);
      if (sent) {
        setTo('');
        setText(DEFAULT_MESSAGE);
        setMediaUrl('https://picsum.photos/512/512');
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="fade-in">
        <div className="section-heading">
          <h2>
            <Icons.Message className="icon-lg" />
            Enviar Mensaje
          </h2>
        </div>
  
        {onInstanceChange && (
          <div className="form-field">
            <label htmlFor="instance">
              <Icons.Users className="icon-sm" />
              Instancia
            </label>
            <input
              id="instance"
              type="text"
              value={instanceId}
              onChange={(e) => onInstanceChange(e.target.value)}
              placeholder="wa-01"
            />
          </div>
        )}
  
        <div className="form-row form-row-spaced">
          <div className="form-field">
            <label htmlFor="to">
              <Icons.Send className="icon-sm" />
              Número destino (incluye +)
            </label>
            <input
              id="to"
              type="tel"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="+51999999999"
            />
          </div>
          <div className="form-field">
            <label htmlFor="type">
              <Icons.Settings className="icon-sm" />
              Tipo de mensaje
            </label>
            <div className={`select-status ${isTypeOpen ? 'open' : ''}`} ref={typeMenuRef}>
              <button
                id="type"
                type="button"
                className="select-status-trigger"
                onClick={() => setIsTypeOpen((v) => !v)}
              >
                <span className="leading-icons">
                  <span className={`dot ${type === 'text' ? 'text' : 'image'}`}></span>
                  {type === 'text' ? <Icons.Message className="icon-sm" /> : <Icons.Image className="icon-sm" />}
                </span>
                <span className="label">{type === 'text' ? 'Texto' : 'Imagen'}</span>
                <span className="chevron">▾</span>
              </button>
              {isTypeOpen && (
                <div className="select-status-menu">
                  <button
                    type="button"
                    className={`select-status-option ${type === 'text' ? 'active' : ''}`}
                    onClick={() => {
                      setType('text');
                      setIsTypeOpen(false);
                    }}
                  >
                    <span className="leading-icons">
                      <span className="dot text"></span>
                      <Icons.Message className="icon-sm" />
                    </span>
                    <span className="label">Texto</span>
                  </button>
                  <button
                    type="button"
                    className={`select-status-option ${type === 'image' ? 'active' : ''}`}
                    onClick={() => {
                      setType('image');
                      setIsTypeOpen(false);
                    }}
                  >
                    <span className="leading-icons">
                      <span className="dot image"></span>
                      <Icons.Image className="icon-sm" />
                    </span>
                    <span className="label">Imagen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {type === 'text' ? (
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label htmlFor="message">
              <Icons.Message className="icon-sm" />
              Mensaje
            </label>
            <textarea
              id="message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe el mensaje que deseas enviar..."
            />
          </div>
        ) : (
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label htmlFor="mediaUrl">
              <Icons.QrCode className="icon-sm" />
              URL de la imagen
            </label>
            <input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}
  
        <div className="button-row">
          <button className="btn-primary" type="submit" disabled={disabled}>
            {disabled ? <div className="loading"></div> : <Icons.Send />}
            Encolar mensaje
          </button>
          <span className="hint">
            <Icons.Info className="icon-sm" />
            {!isConnected
              ? 'Conecta la instancia para poder enviar mensajes.'
              : type === 'text'
                ? 'Delay automático de 3-4 segundos entre textos.'
                : 'Las imágenes se envían con delay de 6-9 segundos.'}
          </span>
        </div>
      </form>
    );
  }