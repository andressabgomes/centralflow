import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Send, 
  Users, 
  MessageSquare,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';

interface WhatsAppStatus {
  connected: boolean;
  clientInfo?: {
    wid: string;
    pushname: string;
    platform: string;
  };
  qrAvailable: boolean;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
  isGroup: boolean;
}

const WhatsAppWebManager: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false, qrAvailable: false });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'qr' | 'messages' | 'contacts'>('qr');
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Verificar status da conexão
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-web/status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
        
        // Se não estiver conectado, tentar obter QR Code
        if (!result.data.connected && result.data.qrAvailable) {
          await getQRCode();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Obter QR Code
  const getQRCode = async () => {
    try {
      const response = await fetch('/api/whatsapp-web/qr');
      const result = await response.json();
      
      if (result.success && result.data.qrCode) {
        setQrCode(result.data.qrCode);
        setQrImage(result.data.qrImage);
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
    }
  };

  // Iniciar conexão WhatsApp Web
  const startConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-web/start', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        await getQRCode();
        startStatusCheck();
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simular conexão (para demonstração)
  const simulateConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-web/connect', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setStatus({ connected: true, qrAvailable: false });
        await getContacts();
      }
    } catch (error) {
      console.error('Erro ao simular conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  // Desconectar WhatsApp Web
  const disconnect = async () => {
    try {
      await fetch('/api/whatsapp-web/disconnect', {
        method: 'POST'
      });
      setStatus({ connected: false, qrAvailable: false });
      setQrCode(null);
      setQrImage(null);
      stopStatusCheck();
      stopMessageStream();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // Limpar sessão
  const logout = async () => {
    try {
      await fetch('/api/whatsapp-web/logout', {
        method: 'POST'
      });
      setStatus({ connected: false, qrAvailable: false });
      setQrCode(null);
      setQrImage(null);
      setMessages([]);
      setContacts([]);
      stopStatusCheck();
      stopMessageStream();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!message.trim() || !recipient.trim()) return;
    
    try {
      const response = await fetch('/api/whatsapp-web/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: recipient,
          message: message
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('');
        // Adicionar mensagem enviada à lista
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          from: 'me',
          to: recipient,
          body: message,
          timestamp: Date.now(),
          type: 'text',
          isGroup: false
        }]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Obter contatos
  const getContacts = async () => {
    try {
      const response = await fetch('/api/whatsapp-web/contacts');
      const result = await response.json();
      
      if (result.success) {
        setContacts(result.data);
      }
    } catch (error) {
      console.error('Erro ao obter contatos:', error);
    }
  };

  // Iniciar verificação de status
  const startStatusCheck = () => {
    if (statusCheckInterval.current) return;
    
    statusCheckInterval.current = setInterval(checkStatus, 3000);
  };

  // Parar verificação de status
  const stopStatusCheck = () => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  };

  // Iniciar stream de mensagens
  const startMessageStream = () => {
    if (eventSourceRef.current) return;
    
    eventSourceRef.current = new EventSource('/api/whatsapp-web/messages-stream');
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.data]);
      } else if (data.type === 'status') {
        setStatus(prev => ({ ...prev, connected: data.data.connected }));
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error('Erro no stream de mensagens:', error);
    };
  };

  // Parar stream de mensagens
  const stopMessageStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Efeitos
  useEffect(() => {
    checkStatus();
    
    return () => {
      stopStatusCheck();
      stopMessageStream();
    };
  }, []);

  useEffect(() => {
    if (status.connected && activeTab === 'contacts') {
      getContacts();
    }
  }, [status.connected, activeTab]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Web</h3>
            <p className="text-sm text-gray-500">
              Conecte seu WhatsApp sem API oficial
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status.connected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'qr'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>QR Code</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'messages'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Mensagens</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Contatos</span>
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          {!status.connected ? (
            <div className="text-center">
              {qrImage ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src={qrImage} 
                      alt="QR Code WhatsApp" 
                      className="w-64 h-64 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">
                      WhatsApp → Menu → Dispositivos conectados → Conectar um dispositivo
                    </p>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={getQRCode}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Atualizar QR Code</span>
                    </button>
                    <button
                      onClick={simulateConnection}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{loading ? 'Conectando...' : 'Simular Conexão'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-8 bg-gray-50 rounded-lg">
                    <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Clique no botão abaixo para iniciar a conexão WhatsApp Web
                    </p>
                    <button
                      onClick={startConnection}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                      <span>{loading ? 'Iniciando...' : 'Iniciar Conexão'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-8 bg-green-50 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-green-900 mb-2">
                  WhatsApp Web Conectado!
                </h4>
                {status.clientInfo && (
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Nome:</strong> {status.clientInfo.pushname}</p>
                    <p><strong>Número:</strong> {status.clientInfo.wid}</p>
                    <p><strong>Plataforma:</strong> {status.clientInfo.platform}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={disconnect}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Desconectar</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {status.connected ? (
            <>
              {/* Enviar mensagem */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatário
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Número do WhatsApp (ex: 5511999999999)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || !recipient.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Mensagem</span>
                </button>
              </div>

              {/* Lista de mensagens */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Mensagens Recentes</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma mensagem ainda
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {msg.from === 'me' ? 'Você' : msg.from}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Conecte o WhatsApp Web para enviar mensagens
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div>
          {status.connected ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">
                  Contatos ({contacts.length})
                </h4>
                <button
                  onClick={getContacts}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Atualizar</span>
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Carregando contatos...
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.number}</p>
                      </div>
                      <button
                        onClick={() => setRecipient(contact.number)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Usar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Conecte o WhatsApp Web para ver contatos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppWebManager;
