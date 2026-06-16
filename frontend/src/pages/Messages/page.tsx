import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Send, 
  Users, 
  Clock, 
  Check, 
  CheckCheck,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Paperclip,
  File,
  Image,
  X,
  Download
} from 'lucide-react';
import { messageService, teamService } from '../../services/api';

interface Chat {
  team_id: number;
  team_name: string;
  last_message: string;
  last_message_at: string;
  sender_name: string;
  unread_count: number;
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

export const MessagesPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      if (selectedTeamId) {
        fetchMessages(selectedTeamId);
      }
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchMessages(selectedTeamId);
      markMessagesAsRead(selectedTeamId);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await messageService.getChats();
      setChats(response.chats || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (teamId: number) => {
    try {
      const response = await messageService.getTeamMessages(teamId);
      setMessages(response.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const markMessagesAsRead = async (teamId: number) => {
    try {
      await messageService.markMessagesAsRead(teamId);
      setChats(chats.map(chat => 
        chat.team_id === teamId ? { ...chat, unread_count: 0 } : chat
      ));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain', 'application/zip'];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setError('File type not allowed');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    setError('');
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedTeamId) return;

    setSending(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await messageService.sendMessage(selectedTeamId, formData);
      setNewMessage('');
      removeFile();
      await fetchMessages(selectedTeamId);
      await fetchChats();
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType === 'application/pdf') return <File className="w-5 h-5 text-red-500" />;
    if (fileType.includes('word')) return <File className="w-5 h-5 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <File className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const isMessageFromCurrentUser = (message: Message) => {
    return message.sender_id === currentUser.id;
  };

  const selectedTeam = chats.find(chat => chat.team_id === selectedTeamId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="h-[calc(100vh-4rem)] p-4">
          <div className="flex h-full gap-4">
            {/* Chat List */}
            <Card className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Messages
                </h2>
                <p className="text-xs text-gray-500 mt-1">Team conversations</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No team chats yet</p>
                    <p className="text-xs mt-1">Join or create a team to start chatting</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.team_id}
                      onClick={() => setSelectedTeamId(chat.team_id)}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-all ${
                        selectedTeamId === chat.team_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {chat.team_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{chat.team_name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {chat.last_message ? (
                                  <>
                                    <span className="font-medium">{chat.sender_name}: </span>
                                    {chat.last_message}
                                  </>
                                ) : (
                                  'No messages yet'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-400">
                              {formatTime(chat.last_message_at)}
                            </span>
                          )}
                          {chat.unread_count > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              {selectedTeamId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedTeam?.team_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{selectedTeam?.team_name}</h3>
                        <p className="text-xs text-gray-500">
                          {chats.find(c => c.team_id === selectedTeamId)?.unread_count || 0} unread
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Team Chat
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = isMessageFromCurrentUser(message);
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border border-gray-200 text-gray-800'
                              }`}>
                                {!isMine && (
                                  <p className="text-xs font-semibold text-blue-600 mb-1">
                                    {message.sender.name}
                                  </p>
                                )}
                                
                                {/* Message Content */}
                                {message.content && (
                                  <p className="text-sm break-words">{message.content}</p>
                                )}
                                
                                {/* File Attachment */}
                                {message.file_url && (
                                  <div className="mt-2">
                                    {message.file_type.startsWith('image/') ? (
                                      <div className="relative group">
                                        <img 
                                          src={`http://localhost:8080${message.file_url}`}
                                          alt={message.file_name}
                                          className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition"
                                          onClick={() => window.open(`http://localhost:8080${message.file_url}`, '_blank')}
                                        />
                                        <a
                                          href={`http://localhost:8080${message.file_url}`}
                                          download={message.file_name}
                                          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition text-white"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                                        {getFileIcon(message.file_type)}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{message.file_name}</p>
                                          <p className="text-xs text-gray-500">{formatFileSize(message.file_size)}</p>
                                        </div>
                                        <a
                                          href={`http://localhost:8080${message.file_url}`}
                                          download={message.file_name}
                                          className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                                        >
                                          <Download className="w-4 h-4 text-gray-600" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span>{formatTime(message.created_at)}</span>
                                {isMine && (
                                  <span className="text-blue-400">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isMine && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xs order-0 mr-2">
                                {message.sender.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {error && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                    
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          getFileIcon(selectedFile.type)
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          onClick={removeFile}
                          className="p-1 hover:bg-gray-200 rounded-lg transition"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        disabled={sending}
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message or attach a file..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        disabled={sending}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={(!newMessage.trim() && !selectedFile) || sending}
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-xl font-semibold text-gray-500">Select a team</p>
                  <p className="text-sm">Choose a team from the left to start messaging</p>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};