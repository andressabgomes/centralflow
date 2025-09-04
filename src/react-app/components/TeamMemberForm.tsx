import { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Mail, Phone, Shield, Building2 } from 'lucide-react';
import Card from './Card';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent';
  phone?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMemberFormProps {
  member?: TeamMember | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Agent';
  phone: string;
  department: string;
}

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Administrador', description: 'Acesso completo ao sistema' },
  { value: 'Manager', label: 'Gerente', description: 'Gerenciamento de equipes e relatórios' },
  { value: 'Agent', label: 'Agente', description: 'Atendimento e suporte aos clientes' },
];

const DEPARTMENT_OPTIONS = [
  'Administração',
  'Atendimento ao Cliente',
  'Comercial',
  'Financeiro',
  'Marketing',
  'Operações',
  'Recursos Humanos',
  'Suporte Técnico',
  'Vendas',
];

export default function TeamMemberForm({ member, onSuccess, onCancel }: TeamMemberFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'Agent',
    phone: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        phone: member.phone || '',
        department: member.department || '',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = member ? `/api/team/${member.id}` : '/api/team';
      const method = member ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Erro ao salvar membro da equipe');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-600 bg-red-50 border-red-200';
      case 'Manager': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Agent': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {member ? 'Editar Membro da Equipe' : 'Novo Membro da Equipe'}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input w-full px-3 py-2"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input w-full px-3 py-2"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Departamento
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input w-full px-3 py-2"
                  >
                    <option value="">Selecione um departamento</option>
                    {DEPARTMENT_OPTIONS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Função e Permissões</h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline h-4 w-4 mr-1" />
                  Função no Sistema *
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {ROLE_OPTIONS.map((roleOption) => (
                    <label
                      key={roleOption.value}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.role === roleOption.value
                          ? getRoleColor(roleOption.value)
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={roleOption.value}
                        checked={formData.role === roleOption.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            formData.role === roleOption.value
                              ? getRoleColor(roleOption.value)
                              : 'bg-gray-100'
                          }`}>
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{roleOption.label}</p>
                            <p className="text-sm text-gray-600">{roleOption.description}</p>
                          </div>
                        </div>
                      </div>
                      {formData.role === roleOption.value && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ml-3">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Permissions Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Permissões da Função Selecionada</h4>
              {formData.role === 'Admin' && (
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Acesso total ao sistema</li>
                  <li>• Gerenciamento de usuários e permissões</li>
                  <li>• Configurações do sistema</li>
                  <li>• Relatórios e analytics completos</li>
                </ul>
              )}
              {formData.role === 'Manager' && (
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Gerenciamento de equipes</li>
                  <li>• Visualização de relatórios</li>
                  <li>• Atribuição de tickets</li>
                  <li>• Monitoramento de performance</li>
                </ul>
              )}
              {formData.role === 'Agent' && (
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Atendimento de tickets</li>
                  <li>• Gestão de clientes</li>
                  <li>• Chat e comunicação</li>
                  <li>• Relatórios básicos</li>
                </ul>
              )}
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
                <span>{member ? 'Atualizar' : 'Criar Membro'}</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
