import React, { useState } from 'react';
import { Save, Globe, ArrowLeft, Laptop, Zap, Cloud } from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
       <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Configurações de Envio</h2>
            <p className="text-sm text-slate-500">Escolha como deseja enviar as mensagens.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => setFormData({...formData, mode: 'web'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        formData.mode === 'web' 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-2' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${formData.mode === 'web' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-800">Modo Navegador</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Abre o WhatsApp Web em uma nova aba para cada contato. Não requer instalação. Ideal para uso imediato.
                    </p>
                </div>

                <div 
                    onClick={() => setFormData({...formData, mode: 'socket'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        formData.mode === 'socket' 
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 ring-offset-2' 
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${formData.mode === 'socket' ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                            <Zap className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-800">Modo Servidor</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Automático e silencioso. Requer um servidor Node.js rodando (Local ou SquareCloud).
                    </p>
                </div>
            </div>

            {formData.mode === 'socket' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-purple-500" /> Endereço do Servidor (URL)
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ex: https://zapflow.squareweb.app"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm mb-3"
                        value={formData.socketUrl}
                        onChange={e => setFormData({...formData, socketUrl: e.target.value})}
                    />
                    
                    <div className="text-xs text-slate-500 space-y-2 bg-white p-3 rounded border border-slate-200">
                        <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-700 whitespace-nowrap">Opção 1 (PC):</span>
                            <span>Use <code>http://localhost:3001</code> se estiver rodando no seu computador.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Cloud className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-slate-700 whitespace-nowrap">Opção 2 (SquareCloud):</span>
                                <p className="mt-0.5">
                                    Vá no Painel SquareCloud &gt; Gerenciar &gt; Copie o <strong>Subdomínio</strong>.<br/>
                                    Deve ser algo como: <code>https://seu-app.squareweb.app</code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                    type="submit"
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm"
                >
                    <Save className="w-5 h-5" /> Salvar Preferências
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};