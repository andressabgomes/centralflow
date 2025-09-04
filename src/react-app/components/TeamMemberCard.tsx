import { Edit2, Trash2, User, Mail, Phone, Shield, Building2, UserCheck, UserX } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';

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

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export default function TeamMemberCard({ member, onEdit, onDelete, onToggleStatus }: TeamMemberCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-600 bg-red-50';
      case 'Manager': return 'text-purple-600 bg-purple-50';
      case 'Agent': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Manager': return Building2;
      case 'Agent': return User;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(member.role);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'Manager': return 'Gerente';
      case 'Agent': return 'Agente';
      default: return role;
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {member.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {getRoleLabel(member.role)}
              </span>
            </div>
          </div>
        </div>
        
        <Chip variant={member.is_active ? 'success' : 'secondary'} size="sm" className="flex-shrink-0">
          {member.is_active ? 'Ativo' : 'Inativo'}
        </Chip>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        
        {member.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{member.phone}</span>
          </div>
        )}
        
        {member.department && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{member.department}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleStatus(member.id)}
            className="icon-hover flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            {member.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
            <span>{member.is_active ? 'Desativar' : 'Ativar'}</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(member)}
            className="icon-hover p-2 text-gray-400 hover:text-blue-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="icon-hover p-2 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
