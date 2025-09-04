import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, UserCheck, UserX, Shield } from 'lucide-react';
import Card from '@/react-app/components/Card';
import TeamMemberForm from '@/react-app/components/TeamMemberForm';
import TeamMemberCard from '@/react-app/components/TeamMemberCard';

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

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Manager' | 'Agent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team');
      const result = await response.json();
      
      if (result.success) {
        setTeamMembers(result.data);
      } else {
        setError(result.error || 'Erro ao carregar membros da equipe');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Tem certeza de que deseja remover este membro da equipe?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setTeamMembers(prev => prev.filter(member => member.id !== id));
      } else {
        setError(result.error || 'Erro ao remover membro');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/team/${id}/toggle-status`, {
        method: 'PATCH',
      });
      const result = await response.json();

      if (result.success) {
        setTeamMembers(prev => 
          prev.map(member => 
            member.id === id ? result.data : member
          )
        );
      } else {
        setError(result.error || 'Erro ao alterar status');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMember(null);
    fetchTeamMembers();
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.is_active) ||
                         (statusFilter === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getTeamStats = () => {
    const total = teamMembers.length;
    const active = teamMembers.filter(m => m.is_active).length;
    const inactive = teamMembers.filter(m => !m.is_active).length;
    const admins = teamMembers.filter(m => m.role === 'Admin').length;
    const managers = teamMembers.filter(m => m.role === 'Manager').length;
    const agents = teamMembers.filter(m => m.role === 'Agent').length;

    return { total, active, inactive, admins, managers, agents };
  };

  const stats = getTeamStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestão de Equipe</h1>
          <p className="text-gray-600">Gerencie membros da equipe e suas permissões</p>
        </div>
        <button
          onClick={handleCreateMember}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Membro</span>
          <span className="sm:hidden">Membro</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <Card padding="sm">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-600">Ativos</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <UserX className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
            <p className="text-sm text-gray-600">Inativos</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
            <p className="text-sm text-gray-600">Admins</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.managers}</p>
            <p className="text-sm text-gray-600">Gerentes</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.agents}</p>
            <p className="text-sm text-gray-600">Agentes</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Funções</option>
              <option value="Admin">Administrador</option>
              <option value="Manager">Gerente</option>
              <option value="Agent">Agente</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && !loading && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Nenhum membro encontrado</p>
            <p className="text-gray-400 mb-6">
              {teamMembers.length === 0 
                ? 'Adicione o primeiro membro da equipe para começar'
                : 'Tente ajustar os filtros de pesquisa'
              }
            </p>
            {teamMembers.length === 0 && (
              <button
                onClick={handleCreateMember}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Adicionar Primeiro Membro
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Team Member Form Modal */}
      {showForm && (
        <TeamMemberForm
          member={editingMember}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
