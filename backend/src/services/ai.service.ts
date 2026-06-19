import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// OpenAI istemcisi
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

// Gemini istemcisi
const googleGenAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) 
  : null;

export class AIService {
  /**
   * Seçilen modele göre akışlı (streaming) yanıt üretir.
   */
  static async generateStream(
    provider: "openai" | "claude" | "gemini" | "ollama",
    model: string,
    messages: { role: string; content: string }[],
    onChunk: (text: string) => void
  ): Promise<string> {
    let fullText = "";

    try {
      if (provider === "openai") {
        const responseStream = await openai.chat.completions.create({
          model: model || "gpt-4o",
          messages: messages as any,
          stream: true,
        });

        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }
      } 
      else if (provider === "gemini") {
        if (!googleGenAI) {
          throw new Error("GEMINI_API_KEY ayarlanmamış.");
        }
        // Gemini modeli başlat (Varsayılan gemini-1.5-pro veya gemini-1.5-flash)
        const geminiModel = googleGenAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });
        
        // Rolleri Gemini formatına eşle (user -> user, assistant -> model)
        const contents = messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const result = await geminiModel.generateContentStream({ contents });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }
      } 
      else if (provider === "ollama") {
        // Yerel Ollama API'si
        const baseUri = process.env.OLLAMA_API_BASE || "http://localhost:11434";
        const response = await fetch(`${baseUri}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || "llama3",
            messages: messages,
            stream: true,
          }),
        });

        if (!response.body) throw new Error("Ollama yanıt gövdesi boş.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value);
          const lines = chunkStr.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              const text = parsed.message?.content || "";
              if (text) {
                fullText += text;
                onChunk(text);
              }
            } catch (err) {
              // Eksik JSON satırı durumunda yoksay
            }
          }
        }
      } 
      else if (provider === "claude") {
        // Mock Claude entegrasyonu (Canlı Claude SDK yerine OpenAI uyumlu API veya mock)
        // Gerçek implementasyonda @anthropic-ai/sdk kullanılır.
        // Basitlik ve monorepo boyutu için OpenAI uyumlu proxy veya mock dönüyoruz.
        const mockChunks = [" [Claude Stream]: ", "Bu özellik ", "şu anda ", "simüle ediliyor. ", "Anthropic API anahtarınızı ", "girerek ", "aktifleştirebilirsiniz."];
        for (const chunk of mockChunks) {
          await new Promise(resolve => setTimeout(resolve, 100));
          fullText += chunk;
          onChunk(chunk);
        }
      }
    } catch (error: any) {
      console.error(`${provider} API Hatası:`, error);
      const errMessage = `\n[Hata]: ${error.message || "Model ile iletişim kurulurken bir hata oluştu."}`;
      fullText += errMessage;
      onChunk(errMessage);
    }

    return fullText;
  }

  /**
   * Semantik arama ve uzun süreli hafıza için OpenAI kullanarak vektör (Embedding) üretir.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding üretilemedi, varsayılan sıfır vektör dönülüyor:", error);
      // Hata durumunda 1536 boyutlu boş bir vektör döner
      return new Array(1536).fill(0);
    }
  }
}
