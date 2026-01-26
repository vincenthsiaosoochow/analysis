
import { GoogleGenAI, Type } from "@google/genai";
import { ArtworkAnalysis } from "../types";

export async function analyzeArtwork(base64Image: string): Promise<ArtworkAnalysis> {
  // Always use process.env.API_KEY directly in the named parameter object
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是拥有20年艺术史研究+10年艺术品投资顾问经验的专家，现对用户上传的画作进行专业、结构化、可落地的分析。
你的回复必须严格遵循提供的JSON架构。所有文本应使用流畅、专业的中文。
在分析时，请结合画面细节，避免空泛表述。`;

  const prompt = `分析这幅画作。输出需分三大模块：
### 模块1：核心艺术分析
必须覆盖风格流派、色彩运用、笔触肌理、构图布局、题材意境、艺术价值6个维度。

### 模块2：艺术家核心信息
识别艺术家并分析其基础信息、市场定位、代表作（含参考价）、风格演变。

### 模块3：资产配置/投资价值分析
提供投资评级（S/A/B/C/D）、行情趋势、收藏建议、风险提示、同类替代标的。

重要声明：本分析仅为客观参考，不构成任何投资建议。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          artist: { type: Type.STRING },
          artistGender: { type: Type.STRING, description: "男/女/未知" },
          style: { type: Type.STRING },
          period: { type: Type.STRING },
          origin: { type: Type.STRING },
          palette: { type: Type.ARRAY, items: { type: Type.STRING } },
          composition: { type: Type.STRING },
          interpretation: { type: Type.STRING },
          coreAnalysis: {
            type: Type.OBJECT,
            properties: {
              styleAndSchool: { type: Type.STRING },
              colorUsage: { type: Type.STRING },
              brushworkTexture: { type: Type.STRING },
              compositionLayout: { type: Type.STRING },
              themeAndMood: { type: Type.STRING },
              artisticValue: { type: Type.STRING },
            },
            required: ["styleAndSchool", "colorUsage", "brushworkTexture", "compositionLayout", "themeAndMood", "artisticValue"]
          },
          artistInfo: {
            type: Type.OBJECT,
            properties: {
              basics: { type: Type.STRING },
              marketPosition: { type: Type.STRING },
              representativeWorks: { type: Type.STRING },
              styleEvolution: { type: Type.STRING },
            },
            required: ["basics", "marketPosition", "representativeWorks", "styleEvolution"]
          },
          investmentAnalysis: {
            type: Type.OBJECT,
            properties: {
              rating: { type: Type.STRING, description: "S/A/B/C/D" },
              ratingReason: { type: Type.STRING },
              marketTrends: { type: Type.STRING },
              collectionAdvice: { type: Type.STRING },
              riskAlert: { type: Type.STRING },
              alternatives: { type: Type.STRING },
            },
            required: ["rating", "ratingReason", "marketTrends", "collectionAdvice", "riskAlert", "alternatives"]
          }
        },
        required: ["title", "artist", "artistGender", "style", "period", "origin", "palette", "composition", "interpretation", "coreAnalysis", "artistInfo", "investmentAnalysis"],
      },
    },
  });

  // Access text directly as a property (not a method)
  const text = response.text || "{}";
  const result = JSON.parse(text);
  return {
    ...result,
    imageUrl: base64Image,
    likes: Math.floor(Math.random() * 500) + 10, // Mock likes for new analysis
  };
}
