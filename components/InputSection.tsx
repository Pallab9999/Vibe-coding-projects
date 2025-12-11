import React, { useCallback, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string, image: string | null) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSubmit = () => {
    if (!text && !image) return;
    onAnalyze(text, image);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Input Container */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe the topic or ask a question
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g., Explain the concept of Magnetism, or What happened during the Boston Tea Party?"
            className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-32 transition-all"
          />
        </div>

        {/* File Upload / Image Preview */}
        <div 
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center
            ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'}
            ${image ? 'border-solid border-indigo-200 bg-white' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {image ? (
            <div className="relative w-full max-w-md mx-auto">
              <img src={image} alt="Upload preview" className="rounded-lg shadow-md max-h-64 mx-auto object-contain" />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <p className="text-slate-600 font-medium">Drag and drop your textbook page here</p>
              <p className="text-slate-400 text-sm mb-4">or click to browse</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-6 rounded-full transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Upload size={18} />
                Upload Image
              </label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={(!text && !image) || isProcessing}
            className={`
              flex items-center gap-2 py-3 px-8 rounded-full font-bold text-white transition-all shadow-lg
              ${(!text && !image) || isProcessing 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'}
            `}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <FileText size={20} />
                Explain It!
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};