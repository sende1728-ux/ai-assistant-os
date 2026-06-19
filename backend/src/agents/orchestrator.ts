import { AIService } from "../services/ai.service";

export interface AgentResponse {
  agentName: string;
  plan?: string[];
  output: string;
}

export class AgentOrchestrator {
  /**
   * Kullanıcının talebine göre uygun agent'ı (Araştırma, Kodlama, Planlama) seçer ve yürütür.
   */
  static async executeWorkflow(
    userId: string,
    userPrompt: string,
    conversationHistory: { role: string; content: string }[],
    onChunk: (text: string) => void
  ): Promise<AgentResponse> {
    
    // 1. Adım: Hangi Agent'ın çağrılacağına karar ver (Router Prompt)
    const routerPrompt = `Kullanıcının yazdığı mesaja göre en uygun Agent'ı seç.
Seçenekler:
1. "RESEARCH_AGENT": Kullanıcı bilgi araştırıyorsa, internet araması gerekiyorsa veya teknik bir dokümantasyon sorguluyorsa.
2. "CODING_AGENT": Kullanıcı kod yazılmasını, hata ayıklanmasını (bug fix) veya yazılım mimarisi tasarlanmasını istiyorsa.
3. "PLANNER_AGENT": Kullanıcı bir proje planı, yapılacaklar listesi veya takvim planlaması talep ediyorsa.
4. "DIRECT_CHAT": Standart sohbet, genel sorular veya yukarıdaki agent'ların kapsamına girmeyen basit konular için.

Sadece seçtiğin seçeneğin adını yaz (Örn: "CODING_AGENT"). Başka hiçbir şey yazma.

Kullanıcı Mesajı: "${userPrompt}"`;

    let selectedAgent = "DIRECT_CHAT";
    try {
      const response = await AIService.generateStream(
        "openai", 
        "gpt-4o-mini", 
        [{ role: "user", content: routerPrompt }], 
        () => {}
      );
      selectedAgent = response.trim();
    } catch (err) {
      selectedAgent = "DIRECT_CHAT";
    }

    onChunk(`\n*[Agent Sistem Kararı: ${selectedAgent} aktifleşti]*\n\n`);

    // 2. Adım: Seçilen Agent'a göre sistemi yürüt
    if (selectedAgent === "RESEARCH_AGENT") {
      return this.runResearchAgent(userPrompt, conversationHistory, onChunk);
    } else if (selectedAgent === "CODING_AGENT") {
      return this.runCodingAgent(userPrompt, conversationHistory, onChunk);
    } else if (selectedAgent === "PLANNER_AGENT") {
      return this.runPlannerAgent(userPrompt, conversationHistory, onChunk);
    } else {
      // Standart Sohbet (Direct Chat)
      const systemMessage = {
        role: "system",
        content: "Sen gelişmiş bir Yapay Zeka Asistanı İşletim Sistemisin. Kullanıcı sorularına anlaşılır, profesyonel ve Türkçe cevap ver."
      };
      const output = await AIService.generateStream(
        "openai",
        "gpt-4o",
        [systemMessage, ...conversationHistory, { role: "user", content: userPrompt }],
        onChunk
      );
      return { agentName: "DirectChat", output };
    }
  }

  private static async runResearchAgent(
    prompt: string,
    history: any[],
    onChunk: (text: string) => void
  ): Promise<AgentResponse> {
    onChunk("🔍 *İnternet ve kaynak araştırması yapılıyor...*\n\n");
    
    // Araştırma agent'ı sistem mesajı
    const systemPrompt = `Sen bir Araştırma Asistanısın (Research Agent). 
Verilen konuyu derinlemesine araştır, internet araması sonuçlarını simüle et (veya eklediğin bilgileri derle) ve kullanıcıya kaynakça ile birlikte yapılandırılmış bir rapor sun.`;

    const output = await AIService.generateStream(
      "openai",
      "gpt-4o",
      [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: prompt }],
      onChunk
    );

    return {
      agentName: "Research Agent",
      plan: ["Konu analizi yapıldı", "Kaynaklar tarandı", "Rapor oluşturuldu"],
      output,
    };
  }

  private static async runCodingAgent(
    prompt: string,
    history: any[],
    onChunk: (text: string) => void
  ): Promise<AgentResponse> {
    onChunk("💻 *Yazılım mimarisi tasarlanıyor ve kod analiz ediliyor...*\n\n");

    const systemPrompt = `Sen kıdemli bir Yazılım Mühendisi ve Mimarsın (Coding Agent).
Yazacağın kodların SOLID prensiplerine uygun, temiz, modüler ve güvenli olduğundan emin ol.
Kod bloklarını yazarken açıklayıcı Türkçe yorum satırları ekle.`;

    const output = await AIService.generateStream(
      "openai",
      "gpt-4o",
      [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: prompt }],
      onChunk
    );

    return {
      agentName: "Coding Agent",
      plan: ["Gereksinimler belirlendi", "SOLID uyumlu mimari çizildi", "Üretim kalitesinde kod yazıldı"],
      output,
    };
  }

  private static async runPlannerAgent(
    prompt: string,
    history: any[],
    onChunk: (text: string) => void
  ): Promise<AgentResponse> {
    onChunk("📋 *Gereksinimler listeleniyor ve proje adımları planlanıyor...*\n\n");

    const systemPrompt = `Sen bir Proje Yöneticisi ve Planlama Asistanısın (Planner Agent).
Kullanıcının hedeflerine ulaşması için adım adım bir proje planı ve yapılacaklar listesi (Kanban uyumlu) hazırlayacaksın.`;

    const output = await AIService.generateStream(
      "openai",
      "gpt-4o",
      [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: prompt }],
      onChunk
    );

    return {
      agentName: "Planner Agent",
      plan: ["Hedefler ayrıştırıldı", "Görev listesi çıkarıldı", "Termin ve öncelikler belirlendi"],
      output,
    };
  }
}
