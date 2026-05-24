import React from 'react';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message, user }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
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
