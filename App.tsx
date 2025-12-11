import React, { useState, useEffect } from 'react';
import { EducationLevel, AppState, ChatMessage, Session } from './types';
import { analyzeContent, generateEducationalImage, generateEducationalVideo, sendChatFollowUp } from './services/gemini';
import { LevelSelector } from './components/LevelSelector';
import { InputSection } from './components/InputSection';
import { ResultDisplay } from './components/ResultDisplay';
import { HistorySidebar } from './components/HistorySidebar';
import { Sparkles, BookOpenCheck, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    sessions: [],
    currentSessionId: null,
    level: EducationLevel.High,
    inputText: '',
    inputImage: null,
    isAnalyzing: false,
    isGeneratingImage: false,
    isGeneratingVideo: false,
    error: null,
    isChatting: false
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Derive current session data for UI
  const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
  
  // Helper to safely handle Video generation with Auth Check
  const generateVideoWithAuth = async (prompt: string): Promise<string> => {
     const aiStudio = (window as any).aistudio;
     
     // 1. Initial Key Check
     if (aiStudio) {
         if (!await aiStudio.hasSelectedApiKey()) {
             await aiStudio.openSelectKey();
         }
     }

     try {
         return await generateEducationalVideo(prompt);
     } catch (error: any) {
         // 2. Retry if key was invalid/expired (Specific to Veo)
         if (error.message && error.message.includes("Requested entity was not found") && aiStudio) {
             console.log("Re-requesting API Key...");
             await aiStudio.openSelectKey();
             return await generateEducationalVideo(prompt);
         }
         throw error;
     }
  };

  // Update state when switching sessions
  const handleSessionSelect = (id: string) => {
    setState(prev => ({
      ...prev,
      currentSessionId: id,
      // Restore UI state from session (optional, but good for UX)
      inputText: '', 
      inputImage: null,
      error: null,
      isAnalyzing: false,
      isGeneratingImage: false,
      isGeneratingVideo: false,
    }));
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => {
        const newSessions = prev.sessions.filter(s => s.id !== id);
        return {
            ...prev,
            sessions: newSessions,
            currentSessionId: prev.currentSessionId === id ? null : prev.currentSessionId
        };
    });
  };

  const handleLevelSelect = (level: EducationLevel) => {
    setState(prev => ({ ...prev, level }));
  };

  // Re-analyze the current content with a new level
  const handleLevelChange = async (newLevel: EducationLevel) => {
    if (!currentSession || state.isAnalyzing) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Re-analyze content
      const analysisResult = await analyzeContent(currentSession.inputText, currentSession.inputImage, newLevel);
      
      // Update the session in place
      const updatedSession: Session = {
        ...currentSession,
        level: newLevel,
        result: analysisResult,
        timestamp: Date.now(),
        // Reset generated media and chat as they are specific to the previous level
        generatedImageUrl: null,
        generatedVideoUrl: null,
        chatHistory: [] 
      };

      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        sessions: prev.sessions.map(s => s.id === currentSession.id ? updatedSession : s),
        level: newLevel, // Update global level state
        isGeneratingImage: true 
      }));

      // Trigger new image generation
      try {
        const imageUrl = await generateEducationalImage(analysisResult.image_generation_prompt);
        setState(prev => ({
            ...prev,
            isGeneratingImage: false,
            sessions: prev.sessions.map(s => s.id === currentSession.id ? { ...s, generatedImageUrl: imageUrl } : s)
        }));
      } catch (imgError) {
        console.error("Image generation failed", imgError);
        setState(prev => ({ ...prev, isGeneratingImage: false }));
      }

    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        isGeneratingImage: false,
        error: "Failed to update level. Please try again." 
      }));
    }
  };

  const handleAnalyze = async (text: string, image: string | null) => {
    setState(prev => ({ 
      ...prev, 
      inputText: text, 
      inputImage: image, 
      isAnalyzing: true, 
      error: null,
    }));

    try {
      // Step 1: Text Analysis
      const analysisResult = await analyzeContent(text, image, state.level);
      
      const newSession: Session = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          level: state.level,
          inputText: text,
          inputImage: image,
          result: analysisResult,
          chatHistory: [],
          generatedImageUrl: null,
          generatedVideoUrl: null
      };

      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        sessions: [...prev.sessions, newSession],
        currentSessionId: newSession.id,
        isGeneratingImage: true 
      }));

      // Step 2: Image Generation
      try {
        const imageUrl = await generateEducationalImage(analysisResult.image_generation_prompt);
        setState(prev => ({
            ...prev,
            isGeneratingImage: false,
            sessions: prev.sessions.map(s => s.id === newSession.id ? { ...s, generatedImageUrl: imageUrl } : s)
        }));
      } catch (imgError) {
        console.error("Image generation failed", imgError);
        setState(prev => ({ ...prev, isGeneratingImage: false }));
      }

    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        isGeneratingImage: false,
        error: "Something went wrong. Please ensure your API key is set and try again." 
      }));
    }
  };

  const handleGenerateVideo = async () => {
      if (!currentSession) return;
      
      setState(prev => ({ ...prev, isGeneratingVideo: true }));
      try {
        const videoUrl = await generateVideoWithAuth(currentSession.result.animation_prompt);
        setState(prev => ({
            ...prev,
            isGeneratingVideo: false,
            sessions: prev.sessions.map(s => s.id === currentSession.id ? { ...s, generatedVideoUrl: videoUrl } : s)
        }));
      } catch (err) {
          console.error("Video failed", err);
          setState(prev => ({ 
              ...prev, 
              isGeneratingVideo: false,
              error: "Failed to generate video. Please make sure you selected a valid paid API key."
          }));
      }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentSession) return;

    const userMsg: ChatMessage = { role: 'user', text: message };
    
    // Optimistic update of chat history
    const updateSessionChat = (updater: (history: ChatMessage[]) => ChatMessage[]) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => 
                s.id === prev.currentSessionId ? { ...s, chatHistory: updater(s.chatHistory) } : s
            )
        }));
    };

    updateSessionChat(history => [...history, userMsg]);
    setState(prev => ({ ...prev, isChatting: true }));

    try {
      const responseText = await sendChatFollowUp(
        [...currentSession.chatHistory, userMsg],
        message,
        state.level,
        currentSession.result
      );

      // Check for Media Tags in response
      // Tags: [GENERATE_IMAGE: prompt] or [GENERATE_VIDEO: prompt]
      const imgTagRegex = /\[GENERATE_IMAGE:\s*(.*?)\]/;
      const vidTagRegex = /\[GENERATE_VIDEO:\s*(.*?)\]/;

      let cleanText = responseText;
      let mediaPrompt = null;
      let mediaType: 'image' | 'video' | undefined = undefined;

      const imgMatch = responseText.match(imgTagRegex);
      const vidMatch = responseText.match(vidTagRegex);

      if (imgMatch) {
          mediaPrompt = imgMatch[1];
          mediaType = 'image';
          cleanText = cleanText.replace(imgMatch[0], '').trim();
      } else if (vidMatch) {
          mediaPrompt = vidMatch[1];
          mediaType = 'video';
          cleanText = cleanText.replace(vidMatch[0], '').trim();
      }

      const modelMsg: ChatMessage = { 
          role: 'model', 
          text: cleanText,
          isGeneratingMedia: !!mediaPrompt,
          mediaType: mediaType
      };

      updateSessionChat(history => [...history, modelMsg]);
      setState(prev => ({ ...prev, isChatting: false }));

      // Handle Async Media Generation for Chat
      if (mediaPrompt && mediaType) {
          try {
              let mediaUrl;
              if (mediaType === 'image') {
                  mediaUrl = await generateEducationalImage(mediaPrompt);
              } else {
                  // Use safe video generation with Auth check
                  mediaUrl = await generateVideoWithAuth(mediaPrompt);
              }
              
              // Update the last message with the media URL
              updateSessionChat(history => {
                  const newHistory = [...history];
                  const lastMsg = newHistory[newHistory.length - 1];
                  if (lastMsg.role === 'model') {
                      lastMsg.mediaUrl = mediaUrl;
                      lastMsg.isGeneratingMedia = false;
                  }
                  return newHistory;
              });

          } catch (mediaErr) {
              console.error("Chat media gen failed", mediaErr);
              updateSessionChat(history => {
                  const newHistory = [...history];
                  const lastMsg = newHistory[newHistory.length - 1];
                  if (lastMsg.role === 'model') {
                      lastMsg.text += "\n\n(Sorry, I couldn't generate the visualization at this time. Please check your API key settings.)";
                      lastMsg.isGeneratingMedia = false;
                  }
                  return newHistory;
              });
          }
      }

    } catch (error) {
      console.error("Chat failed", error);
      setState(prev => ({
        ...prev,
        isChatting: false,
        error: "Failed to get a response. Please try again."
      }));
    }
  };

  const handleNewSession = () => {
    setState(prev => ({
      ...prev,
      currentSessionId: null,
      result: null, // clear result to show input
      generatedImageUrl: null,
      generatedVideoUrl: null,
      error: null,
      inputText: '',
      inputImage: null,
    }));
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar (Desktop) */}
      <div className="hidden lg:block h-full shadow-xl z-20">
         <HistorySidebar 
            sessions={state.sessions} 
            currentSessionId={state.currentSessionId} 
            onSelectSession={handleSessionSelect}
            onDeleteSession={handleDeleteSession}
            onNewSession={handleNewSession}
         />
      </div>

      {/* Sidebar (Mobile) */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-white z-50 animate-fade-in-right">
                <div className="p-4 flex justify-between items-center border-b border-slate-100">
                    <span className="font-bold text-lg text-slate-700">Explorations</span>
                    <button onClick={() => setIsSidebarOpen(false)}><X /></button>
                </div>
                <HistorySidebar 
                    sessions={state.sessions} 
                    currentSessionId={state.currentSessionId} 
                    onSelectSession={handleSessionSelect}
                    onDeleteSession={handleDeleteSession}
                    onNewSession={handleNewSession}
                />
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Navbar */}
          <header className="bg-white border-b border-slate-200 flex-shrink-0 z-10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                    <Menu />
                </button>
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <BookOpenCheck size={20} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  ConceptLens
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                 <span className="hidden md:inline">Powered by Gemini 2.5</span>
                 <Sparkles className="text-amber-400 fill-amber-400" size={16} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                {state.error && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     {state.error}
                  </div>
                )}

                {!currentSession ? (
                  /* Landing / Input State */
                  <div className="flex flex-col items-center animate-fade-in-up mt-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Learn any concept,<br />
                        <span className="text-indigo-600">visualized for you.</span>
                      </h1>
                      <p className="text-lg text-slate-600 leading-relaxed">
                        Upload a textbook page, historical record, or physics problem. 
                        We'll explain it simply and generate animations to help you understand.
                      </p>
                    </div>

                    <div className="w-full max-w-5xl bg-white/50 backdrop-blur-sm rounded-3xl p-1 md:p-8 shadow-sm border border-slate-200/60">
                      <LevelSelector selectedLevel={state.level} onSelect={handleLevelSelect} />
                      
                      <div className="mt-8 border-t border-slate-200 pt-8">
                        <InputSection onAnalyze={handleAnalyze} isProcessing={state.isAnalyzing} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Result State */
                  <ResultDisplay 
                    result={currentSession.result} 
                    currentLevel={currentSession.level}
                    imageUrl={currentSession.generatedImageUrl} 
                    videoUrl={currentSession.generatedVideoUrl}
                    isGeneratingImage={state.isGeneratingImage}
                    isGeneratingVideo={state.isGeneratingVideo}
                    isAnalyzing={state.isAnalyzing}
                    onReset={handleNewSession}
                    onLevelChange={handleLevelChange}
                    onGenerateVideo={handleGenerateVideo}
                    chatHistory={currentSession.chatHistory}
                    onSendMessage={handleSendMessage}
                    isChatting={state.isChatting}
                  />
                )}
            </div>
          </main>
      </div>
    </div>
  );
};

export default App;
