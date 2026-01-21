import React, { useState, useEffect, useRef } from 'react';
import { Contact, AppConfig } from '../types';
import { formatPhoneDisplay } from '../utils/phoneUtils';
import { Send, CheckCircle2, XCircle, SkipForward, RotateCcw, Smartphone, Play, Pause, ExternalLink, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ProcessQueueProps {
  contacts: Contact[];
  template: string;
  config: AppConfig;
  onUpdateStatus: (id: string, status: Contact['status']) => void;
  onReset: () => void;
}

export const ProcessQueue: React.FC<ProcessQueueProps> = ({ contacts, template, config, onUpdateStatus, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [autoDelay, setAutoDelay] = useState(config.mode === 'web' ? 2 : 10);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'ready'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));

  // Initialize Polling (Only if in Server/Socket Mode)
  useEffect(() => {
    if (config.mode !== 'socket') {
        setConnectionStatus('disconnected');
        return;
    }

    setConnectionStatus('connecting');
    addLog(`Conectando a ${config.socketUrl}...`);

    let intervalId: ReturnType<typeof setInterval>;

    const checkServerStatus = async () => {
        try {
            // Remove trailing slash if exists
            const baseUrl = config.socketUrl.replace(/\/$/, "");
            
            const res = await fetch(`${baseUrl}/status`);
            if (!res.ok) throw new Error("Server error");
            
            const data = await res.json();
            // data matches the server response: { status: string, isReady: boolean }
            
            if (data.isReady) {
                if (connectionStatus !== 'ready') {
                    setConnectionStatus('ready');
                    setQrCode(null);
                    addLog('WhatsApp Pronto!');
                }
            } else if (data.status === 'qr_ready') {
                if (connectionStatus !== 'connected' || !qrCode) {
                    setConnectionStatus('connected');
                    // Fetch QR code
                    const qrRes = await fetch(`${baseUrl}/qr`);
                    const qrData = await qrRes.json();
                    if (qrData.qrCode) {
                        setQrCode(qrData.qrCode);
                        addLog('QR Code recebido. Escaneie.');
                    }
                }
            } else {
                 // initializing, disconnected, etc
                 if (connectionStatus !== 'connecting') {
                     // Keep connecting state mostly
                 }
            }
        } catch (e) {
            setConnectionStatus('disconnected');
            // Don't spam logs
        }
    };

    // Initial check
    checkServerStatus();
    
    // Poll every 5 seconds (reduced from 2s to avoid log spam)
    intervalId = setInterval(checkServerStatus, 5000);

    return () => {
        clearInterval(intervalId);
    };
  }, [config.mode, config.socketUrl]); // Removed connectionStatus dependency to avoid re-running effect on state change

  // Find index
  useEffect(() => {
    const firstPending = contacts.findIndex(c => c.status === 'pending');
    if (firstPending !== -1) {
      setCurrentIndex(firstPending);
    } else {
      setCurrentIndex(contacts.length);
      setIsAutoPlaying(false);
    }
  }, [contacts]);

  // Auto-play logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentContact = contacts[currentIndex];
    
    // Conditions to run auto play
    const canPlayWeb = config.mode === 'web'; 
    const canPlaySocket = config.mode === 'socket' && connectionStatus === 'ready';

    if (isAutoPlaying && currentContact && currentContact.status === 'pending' && (canPlayWeb || canPlaySocket)) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        handleSend();
        setCountdown(autoDelay);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, countdown, currentIndex, contacts, autoDelay, connectionStatus, config.mode]);

  const currentContact = contacts[currentIndex];
  const isFinished = contacts.every(c => c.status !== 'pending' && c.status !== 'error');
  const progress = Math.round(((contacts.length - contacts.filter(c => c.status === 'pending').length) / contacts.length) * 100);

  const getMessageForContact = (contact: Contact) => {
    if (!contact) return '';
    let msg = template;
    if (contact.name) {
      msg = msg.replace('{nome}', contact.name);
    } else {
      msg = msg.replace('{nome}', '');
    }
    return msg;
  };

  const handleSend = async () => {
    if (!currentContact) return;
    setLastError(null);

    if (config.mode === 'web') {
        // Web Redirect Logic
        const msg = encodeURIComponent(getMessageForContact(currentContact));
        const url = `https://web.whatsapp.com/send?phone=${currentContact.phone}&text=${msg}`;
        
        // Open in new tab
        const win = window.open(url, '_blank');
        
        if (win) {
            onUpdateStatus(currentContact.id, 'sent');
        } else {
            alert("O navegador bloqueou a abertura da janela. Por favor, permita pop-ups para este site.");
            setIsAutoPlaying(false);
        }
    } 
    else if (config.mode === 'socket') {
        // HTTP Server Logic
        if (connectionStatus !== 'ready') {
            alert("Servidor não está pronto.");
            return;
        }
        addLog(`Enviando para ${currentContact.phone}...`);
        
        try {
            const baseUrl = config.socketUrl.replace(/\/$/, "");
            const res = await fetch(`${baseUrl}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: currentContact.phone,
                    message: getMessageForContact(currentContact)
                })
            });
            
            const data = await res.json();

            if (res.ok && data.success) {
                onUpdateStatus(currentContact.id, 'sent');
                addLog(`Enviado: ${currentContact.phone}`);
            } else {
                throw new Error(data.error || "Erro desconhecido no servidor");
            }
        } catch (e: any) {
             onUpdateStatus(currentContact.id, 'error');
             const errorMsg = e.message || "Falha na requisição";
             setLastError(errorMsg);
             addLog(`Erro: ${errorMsg}`);
             setIsAutoPlaying(false);
        }
    }
  };

  const handleSkip = () => {
    if (!currentContact) return;
    onUpdateStatus(currentContact.id, 'skipped');
    setCountdown(autoDelay);
  };

  const toggleAutoPlay = () => {
    if (!isAutoPlaying) setCountdown(3);
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-end mb-2">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Fila de Disparos</h2>
                <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-slate-500">Modo:</span>
                    <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs ${
                        config.mode === 'web' 
                            ? 'bg-blue-100 text-blue-700' 
                            : (connectionStatus === 'ready' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                    }`}>
                        {config.mode === 'web' ? <ExternalLink className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {config.mode === 'web' ? 'Navegador' : (connectionStatus === 'ready' ? 'Online' : 'Desconectado')}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-3xl font-bold text-blue-600">{progress}%</span>
            </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        <div className="md:col-span-2 flex flex-col space-y-4">
            
            {/* Socket QR Panel (Only if Socket Mode) */}
            {!isFinished && config.mode === 'socket' && connectionStatus !== 'ready' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    {connectionStatus === 'disconnected' ? (
                        <>
                            <div className="bg-red-50 p-4 rounded-full mb-4">
                                <WifiOff className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Servidor Não Detectado</h3>
                            <p className="text-slate-500 mb-4 max-w-sm">
                                Não conseguimos conectar em <code>{config.socketUrl}</code>.
                            </p>
                            <div className="text-xs text-slate-400 animate-pulse">Tentando reconectar...</div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Escaneie o QR Code</h3>
                            {qrCode ? (
                                <div className="bg-white p-2 border rounded-lg shadow-sm">
                                    <img 
                                        src={qrCode} 
                                        alt="QR Code" 
                                        className="w-48 h-48"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-slate-500">Aguardando servidor...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Active Contact Card */}
            {isFinished ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Finalizado!</h3>
                    <button onClick={onReset} className="mt-4 bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reiniciar
                    </button>
                </div>
            ) : (
                <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col p-6 relative overflow-hidden transition-opacity ${config.mode === 'socket' && connectionStatus !== 'ready' ? 'opacity-50 pointer-events-none' : ''}`}>
                   {isAutoPlaying && (
                       <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all ease-linear" style={{ width: `${(countdown / autoDelay) * 100}%`, transitionDuration: '1s' }}></div>
                   )}
                   
                   <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{currentContact?.name || 'Sem nome'}</h3>
                            <p className="text-lg text-slate-600 font-mono">{formatPhoneDisplay(currentContact?.phone || '')}</p>
                        </div>
                   </div>

                   <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 mb-6 overflow-y-auto">
                        <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {getMessageForContact(currentContact)}
                        </p>
                   </div>

                   {/* Error Display */}
                   {lastError && (
                       <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">
                           <strong>Erro no envio:</strong> {lastError}
                       </div>
                   )}

                   <div className="flex gap-3 mb-4">
                        <button onClick={handleSkip} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg hover:bg-slate-200">
                            Pular
                        </button>
                        <button 
                            onClick={handleSend}
                            disabled={config.mode === 'socket' && connectionStatus !== 'ready'}
                            className={`flex-[2] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                                config.mode === 'web' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            <Send className="w-4 h-4" /> 
                            {config.mode === 'web' ? 'Enviar (Abrir Whats)' : 'Enviar Agora'}
                        </button>
                   </div>

                   {/* Logs Area (Server Mode) */}
                   {config.mode === 'socket' && (
                       <div className="bg-slate-900 rounded p-3 text-xs font-mono text-green-400 h-32 overflow-y-auto mb-2">
                           {logs.length === 0 && <span className="opacity-50">Esperando conexão...</span>}
                           {logs.map((log, i) => <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">{log}</div>)}
                       </div>
                   )}

                   {/* Auto Play Controls */}
                   <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {config.mode === 'web' && (
                                <span className="text-xs text-slate-400 mr-2 max-w-[150px] leading-tight">
                                    Atenção: O modo automático web pode ser bloqueado por pop-ups.
                                </span>
                            )}
                            <button
                                onClick={toggleAutoPlay}
                                disabled={config.mode === 'socket' && connectionStatus !== 'ready'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                    isAutoPlaying ? 'bg-red-50 text-red-600' : 'bg-slate-800 text-white'
                                }`}
                            >
                                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isAutoPlaying ? 'Auto Play' : 'Auto Play'}
                            </button>
                        </div>
                        {isAutoPlaying && <span className="text-2xl font-bold text-slate-300">{countdown}s</span>}
                   </div>

                </div>
            )}
        </div>

        {/* History List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px] md:h-auto">
             <div className="p-3 bg-slate-50 border-b font-semibold text-slate-700">Histórico</div>
             <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {contacts.map((contact, idx) => (
                    <div key={contact.id} className={`p-2 rounded border text-sm flex justify-between items-center ${
                        contact.status === 'sent' ? 'bg-green-50 border-green-100' :
                        contact.status === 'error' ? 'bg-red-50 border-red-100' :
                        idx === currentIndex ? 'border-blue-300 bg-blue-50' : 'border-transparent'
                    }`}>
                        <div className="truncate w-24">{contact.name || contact.phone}</div>
                        <div>
                            {contact.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {contact.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                            {contact.status === 'pending' && idx === currentIndex && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                        </div>
                    </div>
                ))}
             </div>
        </div>

      </div>
    </div>
  );
};