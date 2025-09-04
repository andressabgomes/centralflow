import { useState, useEffect } from 'react';
import { X, Save, Loader2, Phone, User, Clock, MessageSquare, Plus } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface PhoneCallLoggerProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  caller_phone: string;
  customer_id: string;
  call_duration: string;
  call_status: 'answered' | 'missed' | 'voicemail' | 'busy';
  notes: string;
  create_ticket: boolean;
  ticket_data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channel: 'phone';
  };
}

const CALL_STATUS_OPTIONS = [
  { value: 'answered', label: 'Atendida', color: 'text-green-600 bg-green-50' },
  { value: 'missed', label: 'Perdida', color: 'text-red-600 bg-red-50' },
  { value: 'voicemail', label: 'Caixa Postal', color: 'text-blue-600 bg-blue-50' },
  { value: 'busy', label: 'Ocupado', color: 'text-yellow-600 bg-yellow-50' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export default function PhoneCallLogger({ onClose, onSuccess }: PhoneCallLoggerProps) {
  const [formData, setFormData] = useState<FormData>({
    caller_phone: '',
    customer_id: '',
    call_duration: '',
    call_status: 'answered',
    notes: '',
    create_ticket: false,
    ticket_data: {
      title: '',
      description: '',
      priority: 'medium',
      channel: 'phone',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Auto-search customer by phone number
    if (formData.caller_phone.length >= 10) {
      const foundCustomer = customers.find(c => 
        c.phone && c.phone.replace(/\D/g, '').includes(formData.caller_phone.replace(/\D/g, ''))
      );
      if (foundCustomer && formData.customer_id !== foundCustomer.id.toString()) {
        setFormData(prev => ({ ...prev, customer_id: foundCustomer.id.toString() }));
      }
    }
  }, [formData.caller_phone, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.data.filter((c: Customer) => c.name));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        caller_phone: formData.caller_phone,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        call_duration: formData.call_duration ? parseInt(formData.call_duration) : undefined,
        call_status: formData.call_status,
        notes: formData.notes || undefined,
        create_ticket: formData.create_ticket,
        ticket_data: formData.create_ticket ? formData.ticket_data : undefined,
      };

      const response = await fetch('/api/phone-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Erro ao registrar ligação');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('ticket_data.')) {
      const ticketField = name.replace('ticket_data.', '');
      setFormData(prev => ({
        ...prev,
        ticket_data: {
          ...prev.ticket_data,
          [ticketField]: value,
        },
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, caller_phone: value }));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    (customer.phone && customer.phone.includes(phoneSearch)) ||
    (customer.email && customer.email.toLowerCase().includes(phoneSearch.toLowerCase()))
  );

  const selectedStatus = CALL_STATUS_OPTIONS.find(s => s.value === formData.call_status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Registrar Ligação
            </h2>
            <button
              onClick={onClose}
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
            {/* Call Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Ligação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Número do Telefone *
                  </label>
                  <input
                    type="text"
                    name="caller_phone"
                    value={formatPhone(formData.caller_phone)}
                    onChange={handlePhoneChange}
                    required
                    className="input w-full px-3 py-2"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status da Ligação *
                  </label>
                  <select
                    name="call_status"
                    value={formData.call_status}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    {CALL_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    {selectedStatus && (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${selectedStatus.color}`}>
                        {selectedStatus.label}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    name="call_duration"
                    value={formData.call_duration}
                    onChange={handleChange}
                    min="0"
                    className="input w-full px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Cliente
                  </label>
                  {loadingCustomers ? (
                    <div className="input w-full px-3 py-2 bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Carregando...
                    </div>
                  ) : (
                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      className="input w-full px-3 py-2"
                    >
                      <option value="">Cliente não identificado</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.phone && ` - ${customer.phone}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input w-full px-3 py-2"
                placeholder="Descreva o motivo da ligação, decisões tomadas, próximos passos..."
              />
            </div>

            {/* Create Ticket Option */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="create_ticket"
                  name="create_ticket"
                  checked={formData.create_ticket}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="create_ticket" className="flex items-center text-sm font-medium text-gray-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Criar ticket a partir desta ligação
                </label>
              </div>

              {formData.create_ticket && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                  <h4 className="font-medium text-gray-900">Dados do Ticket</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Ticket *
                    </label>
                    <input
                      type="text"
                      name="ticket_data.title"
                      value={formData.ticket_data.title}
                      onChange={handleChange}
                      required={formData.create_ticket}
                      className="input w-full px-3 py-2"
                      placeholder="Ex: Solicitação de suporte via telefone"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridade
                      </label>
                      <select
                        name="ticket_data.priority"
                        value={formData.ticket_data.priority}
                        onChange={handleChange}
                        className="input w-full px-3 py-2"
                      >
                        {PRIORITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Ticket
                    </label>
                    <textarea
                      name="ticket_data.description"
                      value={formData.ticket_data.description}
                      onChange={handleChange}
                      rows={2}
                      className="input w-full px-3 py-2"
                      placeholder="Detalhes da solicitação ou problema relatado..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                <span>Registrar Ligação</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
