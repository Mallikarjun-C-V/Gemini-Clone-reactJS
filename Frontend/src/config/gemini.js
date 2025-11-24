import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("❌ Missing GEMINI_API_KEY");
}

async function runChat(prompt, base64Image = null, mimeType = null) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const safetySettings = {
      [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    };

    const parts = [{ text: prompt }];

    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts }],
      safetySettings,
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    });

    return response.text;
  } catch (err) {
    console.error("Gemini Error:", err);
    return null;
  }
}

export default runChat;
