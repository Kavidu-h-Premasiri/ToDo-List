// src/pages/Messages/page.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { 
  Send, 
  Users, 
  Check, 
  MessageSquare,
  AlertCircle,
  Paperclip,
  File,
  Image,
  X,
  Download
} from 'lucide-react';
import { messageService } from '../../services/api';

// Use the same interface as api.ts
interface Chat {
  team_id: number;
  team_name: string;
  last_message: string;
  last_message_at: string;
  sender_name: string;
  unread_count: number;
}

interface ChatMessage {
  id: number;
  content: string;
  sender_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at?: string;
}

export const MessagesPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  // Format time in Sri Lanka timezone (UTC+5:30)
  const formatSriLankaTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Format time in Sri Lanka timezone
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Colombo'
    };
    
    // If today, show time only
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', options);
    }
    
    // If yesterday, show "Yesterday" with time
    if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', options)}`;
    }
    
    // If within 7 days, show day with time
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        timeZone: 'Asia/Colombo'
      }) + ' ' + date.toLocaleTimeString('en-US', options);
    }
    
    // Older messages show full date with time
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Colombo'
    }) + ' ' + date.toLocaleTimeString('en-US', options);
  };

  const formatTime = (dateString: string): string => {
    // Parse the date string
    const date = new Date(dateString);
    
    // If the date is invalid or not in Sri Lanka timezone, try to parse it differently
    if (isNaN(date.getTime())) {
      // Try parsing as Sri Lanka time (YYYY-MM-DD HH:MM:SS)
      const parts = dateString.split(/[- :]/);
      if (parts.length >= 6) {
        // Create date with Sri Lanka timezone offset
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const hours = parseInt(parts[3]);
        const minutes = parseInt(parts[4]);
        const seconds = parseInt(parts[5]);
        // Sri Lanka is UTC+5:30
        const sriLankaDate = new Date(Date.UTC(year, month, day, hours - 5, minutes - 30, seconds));
        return formatSriLankaTime(sriLankaDate);
      }
      return dateString;
    }
    
    return formatSriLankaTime(date);
  };

  // Scroll to bottom function
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chats
  const fetchChats = async (): Promise<void> => {
    try {
      const response = await messageService.getChats();
      setChats(response.chats || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a team
  const fetchMessages = async (teamId: number): Promise<void> => {
    try {
      const response = await messageService.getTeamMessages(teamId);
      const messagesData: ChatMessage[] = response.messages || [];
      setMessages(messagesData);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (teamId: number): Promise<void> => {
    try {
      await messageService.markMessagesAsRead(teamId);
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.team_id === teamId ? { ...chat, unread_count: 0 } : chat
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await fetchChats();
    };
    loadData();
    
    const interval = setInterval(() => {
      if (selectedTeamId) {
        fetchMessages(selectedTeamId);
      }
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedTeamId]);

  // Load messages when team is selected
  useEffect(() => {
    const loadMessages = async (): Promise<void> => {
      if (selectedTeamId) {
        await fetchMessages(selectedTeamId);
        await markMessagesAsRead(selectedTeamId);
      }
    };
    loadMessages();
  }, [selectedTeamId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain', 'application/zip'];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setError('File type not allowed');
      return;
    }

    setSelectedFile(file);
    
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

  const removeFile = (): void => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string): React.ReactElement => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
    if (fileType === 'application/pdf') return <File className="w-5 h-5 text-red-400" />;
    if (fileType.includes('word')) return <File className="w-5 h-5 text-blue-400" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <File className="w-5 h-5 text-green-400" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const isMessageFromCurrentUser = (message: ChatMessage): boolean => {
    return message.sender_id === currentUser.id;
  };

  const selectedTeam = chats.find(chat => chat.team_id === selectedTeamId);

  if (loading) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 blur-2xl animate-pulse"></div>
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">LOADING MESSAGES...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff11,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff11,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)]"></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      
      <Sidebar />
      <div className="lg:pl-72 relative z-10">
        <Navbar />
        
        <main className="h-[calc(100vh-4rem)] p-4">
          <div className="flex h-full gap-4">
            {/* Chat List */}
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 w-80 flex-shrink-0 overflow-hidden flex flex-col shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
              
              <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2 font-mono tracking-wider">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  MESSAGES
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-1 tracking-wider">TEAM CONVERSATIONS</p>
              </div>
              
              <div className="relative flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 font-mono tracking-wider">NO TEAM CHATS</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">JOIN OR CREATE A TEAM TO START CHATTING</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.team_id}
                      onClick={() => setSelectedTeamId(chat.team_id)}
                      className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-all duration-300 group ${
                        selectedTeamId === chat.team_id 
                          ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border-l-4 border-purple-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                              {chat.team_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold truncate font-mono tracking-wide ${selectedTeamId === chat.team_id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                {chat.team_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate font-mono">
                                {chat.last_message ? (
                                  <>
                                    <span className="text-purple-400 font-medium">{chat.sender_name}: </span>
                                    <span className="text-gray-400">{chat.last_message}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">NO MESSAGES YET</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTime(chat.last_message_at)}
                            </span>
                          )}
                          {chat.unread_count > 0 && (
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 flex-1 overflow-hidden flex flex-col shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
              
              {selectedTeamId ? (
                <>
                  {/* Chat Header */}
                  <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        {selectedTeam?.team_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white font-mono tracking-wide">{selectedTeam?.team_name}</h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {chats.find(c => c.team_id === selectedTeamId)?.unread_count || 0} UNREAD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-400" />
                        TEAM CHAT
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="relative flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mb-4 border border-white/10">
                          <MessageSquare className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-white font-mono tracking-wider">NO MESSAGES YET</p>
                        <p className="text-sm text-gray-400 font-mono mt-1">START THE CONVERSATION!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = isMessageFromCurrentUser(message);
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}
                          >
                            <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                                  : 'bg-white/5 border border-white/10 text-gray-200'
                              }`}>
                                {!isMine && message.sender && (
                                  <p className="text-xs font-bold text-purple-400 mb-1 font-mono">
                                    {message.sender.name}
                                  </p>
                                )}
                                
                                {/* Message Content */}
                                {message.content && (
                                  <p className="text-sm break-words font-mono">{message.content}</p>
                                )}
                                
                                {/* File Attachment */}
                                {message.file_url && (
                                  <div className="mt-2">
                                    {message.file_type.startsWith('image/') ? (
                                      <div className="relative group">
                                        <img 
                                          src={`http://localhost:8080${message.file_url}`}
                                          alt={message.file_name}
                                          className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition border border-white/10"
                                          onClick={() => window.open(`http://localhost:8080${message.file_url}`, '_blank')}
                                        />
                                        <a
                                          href={`http://localhost:8080${message.file_url}`}
                                          download={message.file_name}
                                          className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition text-white hover:scale-110"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-white/5">
                                        {getFileIcon(message.file_type)}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate text-gray-200">{message.file_name}</p>
                                          <p className="text-xs text-gray-400 font-mono">{formatFileSize(message.file_size)}</p>
                                        </div>
                                        <a
                                          href={`http://localhost:8080${message.file_url}`}
                                          download={message.file_name}
                                          className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 font-mono ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span>{formatTime(message.created_at)}</span>
                                {isMine && (
                                  <span className="text-purple-400">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isMine && message.sender && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xs order-0 mr-2 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
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
                  <div className="relative p-4 border-t border-white/10 bg-white/5">
                    {error && (
                      <div className="mb-2 p-2 bg-red-950/50 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm font-mono animate-shake">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        {error}
                      </div>
                    )}
                    
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="mb-2 p-2 bg-white/5 rounded-lg flex items-center gap-2 border border-white/10">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded border border-white/10" />
                        ) : (
                          getFileIcon(selectedFile.type)
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate font-mono">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          onClick={removeFile}
                          className="p-1 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-300 border border-white/10 hover:border-purple-500/30"
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
                        className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || sending}
                        className="p-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="relative flex-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <MessageSquare className="w-12 h-12 text-gray-500" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono tracking-wider">SELECT A TEAM</p>
                  <p className="text-sm text-gray-400 font-mono mt-1">CHOOSE A TEAM FROM THE LEFT TO START MESSAGING</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 10px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.5) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};