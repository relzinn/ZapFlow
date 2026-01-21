import React, { useState } from 'react';
import { Layout, MessageSquare, Zap, Settings as SettingsIcon } from 'lucide-react';
import { AppStep, Contact, AppConfig } from './types';
import { ContactImport } from './components/ContactImport';
import { TemplateEditor } from './components/TemplateEditor';
import { ProcessQueue } from './components/ProcessQueue';
import { Settings } from './components/Settings';

const DEFAULT_TEMPLATE = `Olá {nome}, tudo bem?

Sou corretor de imóveis e estou com clientes procurando apartamentos no seu condomínio.

Você teria interesse em vender o seu imóvel ou ouvir uma proposta sem compromisso?`;

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.SETUP);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  
  // Configuration State
  const [config, setConfig] = useState<AppConfig>({
      mode: 'web', // Default to Web mode (no install required)
      socketUrl: 'http://localhost:3001'
  });

  const handleImportContacts = (importedContacts: Contact[]) => {
    setContacts(importedContacts);
  };

  const handleStartProcess = () => {
    if (contacts.length === 0) {
      alert("Adicione pelo menos um contato para iniciar.");
      return;
    }
    if (!template.trim()) {
      alert("Configure uma mensagem padrão.");
      return;
    }
    setStep(AppStep.PROCESS);
  };

  const handleUpdateStatus = (id: string, status: Contact['status']) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleReset = () => {
    if (confirm("Isso irá limpar sua lista atual. Deseja continuar?")) {
        setContacts([]);
        setStep(AppStep.SETUP);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              ZapFlow <span className="text-blue-600 font-light">Imobiliário</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {step !== AppStep.SETTINGS && (
                 <button 
                    onClick={() => setStep(AppStep.SETTINGS)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
                 >
                    <SettingsIcon className="w-4 h-4" /> Configurações
                 </button>
             )}
             {step === AppStep.PROCESS && (
                 <button 
                    onClick={handleReset}
                    className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors"
                 >
                    Cancelar
                 </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {step === AppStep.SETTINGS && (
            <Settings 
                config={config}
                onSave={(newConfig) => {
                    setConfig(newConfig);
                    setStep(contacts.length > 0 ? AppStep.PROCESS : AppStep.SETUP);
                }}
                onCancel={() => setStep(contacts.length > 0 ? AppStep.PROCESS : AppStep.SETUP)}
            />
        )}

        {step === AppStep.SETUP && (
          <div className="h-full flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto mb-4">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Disparos de WhatsApp</h2>
                <p className="text-slate-600 text-lg">
                    Sistema prático para envio de mensagens. <br/>
                    <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Modo Atual: {config.mode === 'web' ? 'Navegador (Sem instalação)' : 'Servidor Automático'}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch min-h-[500px]">
              <ContactImport onImport={handleImportContacts} />
              
              <div className="flex flex-col gap-6">
                <div className="flex-1">
                    <TemplateEditor template={template} setTemplate={setTemplate} />
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-2">
                             <Layout className="w-5 h-5 text-blue-600" />
                             <span className="font-semibold text-slate-800">Resumo</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                        <span className="text-slate-600">Contatos carregados:</span>
                        <span className={`text-2xl font-bold ${contacts.length > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                            {contacts.length}
                        </span>
                    </div>

                    <button
                        onClick={handleStartProcess}
                        disabled={contacts.length === 0}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        Iniciar Disparos
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === AppStep.PROCESS && (
          <ProcessQueue 
            contacts={contacts}
            template={template}
            config={config}
            onUpdateStatus={handleUpdateStatus}
            onReset={handleReset}
          />
        )}

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} ZapFlow Imobiliário. Ferramenta gratuita de produtividade.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;