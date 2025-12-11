import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, ChatMessage, EducationLevel } from '../types';
import { RefreshCw, Download, Share2, Lightbulb, MessageCircleQuestion, Tag, Film, Image as ImageIcon, Play, Layers } from 'lucide-react';
import { ChatSection } from './ChatSection';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ResultDisplayProps {
  result: AnalysisResult;
  currentLevel: EducationLevel;
  imageUrl: string | null;
  videoUrl: string | null;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  isAnalyzing: boolean;
  onReset: () => void;
  onLevelChange: (level: EducationLevel) => void;
  onGenerateVideo: () => void;
  // Chat props
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isChatting: boolean;
}

const LEVEL_LABELS: Record<EducationLevel, string> = {
    [EducationLevel.Preschool]: "Preschool",
    [EducationLevel.Elementary]: "Elementary",
    [EducationLevel.Middle]: "Middle School",
    [EducationLevel.High]: "High School",
    [EducationLevel.Undergrad]: "Undergrad",
    [EducationLevel.Masters]: "Master's/PhD",
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  currentLevel,
  imageUrl,
  videoUrl,
  isGeneratingImage,
  isGeneratingVideo, 
  isAnalyzing,
  onReset,
  onLevelChange,
  onGenerateVideo,
  chatHistory,
  onSendMessage,
  isChatting
}) => {
  const [activeMedia, setActiveMedia] = React.useState<'image' | 'video'>('image');
  const printRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    if (videoUrl) setActiveMedia('video');
  }, [videoUrl]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${result.summary_title.replace(/\s+/g, '_')}_ConceptLens.pdf`);
    } catch (e) {
        console.error("PDF generation failed", e);
        alert("Could not generate PDF.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-12 relative">
      
      {/* Loading Overlay for Re-analysis */}
      {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-indigo-100 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                  <h3 className="text-xl font-bold text-slate-800">Adapting Content...</h3>
                  <p className="text-slate-500 mt-2">Rewriting explanation for the selected level.</p>
              </div>
          </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex gap-4 items-center">
            <button 
              onClick={onReset}
              className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors self-start"
            >
              ← Analyze Another
            </button>
            <button 
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
                {isDownloading ? <div className="animate-spin h-4 w-4 border-2 border-indigo-600 rounded-full border-t-transparent"></div> : <Download size={20} />}
                <span className="hidden sm:inline">Download PDF</span>
            </button>
        </div>

        {/* Level Switcher */}
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
             {Object.values(EducationLevel).map((level) => (
                 <button
                    key={level}
                    onClick={() => onLevelChange(level)}
                    className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                        ${currentLevel === level 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}
                    `}
                 >
                     {LEVEL_LABELS[level]}
                 </button>
             ))}
        </div>
      </div>

      <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 p-1 bg-white/0">
        
        {/* Content Column */}
        <div className="space-y-8 order-2 lg:order-1">
            
            {/* Main Explanation */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 text-sm font-semibold uppercase tracking-wider">
                        <Layers size={14} />
                        <span>{LEVEL_LABELS[currentLevel]} Level Explanation</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{result.summary_title}</h1>
                    <div className="h-1 w-20 bg-indigo-500 rounded-full"></div>
                </div>
                
                <div className="prose prose-slate prose-lg max-w-none">
                    <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
            </div>

            {/* Analogy Box */}
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 relative">
                <div className="absolute -top-4 left-6 bg-white p-2 rounded-full shadow-sm border border-amber-100 text-amber-500">
                    <Lightbulb size={24} />
                </div>
                <h3 className="font-bold text-amber-900 mt-2 mb-2">Think of it like this:</h3>
                <p className="text-amber-800 leading-relaxed italic">
                    "{result.real_world_analogy}"
                </p>
            </div>

            {/* Vocabulary & Question */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600">
                        <Tag size={18} />
                        <h4 className="font-semibold">Key Vocabulary</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {result.key_vocabulary.map((word, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
                                {word}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-2xl shadow-sm border border-indigo-700 text-white">
                    <div className="flex items-center gap-2 mb-3 text-indigo-200">
                        <MessageCircleQuestion size={18} />
                        <h4 className="font-semibold">Quick Check</h4>
                    </div>
                    <p className="font-medium">
                        {result.interactive_question}
                    </p>
                </div>
            </div>
        </div>

        {/* Visual Column */}
        <div className="flex flex-col gap-6 order-1 lg:order-2">
          {/* Media Tabs */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit" data-html2canvas-ignore>
            <button 
                onClick={() => setActiveMedia('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeMedia === 'image' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <ImageIcon size={16} /> Image
            </button>
            <button 
                onClick={() => {
                    setActiveMedia('video');
                    if (!videoUrl && !isGeneratingVideo) onGenerateVideo();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeMedia === 'video' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Film size={16} /> Animation
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-1 shadow-xl overflow-hidden min-h-[400px] flex items-center justify-center relative group">
             {/* Loading State */}
             {(activeMedia === 'image' && isGeneratingImage) || (activeMedia === 'video' && isGeneratingVideo) ? (
               <div className="text-center p-8">
                 <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-400 border-t-white mb-4"></div>
                 <p className="text-indigo-200 font-medium animate-pulse">
                     {activeMedia === 'video' ? 'Generating animation (this may take 1-2 minutes)...' : 'Visualizing concept...'}
                 </p>
               </div>
             ) : (
                /* Content State */
                <>
                  {activeMedia === 'image' && imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt={result.summary_title} 
                      className="w-full h-auto object-cover rounded-xl shadow-inner"
                    />
                  )}

                  {activeMedia === 'video' && (
                    videoUrl ? (
                        <video controls autoPlay muted loop className="w-full h-auto rounded-xl bg-black">
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support video.
                        </video>
                    ) : (
                        <div className="text-center">
                            <button 
                                onClick={onGenerateVideo}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
                            >
                                <Play size={32} fill="white" />
                                <span className="text-sm font-medium">Generate Animation</span>
                            </button>
                            <p className="text-slate-400 text-sm mt-4 max-w-xs mx-auto">Create a short video explaining this concept.</p>
                        </div>
                    )
                  )}

                  {/* Fallback */}
                  {(activeMedia === 'image' && !imageUrl && !isGeneratingImage) && (
                     <div className="text-center text-indigo-300 p-8">
                        <RefreshCw className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>Visual generation failed.</p>
                     </div>
                  )}
                </>
             )}
          </div>

          {/* Prompt Context */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                {activeMedia === 'video' ? 'Animation Prompt' : 'Image Prompt'}
            </p>
            <p className="font-mono">"{activeMedia === 'video' ? result.animation_prompt : result.image_generation_prompt}"</p>
          </div>
        </div>

      </div>

      {/* Chat Section at the bottom */}
      <ChatSection 
        history={chatHistory}
        onSendMessage={onSendMessage}
        isChatting={isChatting}
      />
    </div>
  );
};