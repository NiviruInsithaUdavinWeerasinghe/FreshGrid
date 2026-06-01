import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, History, Plus, Clock, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useAuth } from '../context/AuthContext';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import { useLocation } from 'react-router-dom';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    chatSessions, 
    fetchSessions, 
    loadSession, 
    startNewChat,
    stopGeneration,
    editSessionTitle,
    deleteSession
  } = useAiAssistant();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showHistory) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, showHistory]);

  useEffect(() => {
    const handleCloseChat = () => setIsOpen(false);
    window.addEventListener('ai_close_chat', handleCloseChat);
    return () => window.removeEventListener('ai_close_chat', handleCloseChat);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleToggleHistory = () => {
    if (!showHistory) fetchSessions();
    setShowHistory(!showHistory);
  };

  const handleNewChat = () => {
    startNewChat();
    setShowHistory(false);
  };

  const handleLoadSession = (sessionId) => {
    loadSession(sessionId);
    setShowHistory(false);
  };

  const handleSaveTitle = (sessionId) => {
    if (!editingTitleText.trim()) return;
    editSessionTitle(sessionId, editingTitleText.trim());
    setEditingSessionId(null);
  };

  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/auth/callback'].includes(location.pathname);

  if (isAuthPage || location.pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] sm:w-[400px] md:w-[450px] h-[500px] max-h-[80vh] flex flex-col bg-[#f0f0f3] dark:bg-[#1e1e1e] border-[3px] border-emerald-400/50 dark:border-emerald-500/60 rounded-3xl shadow-xl overflow-hidden transform-gpu"
          >
            {/* Header */}
            <div className="p-4 bg-[#f0f0f3] dark:bg-[#121212] shadow-[inset_4px_4px_8px_#cbcecf,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#070707,inset_-4px_-4px_8px_#1d1d1d] flex justify-between items-center z-10">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <MessageSquare size={20} />
                <span className="font-bold text-sm text-emerald-800 dark:text-emerald-400 tracking-wide">Druid</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleNewChat}
                  title="New Chat"
                  className="p-1.5 rounded-full bg-[#f0f0f3] dark:bg-[#121212] shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d] active:shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:active:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d] text-emerald-600/70 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={handleToggleHistory}
                  title="Chat History"
                  className={`p-1.5 rounded-full bg-[#f0f0f3] dark:bg-[#121212] shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d] active:shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:active:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d] transition-all ${showHistory ? 'text-emerald-600 dark:text-emerald-400 shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d]' : 'text-emerald-600/70 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-white'}`}
                >
                  <History size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full bg-[#f0f0f3] dark:bg-[#121212] shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d] active:shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:active:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d] text-emerald-600/70 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-white transition-all ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar relative">
              
              <AnimatePresence mode="wait">
                {showHistory ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col gap-2 h-full"
                  >
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Past Conversations</h3>
                    {chatSessions.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                        No previous chats found.
                      </div>
                    ) : (
                      chatSessions.map((session) => {
                        const isEditing = editingSessionId === session.sessionId;
                        return (
                          <div
                            key={session.sessionId}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 w-full">
                                  <input
                                    type="text"
                                    value={editingTitleText}
                                    onChange={(e) => setEditingTitleText(e.target.value)}
                                    className="flex-1 bg-white dark:bg-[#121212] border border-emerald-400 dark:border-emerald-500 rounded px-2 py-0.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveTitle(session.sessionId);
                                      } else if (e.key === 'Escape') {
                                        setEditingSessionId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveTitle(session.sessionId)}
                                    className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
                                    title="Save"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => setEditingSessionId(null)}
                                    className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 rounded"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => handleLoadSession(session.sessionId)}
                                  className="cursor-pointer"
                                >
                                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    "{session.title}"
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Clock size={10} />
                                    {new Date(session.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session.sessionId);
                                    setEditingTitleText(session.title || '');
                                  }}
                                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                                  title="Edit Title"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this chat session?')) {
                                      deleteSession(session.sessionId);
                                    }
                                  }}
                                  className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                  title="Delete Chat"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center px-4 mt-20">
                        <MessageSquare size={40} className="mb-4 text-emerald-600/20 dark:text-emerald-900/50" />
                        <h3 className="font-bold text-xl text-emerald-800 dark:text-emerald-400 mb-2">Hey there! 👋</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">I'm <span className="font-bold text-emerald-600 dark:text-emerald-400">Druid</span>, your personal FreshGrid guru! Ready to hunt for the crispest apples or need a hand checking out? Let's find something delicious today! 🌱</p>
                      </div>
                    )}
                    
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} user={user} />
                    ))}
                    
                    {isTyping && (
                      <div className="flex flex-col items-start gap-2">
                        <TypingIndicator />
                        <button 
                          onClick={stopGeneration} 
                          className="ml-12 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <X size={12}/> Stop Generating
                        </button>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#f0f0f3] dark:bg-[#121212] shadow-[inset_4px_4px_8px_#cbcecf,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#070707,inset_-4px_-4px_8px_#1d1d1d] z-10">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={showHistory}
                  className="w-full bg-[#f0f0f3] dark:bg-[#121212] shadow-[inset_2px_2px_5px_#cbcecf,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_2px_2px_5px_#070707,inset_-2px_-2px_5px_#1d1d1d] text-gray-900 dark:text-white text-sm rounded-full pl-4 pr-10 py-2.5 focus:outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping || showHistory}
                  className="absolute right-1.5 p-2 bg-[#f0f0f3] dark:bg-[#121212] shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d] active:shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:active:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d] text-emerald-600 dark:text-emerald-400 rounded-full disabled:opacity-50 transition-all"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(5,150,105,0.4)] focus:outline-none hover:bg-emerald-500 transition-colors relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default ChatWidget;
