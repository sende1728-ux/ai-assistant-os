import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Rotalar ve Servisler
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import workspaceRoutes from "./routes/workspace.routes";
import paymentRoutes from "./routes/payment.routes";
import { prisma } from "./services/prisma";
import { MemoryService } from "./services/memory.service";
import { AgentOrchestrator } from "./agents/orchestrator";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
// Stripe webhook ham veri (raw body) gerektirebilir, bu yüzden normal json body parser öncesi tanımlanabilir
app.use(express.json());

// API Rotaları
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/payments", paymentRoutes);

// Basit test rotası
app.get("/", (req, res) => {
  res.json({ status: "AI Assistant OS Backend is running smoothly." });
});

// ==========================================
// WEBSOCKET REALTIME STREAMING CHAT
// ==========================================

wss.on("connection", (ws: WebSocket, request, userId: string) => {
  console.log(`WebSocket Bağlantısı Başarılı: Kullanıcı ID - ${userId}`);

  ws.on("message", async (messageStr: string) => {
    try {
      const data = JSON.parse(messageStr);
      const { chatId, content, provider = "openai", model = "gpt-4o" } = data;

      if (!chatId || !content) {
        ws.send(JSON.stringify({ type: "error", message: "Eksik parametreler (chatId ve content zorunludur)." }));
        return;
      }

      // 1. Kullanıcı mesajını veri tabanına kaydet
      const userMessage = await prisma.message.create({
        data: {
          chatId,
          role: "user",
          content,
        },
      });

      // Kaydedilen kullanıcı mesajını hemen geri gönder
      ws.send(JSON.stringify({ type: "user_message", message: userMessage }));

      // 2. Önceki konuşma geçmişini çek
      const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 15,
      });

      const formattedHistory = pastMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 3. Uzun Süreli Hafızadan Semantik Arama yap (RAG)
      const relatedMemories = await MemoryService.searchMemories(userId, content, 3);
      
      let contextHistory = [...formattedHistory];
      if (relatedMemories.length > 0) {
        const memoryContext = `Hatırlanan Bilgiler:\n${relatedMemories.map(m => `- ${m}`).join("\n")}`;
        contextHistory.unshift({
          role: "system",
          content: `Kullanıcıyla ilgili daha önceki konuşmalardan hatırladığın bazı detaylar:\n${memoryContext}\nBu bilgileri gerekirse konuşma akışında doğal bir şekilde kullanabilirsin.`
        });
      }

      // 4. Agent Orkestratörü ile yanıtı üret ve akışla (streaming) gönder
      let assistantResponse = "";
      
      ws.send(JSON.stringify({ type: "stream_start" }));
      
      await AgentOrchestrator.executeWorkflow(
        userId,
        content,
        contextHistory,
        (chunk) => {
          assistantResponse += chunk;
          ws.send(JSON.stringify({ type: "chunk", text: chunk }));
        }
      );

      ws.send(JSON.stringify({ type: "stream_end" }));

      // 5. Asistanın yanıtını veri tabanına kaydet
      await prisma.message.create({
        data: {
          chatId,
          role: "assistant",
          content: assistantResponse,
        },
      });

      // 6. Asenkron olarak hafıza güncellenmesi (Sohbet özeti çıkarma)
      // Arka planda çalışır, websocket akışını bloke etmez
      if (formattedHistory.length % 5 === 0) {
        MemoryService.summarizeAndSaveMemory(userId, "Sohbet", [
          ...formattedHistory,
          { role: "user", content },
          { role: "assistant", content: assistantResponse }
        ]);
      }

    } catch (error: any) {
      console.error("WS Mesaj İşleme Hatası:", error);
      ws.send(JSON.stringify({ type: "error", message: error.message || "Beklenmeyen bir hata oluştu." }));
    }
  });

  ws.on("close", () => {
    console.log(`WebSocket Bağlantısı Kapatıldı: ${userId}`);
  });
});

// HTTP sunucusu WebSocket el sıkışmasını (handshake) yönetir
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_change_me_in_production";
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, decoded.userId);
    });
  } catch (error) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde hazır!`);
  console.log(`🔌 WebSocket servisi etkinleştirildi.`);
});
