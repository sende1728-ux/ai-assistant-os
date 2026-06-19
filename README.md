# AI Assistant OS - Gelişmiş Yapay Zeka Asistanı Platformu

Bu proje; ChatGPT benzeri konuşabilen, uzun vadeli hafızaya sahip, agent mimarisiyle çalışan, dosya yükleme desteği olan, sesli arayüzü bulunan ve üyelik planı (Stripe) sunabilen premium bir **Yapay Zeka Asistan İşletim Sistemi**dir.

## 🛠️ Teknoloji Yığını (Tech Stack)

### Frontend (Arayüz)
* **Framework:** Next.js 15 (App Router, React 19)
* **Styling:** TailwindCSS & Shadcn UI (Futuristic Dark Theme)
* **Animasyonlar:** Framer Motion
* **Realtime Bağlantı:** WebSocket

### Backend (Sunucu)
* **Dil & Runtime:** Node.js (TypeScript) & Express
* **Veritabanı ORM:** Prisma ORM
* **Veritabanı:** PostgreSQL (PgVector eklentisiyle birlikte hafıza ve semantik arama için)
* **Yapay Zeka Servisleri:** OpenAI, Anthropic (Claude), Gemini, Yerel LLM (Ollama)

---

## 📂 Proje Yapısı (Monorepo)

```
ai-assistant-os/
├── frontend/             # Next.js 15 İstemci Projesi
├── backend/              # Node.js Express Sunucusu
├── docker-compose.yml    # Veritabanı ve PgVector Yapılandırması
└── README.md             # Bu Dosya
```

---

## 🚀 Başlangıç Kılavuzu

### 1. Veri Tabanını Çalıştırmak (Docker)
Sisteminizde Docker yüklü ise veri tabanını ayağa kaldırmak için:
```bash
docker-compose up -d
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```
Arayüze tarayıcınızdan `http://localhost:3000` adresinden erişebilirsiniz.
