import { prisma } from "./prisma";
import { AIService } from "./ai.service";
import crypto from "crypto";

export class MemoryService {
  /**
   * Kullanıcının hafızasına yeni bir bilgi (vektörleştirilmiş) ekler.
   */
  static async addMemory(userId: string, content: string): Promise<void> {
    try {
      const embedding = await AIService.generateEmbedding(content);
      const embeddingString = `[${embedding.join(",")}]`;
      const memoryId = crypto.randomUUID();

      // PgVector formatında veritabanına ham SQL ile ekleme yapıyoruz
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Memory" ("id", "userId", "content", "embedding") 
         VALUES ($1, $2, $3, $4::vector)`,
        memoryId,
        userId,
        content,
        embeddingString
      );
    } catch (error) {
      console.error("Hafıza kaydedilirken hata oluştu:", error);
    }
  }

  /**
   * Kullanıcının geçmiş hafızasındaki bilgileri semantik (vektörsel) olarak arar.
   */
  static async searchMemories(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const embedding = await AIService.generateEmbedding(query);
      const embeddingString = `[${embedding.join(",")}]`;

      // PgVector '<=>' (Kosinüs Uzaklığı) operatörü ile benzerlik araması yapıyoruz
      const results = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "content" 
         FROM "Memory" 
         WHERE "userId" = $1 
         ORDER BY "embedding" <=> $2::vector 
         LIMIT $3`,
        userId,
        embeddingString,
        limit
      );

      return results.map((r) => r.content);
    } catch (error) {
      console.error("Hafıza araması yapılırken hata oluştu:", error);
      return [];
    }
  }

  /**
   * Bir sohbetin özetini çıkarıp kullanıcının uzun süreli hafızasına ekler.
   */
  static async summarizeAndSaveMemory(userId: string, chatTitle: string, messages: { role: string; content: string }[]): Promise<void> {
    try {
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`)
        .join("\n");

      const prompt = `Aşağıdaki konuşmayı analiz et ve kullanıcının tercihleri, öğrenilen kişisel bilgiler, alışkanlıklar veya önemli detaylar hakkında hatırlanması gereken net ve kısa hafıza notları çıkar. 
Sadece doğrudan hatırlanması gereken cümleleri yaz (örn: "Kullanıcı TypeScript ve Next.js kullanmayı tercih ediyor.").
Konuşma başlığı: ${chatTitle}
Konuşma:
${conversationText}`;

      // OpenAI kullanarak özet çıkarma
      const summary = await AIService.generateStream("openai", "gpt-4o-mini", [
        { role: "system", content: "Sen kullanıcının hafızasını yöneten yardımcı bir servissin." },
        { role: "user", content: prompt }
      ], () => {});

      const memoryLines = summary
        .split("\n")
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line.length > 10);

      for (const line of memoryLines) {
        await this.addMemory(userId, line);
      }
    } catch (error) {
      console.error("Hafıza özeti kaydedilemedi:", error);
    }
  }
}
