import React from 'react';
import { Bot, User, RotateCcw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message, user, onRetry }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  if (isSystem) {
    if (message.isError) {
      return (
        <div className="flex flex-col gap-2.5 my-3 p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={15} />
              <span className="text-xs font-semibold">{message.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {onRetry && message.lastUserMessage && (
                <button
                  onClick={() => onRetry(message.lastUserMessage)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#f0f0f3] dark:bg-[#121212] shadow-[2px_2px_4px_#cbcecf,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_#070707,-2px_-2px_4px_#1d1d1d] active:shadow-[inset_1px_1px_2px_#cbcecf,inset_-1px_-1px_2px_#ffffff] text-emerald-650 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md transition-all"
                  title="Retry sending message"
                >
                  <RotateCcw size={11} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 italic bg-[#f0f0f3] dark:bg-[#121212] px-4 py-1.5 rounded-full shadow-[inset_2px_2px_4px_#cbcecf,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#070707,inset_-2px_-2px_4px_#1d1d1d]">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-[#f0f0f3] dark:bg-[#121212] ${
          isUser ? 'text-emerald-600' : 'text-emerald-500'
        } shadow-[3px_3px_6px_#cbcecf,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#070707,-3px_-3px_6px_#1d1d1d]`}>
          {isUser ? (
             user?.profilePicture ? <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" /> : <User size={16} />
          ) : <Bot size={16} />}
        </div>
        
        {/* Bubble */}
        <div className={`px-5 py-3 rounded-[24px] text-sm whitespace-pre-wrap bg-[#f0f0f3] dark:bg-[#121212] ${
          isUser 
            ? 'text-emerald-700 dark:text-emerald-400 rounded-br-none shadow-[inset_4px_4px_8px_#cbcecf,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#070707,inset_-4px_-4px_8px_#1d1d1d]'
            : 'text-gray-800 dark:text-gray-200 rounded-bl-none shadow-[5px_5px_10px_#cbcecf,-5px_-5px_10px_#ffffff] dark:shadow-[5px_5px_10px_#070707,-5px_-5px_10px_#1d1d1d]'
        }`}>
          {message.text}
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator = () => {
  return (
    <div className="flex w-full my-3 justify-start">
      <div className="flex max-w-[85%] flex-row items-end gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#f0f0f3] dark:bg-[#121212] text-emerald-500 shadow-[4px_4px_8px_#cbcecf,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#070707,-4px_-4px_8px_#1d1d1d]">
          <Bot size={16} />
        </div>
        <div className="px-5 py-4 rounded-[24px] bg-[#f0f0f3] dark:bg-[#121212] rounded-bl-none shadow-[5px_5px_10px_#cbcecf,-5px_-5px_10px_#ffffff] dark:shadow-[5px_5px_10px_#070707,-5px_-5px_10px_#1d1d1d] flex gap-1.5 items-center">
          <motion.div 
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
