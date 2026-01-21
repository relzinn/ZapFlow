import React from 'react';
import { Terminal, Copy, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ServerGuideProps {
  onBack: () => void;
}

export const ServerGuide: React.FC<ServerGuideProps> = ({ onBack }) => {
  const serverCode = `const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('QR Code received');
  io.emit('qr', qr);
});

client.on('ready', () => {
  console.log('Client is ready!');
  io.emit('ready');
});

client.on('authenticated', () => {
    io.emit('authenticated');
});

client.initialize();

io.on('connection', (socket) => {
  console.log('Frontend connected');

  socket.on('send_message', async (data) => {
    const { phone, message } = data;
    try {
      const chatId = phone + "@c.us";
      await client.sendMessage(chatId, message);
      socket.emit('message_sent', { phone, status: 'success' });
    } catch (error) {
      console.error(error);
      socket.emit('message_error', { phone, error: error.message });
    }
  });
});

server.listen(3001, () => {
  console.log('SERVER RUNNING ON PORT 3001');
});`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serverCode);
    alert("Código copiado!");
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       <div className="mb-4">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Terminal className="w-6 h-6 text-green-400" />
                    <h2 className="text-xl font-bold">Instalação do Servidor Local</h2>
                </div>
                <p className="text-slate-400 text-sm">
                    Para usar o whatsapp-web.js, você precisa rodar este código no seu computador.
                </p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">Passo 1: Instalar dependências</h3>
                        <p className="text-sm text-slate-600 mb-2">Abra seu terminal, crie uma pasta e rode:</p>
                        <code className="block bg-slate-800 text-green-400 p-3 rounded text-xs font-mono">
                            npm init -y<br/>
                            npm install whatsapp-web.js express socket.io qrcode-terminal
                        </code>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Passo 2: Criar o arquivo server.js</h3>
                            <button 
                                onClick={copyToClipboard}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                            >
                                <Copy className="w-3 h-3" /> Copiar Código
                            </button>
                        </div>
                        <div className="relative">
                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-[400px]">
                                {serverCode}
                            </pre>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">Passo 3: Rodar</h3>
                        <p className="text-sm text-slate-600 mb-2">No terminal, execute:</p>
                        <code className="block bg-slate-800 text-green-400 p-3 rounded text-xs font-mono">
                            node server.js
                        </code>
                        <p className="text-sm text-slate-600 mt-2">
                            Depois disso, volte para esta tela e inicie os disparos. O sistema irá conectar automaticamente em <strong>localhost:3001</strong>.
                        </p>
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};