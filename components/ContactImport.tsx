import React, { useState } from 'react';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { Contact } from '../types';
import { parseInputText } from '../utils/phoneUtils';
import { v4 as uuidv4 } from 'uuid';

interface ContactImportProps {
  onImport: (contacts: Contact[]) => void;
}

export const ContactImport: React.FC<ContactImportProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');

  const handleProcess = () => {
    if (!inputText.trim()) return;

    const parsed = parseInputText(inputText);
    if (parsed.length === 0) {
        alert("Nenhum número válido encontrado. Certifique-se de colocar um número por linha.");
        return;
    }

    const contacts: Contact[] = parsed.map(p => ({
      id: uuidv4(),
      raw: p.phone, // using cleaned phone as raw for now
      phone: p.phone,
      name: p.name,
      status: 'pending'
    }));

    onImport(contacts);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Lista de Contatos
        </h2>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Passo 1
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex gap-3">
         <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
         <div className="text-sm text-blue-800">
            <p className="font-medium">Formato aceito:</p>
            <p>Apenas o número (ex: 11999998888) ou Nome, Número (uma por linha).</p>
         </div>
      </div>

      <textarea
        className="w-full flex-1 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm font-mono text-slate-600 mb-4"
        placeholder={`João, 11999998888\nMaria, 21988887777\n41977776666`}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button
        onClick={handleProcess}
        disabled={!inputText.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        Processar Lista <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};