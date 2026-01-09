import { GoogleGenAI } from "@google/genai";

const AI_API_KEY = process.env.API_KEY || ''; 

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateLocationLore = async (lat: number, lng: number): Promise<string> => {
  if (!AI_API_KEY) return "天机不可泄露 (缺少 API Key)。";

  try {
    const ai = new GoogleGenAI({ apiKey: AI_API_KEY });
    // Updated prompt for Chinese output and specific tone
    const prompt = `我现在位于经纬度 ${lat}, ${lng}。
    请将这里想象成一个名为“行成”的平行世界中的神秘地点。
    请用【中文】写一段简短的（50字以内）、带有东方玄幻色彩的地点描述或历史回响。
    语气：古老、神秘、富有诗意。`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "迷雾遮蔽了真相...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "神识暂时无法到达此地。";
  }
};
