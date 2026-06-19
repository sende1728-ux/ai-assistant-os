# AI Assistant OS - Dağıtım (Deployment) Kılavuzu

Bu kılavuz, hazırlanan projenin yerel sunucu dışındaki canlı ortamlara (Vercel, Railway veya AWS) nasıl dağıtılacağını adım adım açıklar.

---

## ☁️ 1. Backend Dağıtımı (Railway / Render / AWS)

Backend, Node.js ve Express tabanlı olup veritabanı bağlantısı (PostgreSQL + pgvector) ve WebSocket desteği gerektirir. **Railway**, WebSocket ve PostgreSQL desteği sunduğu için en kolay dağıtım seçeneğidir.

### Adımlar:
1. Bir PostgreSQL veri tabanı oluşturun ve **pgvector** eklentisinin aktif olduğundan emin olun (Railway üzerinde PostgreSQL oluşturulduğunda varsayılan olarak desteklenir).
2. Projenin `backend` klasörünü GitHub'a yükleyin.
3. Railway üzerinden yeni bir servis oluşturun ve GitHub deponuzu bağlayın.
4. Çevre Değişkenlerini (Environment Variables) girin:
   * `PORT`: `5000` (veya otomatik atanan)
   * `DATABASE_URL`: `postgresql://...` (Veritabanı bağlantı linki)
   * `JWT_SECRET`: `guvenli_bir_key`
   * `OPENAI_API_KEY`: OpenAI API Anahtarınız
   * `GEMINI_API_KEY`: Gemini API Anahtarınız
   * `STRIPE_API_KEY`: Stripe API Anahtarınız (Opsiyonel)
5. `Prisma` entegrasyonu için derleme komutunu (Build Command) şu şekilde ayarlayın:
   ```bash
   npx prisma generate && npm run build
   ```
6. Dağıtımı (Deploy) başlatın.

---

## 🎨 2. Frontend Dağıtımı (Vercel)

Next.js 15 projesi doğrudan **Vercel** üzerine dağıtılabilir.

### Adımlar:
1. Projenin `frontend` klasörünü GitHub'a yükleyin.
2. Vercel paneline gidin ve "Add New Project" seçeneğini tıklayın.
3. GitHub deponuzu seçin.
4. Framework Preset olarak **Next.js**'in seçili olduğundan emin olun.
5. Root Directory (Kök Klasör) seçeneğini `frontend` olarak ayarlayın.
6. Çevre Değişkenlerini girin:
   * `NEXT_PUBLIC_API_URL`: Backend uygulamanızın HTTP adresi (Örn: `https://api.yourdomain.com`)
   * `NEXT_PUBLIC_WS_URL`: Backend uygulamanızın WebSocket adresi (Örn: `wss://api.yourdomain.com`)
7. "Deploy" butonuna basın.

---

## 🐳 3. Docker ile Kendi Sunucunuzda Çalıştırma (VPS / AWS EC2)

Projeyi kendi sunucunuzda tek bir komutla ayağa kaldırmak için backend ve frontend klasörlerinde birer `Dockerfile` oluşturup `docker-compose.yml` dosyasını genişletebilirsiniz.

### Docker Yapılandırması:
Veritabanı için projenin ana dizinindeki `docker-compose.yml` dosyasını kullanabilirsiniz:
```bash
docker-compose up -d
```
Bu komut, PostgreSQL ve PgVector servisini arka planda güvenli bir şekilde çalıştıracaktır.
