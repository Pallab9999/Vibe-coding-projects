import { GoogleGenAI, Type } from "@google/genai";
import { EducationLevel, AnalysisResult, ChatMessage } from "../types";

// Helper to sanitize base64 if needed (removes data URL prefix)
const stripBase64Prefix = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (base64: string) => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const OMNI_TUTOR_PERSONA = `
    ROLE:
    You are the "Omni-Tutor," an advanced adaptive educational AI engine. Your purpose is to analyze content and explain it.

    CRITICAL INSTRUCTION:
    You must adapt your entire response—tone, vocabulary, depth, and analogies—to the specific "Target Audience Level" requested by the user.

    LEVEL DEFINITIONS (Strict Adherence Required):

    1. Level: Pre-School (Age 3-6)
       - Tone: Magical, exciting, warm, story-like.
       - Content: No jargon. Use "Magic," "Friends," and simple cause-and-effect.
       - Analogy: Playground, toys, animals, or food.
       - Visual Style: colorful cartoon, flat vector, simple shapes.

    2. Level: Elementary/Middle School (Age 7-13)
       - Tone: Encouraging, fun, relatable ("Cool Science Teacher").
       - Content: Basic terms introduced. Focus on the "What" and simple "Why."
       - Analogy: Video games, sports, movies, daily chores.
       - Visual Style: Comic book style, infographic with icons.

    3. Level: High School (Age 14-18)
       - Tone: Clear, academic but accessible.
       - Content: Standard textbook definitions, introduction of formulas/dates. Focus on passing exams.
       - Analogy: Real-world engineering, automotive, basic social dynamics.
       - Visual Style: Clean textbook diagram, labeled illustration.

    4. Level: Undergraduate (College)
       - Tone: Professional, objective, rigorous.
       - Content: Detailed mechanisms, mathematical derivation, historical nuance, conflicting theories.
       - Analogy: Complex systems, abstract logic models.
       - Visual Style: Technical schematic, blueprints, 3D render.

    5. Level: Master’s/PhD (Expert)
       - Tone: Peer-to-peer, critical, highly technical.
       - Content: Focus on methodology, limitations, epistemological context, and advanced theoretical frameworks.
       - Analogy: Rarely used unless cross-disciplinary (e.g., quantum mechanics mapped to fluid dynamics).
       - Visual Style: Data visualization, mathematical plot, abstract conceptual art.
`;

export const analyzeContent = async (
  text: string,
  imageBase64: string | null,
  level: EducationLevel
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptText = `
    ${OMNI_TUTOR_PERSONA}

    CURRENT TARGET LEVEL: ${level}

    Analyze the provided input.
    Strictly follow this JSON schema for the output:
    {
      "summary_title": "A catchy title appropriate for the level",
      "explanation": "The core explanation adapted to the level. Use Markdown formatting.",
      "real_world_analogy": "A specific analogy helping them understand the concept.",
      "image_generation_prompt": "A detailed prompt describing an image that would perfectly visualize this concept for this specific level.",
      "animation_prompt": "A detailed prompt describing a 5-second educational animation/video that would visualize this concept. Focus on movement and transformation.",
      "key_vocabulary": ["Word 1", "Word 2"], 
      "interactive_question": "A question to ask the user to check if they understood."
    }
  `;

  const parts: any[] = [{ text: promptText }];

  if (text) {
    parts.push({ text: `User Query/Context: ${text}` });
  }

  if (imageBase64) {
    parts.push({
      inlineData: {
        data: stripBase64Prefix(imageBase64),
        mimeType: getMimeType(imageBase64),
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary_title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            real_world_analogy: { type: Type.STRING },
            image_generation_prompt: { type: Type.STRING },
            animation_prompt: { type: Type.STRING },
            key_vocabulary: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            interactive_question: { type: Type.STRING }
          },
          required: ['summary_title', 'explanation', 'real_world_analogy', 'image_generation_prompt', 'animation_prompt', 'key_vocabulary', 'interactive_question'],
        }
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from Gemini");

    return JSON.parse(responseText) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing content:", error);
    throw new Error("Failed to analyze content. Please try again.");
  }
};

export const generateEducationalImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt }]
      },
      config: {}
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate visualization.");
  }
};

export const generateEducationalVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds as recommended
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    // Fetch the actual video bytes using the API key
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
    
  } catch (error: any) {
    console.error("Error generating video:", error);
    // Propagate the error message so the UI can handle the 'Requested entity was not found' case
    throw error;
  }
};

export const sendChatFollowUp = async (
  history: ChatMessage[],
  newMessage: string,
  level: EducationLevel,
  initialContext: AnalysisResult
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `
        ${OMNI_TUTOR_PERSONA}
        
        CURRENT TARGET LEVEL: ${level}

        CONTEXT:
        Topic: "${initialContext.summary_title}".
        Analogy: "${initialContext.real_world_analogy}".

        INSTRUCTION:
        Answer questions. 
        IMPORTANT: If the user explicitly asks for an image, picture, or illustration, start a new line in your response with exactly: [GENERATE_IMAGE: <detailed prompt here>].
        IMPORTANT: If the user explicitly asks for an animation, video, or movie, start a new line in your response with exactly: [GENERATE_VIDEO: <detailed prompt here>].
    `;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }))
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I couldn't generate a response.";
};
