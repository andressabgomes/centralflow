import { useState, useEffect } from 'react';
import { X, Save, Loader2, FileText, User, AlertTriangle, Tag, UserCheck } from 'lucide-react';
import Card from './Card';

interface Customer {
  id: number;
  name: string;
  email?: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  customer_id?: number;
  assigned_to?: number;
  channel: string;
  created_at: string;
  updated_at: string;
}

interface TicketFormProps {
  ticket?: Ticket | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customer_id: string;
  assigned_to: string;
  channel: 'manual' | 'whatsapp' | 'phone' | 'email';
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'pending', label: 'Pendente' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const CHANNEL_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
];

const CATEGORY_OPTIONS = [
  'Suporte Técnico',
  'Vendas',
  'Financeiro',
  'Reclamação',
  'Sugestão',
  'Informação',
  'Cancelamento',
  'Dúvidas',
  'Outro',
];

export default function TicketForm({ ticket, onSuccess, onCancel }: TicketFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    category: '',
    customer_id: '',
    assigned_to: '',
    channel: 'manual',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchInitialData();
    
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description || '',
        status: ticket.status as FormData['status'],
        priority: ticket.priority as FormData['priority'],
        category: ticket.category || '',
        customer_id: ticket.customer_id ? ticket.customer_id.toString() : '',
        assigned_to: ticket.assigned_to ? ticket.assigned_to.toString() : '',
        channel: ticket.channel as FormData['channel'],
      });
    }
  }, [ticket]);

  const fetchInitialData = async () => {
    try {
      const [customersResponse, teamResponse] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/team')
      ]);
      
      const customersResult = await customersResponse.json();
      const teamResult = await teamResponse.json();
      
      if (customersResult.success) {
        setCustomers(customersResult.data.filter((c: Customer) => c.name));
      }
      
      if (teamResult.success) {
        setTeamMembers(teamResult.data.filter((t: TeamMember) => t.is_active));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        category: formData.category || undefined,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        channel: formData.channel,
      };

      const url = ticket ? `/api/tickets/${ticket.id}` : '/api/tickets';
      const method = ticket ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Erro ao salvar ticket');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {ticket ? 'Editar Ticket' : 'Novo Ticket'}
            </h2>
            <button
              onClick={onCancel}
              className="icon-hover p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Título *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input w-full px-3 py-2"
                    placeholder="Descreva o problema ou solicitação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="input w-full px-3 py-2"
                    placeholder="Descreva os detalhes do problema ou solicitação..."
                  />
                </div>
              </div>
            </div>

            {/* Assignment and Priority */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Classificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="inline h-4 w-4 mr-1" />
                    Categoria
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canal
                  </label>
                  <select
                    name="channel"
                    value={formData.channel}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    {CHANNEL_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer and Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Atribuição</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Cliente
                  </label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.email && ` (${customer.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserCheck className="inline h-4 w-4 mr-1" />
                    Responsável
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    <option value="">Não atribuído</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{ticket ? 'Atualizar' : 'Criar Ticket'}</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
