import { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import WhatsAppBusinessSetup from './WhatsAppBusinessSetup';

interface WhatsAppQRConnectProps {
  onConnected: (phoneNumber: string) => void;
  onError: (error: string) => void;
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  phoneNumber?: string;
  error?: string;
}

export default function WhatsAppQRConnect({ onConnected, onError }: WhatsAppQRConnectProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'disconnected' });
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  

  const startConnection = async () => {
    setIsLoading(true);
    setConnectionStatus({ status: 'connecting' });

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus({
          status: result.data.status === 'connected' ? 'connected' : 'connecting',
          phoneNumber: result.data.phoneNumber,
        });
        
        if (result.data.status === 'connected') {
          onConnected(result.data.phoneNumber || 'Conectado');
        } else {
          // Start polling for connection status
          startPolling(result.data.sessionId);
        }
      } else {
        setConnectionStatus({
          status: 'error',
          error: result.error || 'Erro ao iniciar conexão',
        });
        onError(result.error || 'Erro ao iniciar conexão');
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = 'Erro ao conectar com o servidor';
      setConnectionStatus({
        status: 'error',
        error: errorMessage,
      });
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (sessionId: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/status/${sessionId}`);
        const result = await response.json();

        if (result.success) {
          const status = result.data.status;

          if (status === 'connected') {
            setConnectionStatus({
              status: 'connected',
              phoneNumber: result.data.phoneNumber,
            });
            
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            
            onConnected(result.data.phoneNumber);
          } else if (status === 'error') {
            setConnectionStatus({
              status: 'error',
              error: result.data.error || 'Erro na conexão',
            });
            
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            
            onError(result.data.error || 'Erro na conexão');
          }
          // Continue polling for other statuses (qr_ready, connecting)
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  const disconnect = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnectionStatus({ status: 'disconnected' });
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connecting':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Smartphone className="h-6 w-6 text-gray-400" />;
    }
  };

  const renderContent = () => {
    switch (connectionStatus.status) {
      case 'disconnected':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Conectar WhatsApp Business API
            </h3>
            <p className="text-gray-600 mb-6">
              Use a API oficial do WhatsApp Business para integração empresarial completa com suporte a webhooks e mídia.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 mb-2">WhatsApp Business API</p>
                  <p className="text-sm text-blue-800">
                    Integração oficial do Meta para empresas. Requer configuração de webhook e token de acesso. 
                    Ideal para uso em produção com alta disponibilidade.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowSetup(true)}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Configurar API</span>
              </button>
              
              <button
                onClick={startConnection}
                disabled={isLoading}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                <span>Conectar Business API</span>
              </button>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Conectando...
            </h3>
            <p className="text-gray-600">
              Verificando credenciais do WhatsApp Business API.
            </p>
          </div>
        );

      

      case 'connected':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              WhatsApp Business API Conectado!
            </h3>
            <p className="text-gray-600 mb-2">
              Número conectado: <strong>{connectionStatus.phoneNumber}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Conectado via WhatsApp Business API. Agora você receberá mensagens do WhatsApp como tickets automaticamente.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-green-800">
                <strong>Business API:</strong> Integração oficial do Meta WhatsApp Business. 
                Esta integração oferece máxima confiabilidade e recursos avançados.
              </p>
            </div>
            <button
              onClick={disconnect}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro na Conexão
            </h3>
            <p className="text-red-600 mb-6">
              {connectionStatus.error}
            </p>
            <button
              onClick={startConnection}
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (showSetup) {
    return (
      <WhatsAppBusinessSetup 
        onComplete={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        {renderStatusIcon()}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            WhatsApp Business
          </h3>
          <p className="text-sm text-gray-600">
            Status: {
              {
                disconnected: 'Desconectado',
                connecting: 'Conectando...',
                connected: 'Conectado',
                error: 'Erro'
              }[connectionStatus.status]
            }
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
