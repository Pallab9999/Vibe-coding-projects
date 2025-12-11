export enum EducationLevel {
  Preschool = "Preschool (Ages 3-5)",
  Elementary = "Elementary School (Ages 6-11)",
  Middle = "Middle School (Ages 12-14)",
  High = "High School (Ages 15-18)",
  Undergrad = "Undergraduate",
  Masters = "Masters/Expert"
}

export interface AnalysisResult {
  summary_title: string;
  explanation: string;
  real_world_analogy: string;
  image_generation_prompt: string;
  animation_prompt: string; // New field for video generation
  key_vocabulary: string[];
  interactive_question: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  mediaUrl?: string; // URL for generated image/video
  mediaType?: 'image' | 'video';
  isGeneratingMedia?: boolean;
}

export interface Session {
  id: string;
  timestamp: number;
  level: EducationLevel;
  inputText: string;
  inputImage: string | null;
  result: AnalysisResult;
  chatHistory: ChatMessage[];
  generatedImageUrl: string | null;
  generatedVideoUrl: string | null;
}

export interface AppState {
  sessions: Session[];
  currentSessionId: string | null;
  
  // Current UI State
  level: EducationLevel;
  inputText: string;
  inputImage: string | null; // Base64 string
  isAnalyzing: boolean;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean; // Main section video state
  error: string | null;
  isChatting: boolean;
}
