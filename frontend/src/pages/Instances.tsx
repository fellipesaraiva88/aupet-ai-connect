import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, QrCode, Power, PowerOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { createClient } from '@supabase/supabase-js';

interface Instance {
  id: string;
  user_id: string;
  name: string;
  instance_id: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected';
  webhook_url: string | null;
  qr_code: string | null;
  connection_state: string | null;
  phone_number: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
  last_seen_at: string | null;
}

const Instances: React.FC = () => {
  const { user } = useSupabase();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  const [newInstanceName, setNewInstanceName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  // Get auth token for API calls
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/instances', { headers });
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.data);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInstanceName.trim()) {
      alert('Por favor, insira um nome para a instância');
      return;
    }

    try {
      setCreating(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newInstanceName,
          webhookUrl: webhookUrl || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewInstanceName('');
        setWebhookUrl('');
        fetchInstances();
        
        // Auto-connect after creation
        setTimeout(() => {
          connectInstance(data.data.instance_id);
        }, 1000);
      } else {
        alert(`Erro: ${data.message || 'Falha ao criar instância'}`);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      alert('Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  const connectInstance = async (instanceId: string) => {
    try {
      setQrLoading(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/instances/${instanceId}/connect`, {
        method: 'POST',
        headers
      });

      const data = await response.json();
      
      if (data.success && data.data.qrCode) {
        const instance = instances.find(i => i.instance_id === instanceId);
        setSelectedInstance(instance || null);
        setQrCode(data.data.qrCode);
        setShowQRModal(true);
        
        // Start polling for connection status
        startStatusPolling(instanceId);
      }
    } catch (error) {
      console.error('Error connecting instance:', error);
      alert('Erro ao conectar instância');
    } finally {
      setQrLoading(false);
    }
  };

  const disconnectInstance = async (instanceId: string) => {
    if (!confirm('Deseja realmente desconectar esta instância?')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/instances/${instanceId}/disconnect`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        fetchInstances();
      }
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      alert('Erro ao desconectar instância');
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Deseja realmente deletar esta instância? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/instances/${instanceId}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        fetchInstances();
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
      alert('Erro ao deletar instância');
    }
  };

  const checkStatus = async (instanceId: string) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/instances/${instanceId}/status`, { headers });
      const data = await response.json();
      
      if (data.success) {
        fetchInstances();
        
        // If connected, close QR modal
        if (data.data.connectionState === 'open') {
          setShowQRModal(false);
          setQrCode(null);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const startStatusPolling = (instanceId: string) => {
    const interval = setInterval(async () => {
      await checkStatus(instanceId);
      
      // Stop polling if modal is closed
      if (!showQRModal) {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    // Clean up after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'created':
        return 'Criado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (user) {
      fetchInstances();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchInstances, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Por favor, faça login para gerenciar instâncias</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instâncias WhatsApp</h1>
          <p className="text-gray-600 mt-2">Gerencie suas conexões com WhatsApp Business</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchInstances}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Instância
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma instância encontrada</h3>
          <p className="text-gray-600 mb-6">Crie sua primeira instância para começar a usar o WhatsApp</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Instância
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div key={instance.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{instance.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{instance.instance_id}</p>
                </div>
                {getStatusIcon(instance.status)}
              </div>

              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instance.status)}`}>
                  {getStatusText(instance.status)}
                </span>
              </div>

              {instance.phone_number && (
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-medium">Telefone:</span> {instance.phone_number}
                </div>
              )}

              <div className="text-xs text-gray-500 mb-4">
                <div>Criado: {new Date(instance.created_at).toLocaleDateString('pt-BR')}</div>
                {instance.connected_at && (
                  <div>Conectado: {new Date(instance.connected_at).toLocaleDateString('pt-BR')}</div>
                )}
              </div>

              <div className="flex gap-2">
                {instance.status === 'connected' ? (
                  <button
                    onClick={() => disconnectInstance(instance.instance_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <PowerOff className="w-4 h-4" />
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={() => connectInstance(instance.instance_id)}
                    disabled={qrLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    Conectar
                  </button>
                )}
                
                <button
                  onClick={() => checkStatus(instance.instance_id)}
                  className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Verificar status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => deleteInstance(instance.instance_id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Deletar instância"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nova Instância WhatsApp</h2>
            
            <form onSubmit={createInstance}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Instância *
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Principal, Atendimento, Vendas"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL (opcional)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://sua-url.com/webhook"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Criando...' : 'Criar Instância'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedInstance.name}</h2>
            <p className="text-gray-600 mb-6">Escaneie o QR Code com seu WhatsApp</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              {qrCode ? (
                <div className="flex justify-center">
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="max-w-full h-auto"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Como conectar:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em "Mais opções" ou "Configurações"</li>
                <li>Toque em "Aparelhos conectados"</li>
                <li>Toque em "Conectar um aparelho"</li>
                <li>Aponte seu celular para esta tela para escanear o código</li>
              </ol>
            </div>

            <button
              onClick={() => {
                setShowQRModal(false);
                setQrCode(null);
                setSelectedInstance(null);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;
