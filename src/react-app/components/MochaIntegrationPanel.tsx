import { useState } from 'react';
import { Upload, Settings, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Card from './Card';

interface MochaIntegrationPanelProps {
  className?: string;
}

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
  details: Array<{
    id: number;
    name: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}

export default function MochaIntegrationPanel({ className = '' }: MochaIntegrationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkSync = async () => {
    if (!confirm('Deseja sincronizar todos os clientes ativos com a plataforma Mocha? Esta operação pode demorar alguns minutos.')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customers/bulk-sync-mocha', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setLastSyncResult(result.data);
      } else {
        setError(result.error || 'Erro na sincronização');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test with a sample customer sync
      const response = await fetch('/api/customers/1/sync-mocha', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        alert('Conexão com Mocha funcionando corretamente!');
      } else {
        setError(result.error || 'Erro na conexão');
      }
    } catch (err) {
      setError('Erro ao testar conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Integração Mocha</h3>
            <p className="text-sm text-gray-600">
              Sincronize seus clientes com a plataforma Mocha
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://getmocha.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro na integração</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {lastSyncResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">Última Sincronização</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 font-medium">{lastSyncResult.total}</p>
                    <p className="text-blue-700">Total</p>
                  </div>
                  <div>
                    <p className="text-green-600 font-medium">{lastSyncResult.synced}</p>
                    <p className="text-green-700">Sucessos</p>
                  </div>
                  <div>
                    <p className="text-red-600 font-medium">{lastSyncResult.errors}</p>
                    <p className="text-red-700">Erros</p>
                  </div>
                </div>
                
                {lastSyncResult.errors > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-700 cursor-pointer hover:text-blue-800">
                      Ver detalhes dos erros
                    </summary>
                    <div className="mt-2 space-y-1">
                      {lastSyncResult.details
                        .filter(detail => detail.status === 'error')
                        .map((detail, index) => (
                          <div key={index} className="text-xs bg-red-50 p-2 rounded border">
                            <p className="font-medium text-red-900">{detail.name}</p>
                            <p className="text-red-700">{detail.message}</p>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleBulkSync}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span>Sincronizar Todos os Clientes</span>
          </button>
          
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            <span>Testar Conexão</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
          <p className="font-medium mb-1">ℹ️ Como funciona:</p>
          <ul className="space-y-1">
            <li>• Os clientes são enviados para a API da Mocha via HTTPS</li>
            <li>• Dados são mapeados automaticamente para o formato Mocha</li>
            <li>• Histórico de sincronização é registrado nas observações</li>
            <li>• Configure a chave MOCHA_API_KEY nas variáveis de ambiente</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
