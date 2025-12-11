import React from 'react';
import { Session } from '../types';
import { Clock, MessageSquare, ChevronRight, Trash2 } from 'lucide-react';

interface HistorySidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onNewSession: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onDeleteSession,
  onNewSession
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 flex-shrink-0">
      <div className="p-4 border-b border-slate-200">
        <button 
          onClick={onNewSession}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>+ New Concept</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2 mt-2">History</div>
        
        {sessions.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p>No concepts explored yet.</p>
          </div>
        ) : (
          sessions.slice().reverse().map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`
                group relative p-3 rounded-lg cursor-pointer transition-all border
                ${currentSessionId === session.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}
              `}
            >
              <h4 className={`font-medium text-sm mb-1 truncate pr-6 ${currentSessionId === session.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                {session.result.summary_title}
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={10} />
                  {session.chatHistory.length}
                </span>
              </div>
              
              <button 
                onClick={(e) => onDeleteSession(session.id, e)}
                className="absolute right-2 top-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
