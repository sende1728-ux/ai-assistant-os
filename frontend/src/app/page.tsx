"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Send, Sparkles, Database, ShieldAlert, Cpu, 
  Settings, FolderPlus, Plus, Terminal, LogOut, CheckCircle2,
  Paperclip, Mic, User, Zap, ArrowRight, KanbanSquare, FileText
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  folderId?: string | null;
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSession[]>([
    { id: "1", title: "SOLID Prensipleri Analizi" },
    { id: "2", title: "Next.js 15 Yapılandırması" },
    { id: "3", title: "Hafıza Arama & RAG Entegrasyonu" },
  ]);
  const [activeChatId, setActiveChatId] = useState("1");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: "m1", 
      role: "assistant", 
      content: "Merhaba! Ben Yapay Zeka Asistanı OS. SOLID prensipleri, temiz mimari tasarımı veya Next.js 15 projeleriniz için hazırım. Hangi konuda çalışmak istersiniz?", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "gemini" | "claude" | "ollama">("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  
  // Realtime Connection States
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Subscriptions & Profile
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock ve Canlı WebSocket Bağlantısı
  useEffect(() => {
    // Gerçek bağlantı için token araması (varsayılan mock token verilmiştir)
    const token = "mock-user-token";
    const wsUrl = `ws://localhost:5000?token=${token}`;
    
    const connectWS = () => {
      console.log("WebSocket bağlantısı kurulmaya çalışılıyor...");
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket bağlantısı kuruldu.");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chunk") {
          setIsStreaming(true);
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + data.text }
              ];
            } else {
              return [
                ...prev,
                { id: Math.random().toString(), role: "assistant", content: data.text, timestamp: new Date() }
              ];
            }
          });
        } else if (data.type === "stream_end") {
          setIsStreaming(false);
        } else if (data.type === "user_message") {
          // Kullanıcı mesajının db halini al
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Sunucu kapalıysa her 10 saniyede bir yeniden bağlanmayı dene
        setTimeout(connectWS, 10000);
      };
    };

    connectWS();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  // Mesaj Gönderme Tetikleyicisi
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsgText = input.trim();
    setInput("");

    // Kullanıcı mesajını arayüze ekle
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: userMsgText,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);

    // WebSocket aktifse mesajı gönder
    if (isConnected && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        chatId: activeChatId,
        content: userMsgText,
        provider: selectedProvider,
        model: selectedModel
      }));
    } else {
      // Mock Modu (Backend çalışmadığında çalışacak akıllı simülasyon)
      setIsStreaming(true);
      
      // Asistan yazıyor animasyonunu başlat
      setMessages((prev) => [...prev, {
        id: "stream-mock",
        role: "assistant",
        content: "⌛ *[Yerel Mod] İsteğiniz işleniyor...*\n\n",
        timestamp: new Date()
      }]);

      await new Promise(resolve => setTimeout(resolve, 800));

      const mockResponse = `Bu sohbet **Mock / Yerel Mod** üzerinde yanıtlanıyor (Express sunucusu algılanamadı). 
Talebiniz: *"${userMsgText}"* başarıyla alındı.

**Öneri:**
Projeyi çalıştırmak için \`backend\` klasöründe \`npm run dev\` ve \`docker-compose up -d\` komutlarını çalıştırarak veri tabanı, WebSocket ve LLM (OpenAI/Gemini/Ollama) entegrasyonlarını canlı olarak test edebilirsiniz.`;

      // Karakter akışı simülasyonu
      let currentLength = 0;
      const interval = setInterval(() => {
        if (currentLength < mockResponse.length) {
          currentLength += Math.min(5, mockResponse.length - currentLength);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, role: "assistant", content: mockResponse.slice(0, currentLength) }
            ];
          });
        } else {
          clearInterval(interval);
          setIsStreaming(false);
        }
      }, 30);
    }
  };

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Math.random().toString(),
      title: `Yeni Sohbet #${chats.length + 1}`
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setMessages([
      {
        id: Math.random().toString(),
        role: "assistant",
        content: "Yeni bir sohbet başladı. Size nasıl yardımcı olabilirim?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 1. YAN PANEL (SIDEBAR) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-panel border-r border-gray-800 flex flex-col h-full z-20 shrink-0"
          >
            {/* Logo Alanı */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-accent-purple animate-pulse" />
                <span className="text-lg font-bold bg-gradient-to-r from-accent-purple via-accent-indigo to-accent-cyan bg-clip-text text-transparent">
                  Assistant OS
                </span>
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
                v1.0
              </div>
            </div>

            {/* Yeni Sohbet Oluşturma */}
            <div className="p-3">
              <button 
                onClick={createNewChat}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-dashed border-gray-700 hover:border-accent-purple text-gray-300 hover:text-white bg-gray-900/40 hover:bg-accent-purple/5 transition duration-300"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Yeni Sohbet</span>
              </button>
            </div>

            {/* Sohbet Geçmişi */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <div className="text-xs text-gray-500 font-semibold px-3 py-2 uppercase tracking-wider">
                Sohbet Geçmişi
              </div>
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition duration-200 text-left ${
                    activeChatId === chat.id 
                      ? "bg-accent-purple/15 text-white border border-accent-purple/20" 
                      : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-accent-purple" />
                  <span className="text-sm truncate font-medium">{chat.title}</span>
                </button>
              ))}
            </div>

            {/* Çalışma Alanı (Workspace Linkleri) */}
            <div className="p-3 border-t border-gray-800 bg-gray-950/40">
              <div className="text-xs text-gray-500 font-semibold px-1 pb-2 uppercase tracking-wider">
                Çalışma Alanı
              </div>
              <Link 
                href="/workspace"
                className="flex items-center justify-between w-full p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition duration-150"
              >
                <div className="flex items-center space-x-2">
                  <KanbanSquare className="w-4 h-4 text-accent-indigo" />
                  <span className="text-sm">Kanban & Görevler</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Profil ve Plan Bilgisi */}
            <div className="p-4 border-t border-gray-800 flex items-center space-x-3 bg-gray-950/50">
              <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center border border-accent-purple/30">
                <User className="w-5 h-5 text-accent-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">Hasan</div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-yellow-500 font-medium tracking-wide uppercase">{userPlan} Planı</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ANA PANEL (CHAT AREA) */}
      <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 relative">
        {/* Üst Menü / Kontroller */}
        <header className="glass-panel border-b border-gray-800 h-16 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition duration-150"
            >
              <Terminal className="w-5 h-5" />
            </button>
            
            {/* Bağlantı Durum Göstergesi */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? "Sunucu Bağlı (WS)" : "Yerel Mod (Mock)"}
              </span>
            </div>
          </div>

          {/* Model ve Provider Seçici */}
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-900/60 p-1 rounded-xl border border-gray-800">
              <button 
                onClick={() => { setSelectedProvider("openai"); setSelectedModel("gpt-4o"); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  selectedProvider === "openai" ? "bg-accent-purple text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                OpenAI
              </button>
              <button 
                onClick={() => { setSelectedProvider("gemini"); setSelectedModel("gemini-1.5-flash"); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  selectedProvider === "gemini" ? "bg-accent-purple text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Gemini
              </button>
              <button 
                onClick={() => { setSelectedProvider("ollama"); setSelectedModel("llama3"); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  selectedProvider === "ollama" ? "bg-accent-purple text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Ollama
              </button>
            </div>
          </div>
        </header>

        {/* Mesaj Akış Alanı */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full relative z-10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex space-x-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-accent-purple" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-accent-purple text-white border-accent-purple/30 shadow-lg"
                    : "glass-card text-gray-100 border-gray-800"
                }`}
              >
                {/* Mesaj İçeriği */}
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>
                
                {/* Zaman damgası */}
                <div className={`text-[10px] mt-2 text-right ${msg.role === "user" ? "text-purple-200" : "text-gray-500"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-accent-indigo/20 border border-accent-indigo/30 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-accent-indigo" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Mesaj Giriş Alanı */}
        <div className="p-6 shrink-0 relative z-10">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto glass-input rounded-2xl flex items-center p-2"
          >
            {/* Dosya Yükleme Butonu */}
            <button
              type="button"
              className="p-3 text-gray-400 hover:text-white transition rounded-xl hover:bg-gray-800/40"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input alanı */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Yapay zeka asistanına bir soru sorun..."
              className="flex-1 bg-transparent border-0 outline-none px-3 text-sm text-white placeholder-gray-500 focus:ring-0"
              disabled={isStreaming}
            />

            {/* Sesli Asistan Butonu */}
            <button
              type="button"
              className="p-3 text-gray-400 hover:text-white transition rounded-xl hover:bg-gray-800/40 mr-1"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Gönder butonu */}
            <button
              type="submit"
              disabled={isStreaming}
              className="p-3 bg-accent-purple text-white rounded-xl shadow-lg hover:bg-accent-purple/80 transition duration-200 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2 text-[10px] text-gray-500">
            Assistant OS yapay zekanın gücünü premium arayüzle birleştirir.
          </div>
        </div>
      </div>
    </div>
  );
}
