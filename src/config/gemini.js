import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash"; 

const apiKey = ""; 

if (!apiKey) {
  throw new Error("❌ Missing GEMINI_API_KEY in environment variables.");
}

async function runChat(prompt) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const safetySettings = {
      [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: prompt }] },
      ],
      safetySettings,
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    });

    console.log(response.text ?? "⚠️ No response text");
    return response.text;
  } catch (err) {
    console.error("❌ Gemini API Error:", err);
    return null;
  }
}

export default runChat;
