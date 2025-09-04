import { Edit2, Trash2, User, Clock, AlertTriangle, MessageCircle, Tag } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';

interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  customer_id?: number;
  assigned_to?: number;
  created_by?: number;
  channel: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  assigned_name?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: number) => void;
  onSelect?: (ticket: Ticket) => void;
}

export default function TicketCard({ ticket, onEdit, onDelete, onSelect }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 border-red-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '💬';
      case 'phone': return '📞';
      case 'email': return '📧';
      case 'manual': return '✏️';
      default: return '📝';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <Card className={`cursor-pointer hover:shadow-lg transition-all ${onSelect ? 'hover:border-blue-300' : ''}`} 
          onClick={() => onSelect?.(ticket)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">#{ticket.id}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{ticket.title}</h3>
              <span className="text-lg">{getChannelIcon(ticket.channel)}</span>
            </div>
            {ticket.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
            )}
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(ticket.created_at)}</span>
              </span>
              {ticket.customer_name && (
                <span className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{ticket.customer_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 ml-3">
          <AlertTriangle className={`h-4 w-4 ${getPriorityColor(ticket.priority)} flex-shrink-0`} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            {getStatusLabel(ticket.status)}
          </span>
          
          <Chip variant="secondary" size="sm">
            {getPriorityLabel(ticket.priority)}
          </Chip>
          
          {ticket.category && (
            <span className="flex items-center space-x-1 text-xs text-gray-500">
              <Tag className="h-3 w-3" />
              <span>{ticket.category}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ticket);
            }}
            className="icon-hover p-2 text-gray-400 hover:text-blue-600"
            title="Editar ticket"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ticket.id);
            }}
            className="icon-hover p-2 text-gray-400 hover:text-red-600"
            title="Remover ticket"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {ticket.assigned_name && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageCircle className="h-3 w-3" />
            <span>Atribuído para <strong>{ticket.assigned_name}</strong></span>
          </div>
        </div>
      )}
    </Card>
  );
}
