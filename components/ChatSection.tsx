import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { Send, User, Bot, Sparkles, Image as ImageIcon, Film } from 'lucide-react';

interface ChatSectionProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isChatting: boolean;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ history, onSendMessage, isChatting }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isChatting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatting) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[600px] mt-8">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <Sparkles className="text-indigo-600" size={20} />
        <h3 className="font-semibold text-slate-800">Deep Dive Chat</h3>
        <span className="text-xs text-slate-500 ml-auto bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">AI Can Generate Images & Videos</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {history.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>Ready to explore further? Try asking: "Can you show me a video of this?"</p>
          </div>
        )}
        
        {history.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                {msg.text && (
                  <div className={`
                    rounded-2xl p-4 shadow-sm w-fit
                    ${msg.role === 'user' 
                      ? 'bg-white text-slate-800 border border-slate-100 rounded-tr-none' 
                      : 'bg-indigo-600 text-white rounded-tl-none'}
                  `}>
                    <div className={`prose text-sm max-w-none ${msg.role === 'user' ? 'prose-slate' : 'prose-invert'}`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Loading State for Media */}
                {msg.isGeneratingMedia && (
                  <div className="bg-slate-100 rounded-xl p-3 flex items-center gap-3 animate-pulse border border-slate-200">
                    {msg.mediaType === 'video' ? <Film className="text-indigo-500" size={20}/> : <ImageIcon className="text-indigo-500" size={20}/>}
                    <span className="text-xs font-medium text-slate-500">
                      Generating {msg.mediaType === 'video' ? 'Animation (this takes a moment)' : 'Image'}...
                    </span>
                  </div>
                )}

                {/* Render Media */}
                {msg.mediaUrl && (
                  <div className="mt-1 overflow-hidden rounded-xl border border-slate-200 shadow-md max-w-sm">
                    {msg.mediaType === 'video' ? (
                      <video controls autoPlay muted loop className="w-full h-auto bg-black">
                        <source src={msg.mediaUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img src={msg.mediaUrl} alt="Generated content" className="w-full h-auto" />
                    )}
                  </div>
                )}
            </div>
          </div>
        ))}

        {isChatting && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
               <Bot size={16} />
             </div>
             <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-none p-4 shadow-sm">
               <div className="flex space-x-2 items-center h-5">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            disabled={isChatting}
          />
          <button
            type="submit"
            disabled={!input.trim() || isChatting}
            className={`
              p-3 rounded-xl text-white font-medium transition-all flex items-center gap-2
              ${!input.trim() || isChatting 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'}
            `}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};