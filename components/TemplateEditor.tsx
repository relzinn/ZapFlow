import React, { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface TemplateEditorProps {
  template: string;
  setTemplate: (t: string) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, setTemplate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!process.env.API_KEY) {
      alert("Chave de API não configurada no ambiente.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Crie uma mensagem curta, profissional e persuasiva para WhatsApp.
        Contexto: Sou um corretor de imóveis entrando em contato com um possível proprietário de um apartamento.
        Objetivo: Perguntar educadamente se o imóvel ainda está à venda ou se ele considera vender.
        Tom: Profissional, direto, mas amigável. Sem exageros.
        A mensagem deve ter no máximo 3 frases.
        Use espaçamento entre as linhas para facilitar a leitura.
        Não coloque "Assunto:".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        setTemplate(response.text.trim());
      }
    } catch (error) {
      console.error("Erro ao gerar texto:", error);
      alert("Erro ao conectar com a IA. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Mensagem Padrão
        </h2>
        <button
          onClick={handleAiGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors font-medium border border-purple-200"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? 'Criando...' : 'Gerar com IA'}
        </button>
      </div>
      
      <p className="text-sm text-slate-500 mb-3">
        Use <strong>{'{nome}'}</strong> para inserir o nome do contato automaticamente (se disponível).
      </p>

      <textarea
        className="w-full flex-1 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-slate-700 leading-relaxed font-sans"
        placeholder="Olá {nome}, tudo bem? Vi que você tem um imóvel no condomínio..."
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      />
    </div>
  );
};