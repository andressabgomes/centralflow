import { useState, useEffect } from 'react';
import { Search, Phone, User, Users, MessageSquare, MoreVertical, Download } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';

interface WhatsAppContact {
  id: string;
  name: string;
  pushname: string;
  number: string;
  isGroup: boolean;
  isMyContact: boolean;
  profilePicUrl?: string;
}

interface WhatsAppContactManagerProps {
  sessionId: string;
  onStartChat: (contactId: string, contactName: string) => void;
}

export default function WhatsAppContactManager({ sessionId, onStartChat }: WhatsAppContactManagerProps) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'contacts' | 'groups'>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContacts();
  }, [sessionId]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, filter]);

  const fetchContacts = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp/contacts?sessionId=${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setContacts(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Apply filter
    switch (filter) {
      case 'contacts':
        filtered = filtered.filter(c => !c.isGroup && c.isMyContact);
        break;
      case 'groups':
        filtered = filtered.filter(c => c.isGroup);
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.pushname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.number.includes(searchTerm)
      );
    }

    setFilteredContacts(filtered);
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const exportContacts = () => {
    const exportData = filteredContacts.map(contact => ({
      Nome: contact.name || contact.pushname,
      Número: contact.number,
      Tipo: contact.isGroup ? 'Grupo' : 'Contato',
      'Está nos Contatos': contact.isMyContact ? 'Sim' : 'Não'
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp_contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const phone = cleaned.slice(2);
      if (phone.length === 11) {
        return `+55 (${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
      }
    }
    return number;
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contatos WhatsApp</h3>
            <p className="text-sm text-gray-600">{filteredContacts.length} contatos encontrados</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportContacts}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
            
            <button
              onClick={fetchContacts}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === 'all'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({contacts.length})
            </button>
            <button
              onClick={() => setFilter('contacts')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === 'contacts'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Contatos ({contacts.filter(c => !c.isGroup && c.isMyContact).length})
            </button>
            <button
              onClick={() => setFilter('groups')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === 'groups'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Grupos ({contacts.filter(c => c.isGroup).length})
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum contato encontrado</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleContactSelection(contact.id)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  
                  <div className="flex-shrink-0">
                    {contact.profilePicUrl ? (
                      <img
                        src={contact.profilePicUrl}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        contact.isGroup ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        {contact.isGroup ? (
                          <Users className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name || contact.pushname || 'Nome não disponível'}
                      </p>
                      {contact.isGroup && (
                        <Chip variant="secondary" size="sm">Grupo</Chip>
                      )}
                      {contact.isMyContact && (
                        <Chip variant="success" size="sm">Contato</Chip>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{formatPhoneNumber(contact.number)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartChat(contact.id, contact.name || contact.pushname)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Iniciar conversa"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Actions */}
        {selectedContacts.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-sm text-green-700">
              {selectedContacts.size} contato(s) selecionado(s)
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedContacts(new Set())}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Desmarcar todos
              </button>
              
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Ações
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
