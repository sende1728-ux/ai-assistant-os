import { Router, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const stripeKey = process.env.STRIPE_API_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-04-10" as any }) : null;

/**
 * Stripe Satın Alma Oturumu Oluştur (Mock Modu Destekli)
 */
router.post(
  "/create-checkout-session",
  authMiddleware as any,
  async (req: AuthenticatedRequest, res: Response) => {
    const { plan } = req.body; // "PRO" veya "ENTERPRISE"
    const userId = req.userId!;

    if (!plan || !["PRO", "ENTERPRISE"].includes(plan)) {
      return res.status(400).json({ message: "Geçersiz üyelik planı seçildi." });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

      // Eğer Stripe API Key yoksa MOCK modu devreye girer
      if (!stripe) {
        console.log("Stripe API anahtarı bulunamadı. MOCK modu çalıştırılıyor...");
        
        // Kullanıcı planını doğrudan yükselt (Mock satın alma)
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { subscriptionPlan: plan },
        });

        return res.json({
          mock: true,
          message: `Mock Satın Alma Başarılı! Üyeliğiniz ${plan} plana yükseltildi.`,
          user: {
            email: updatedUser.email,
            subscriptionPlan: updatedUser.subscriptionPlan,
          },
        });
      }

      // Gerçek Stripe Ödeme Sayfası oluşturma
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `AI Assistant OS - ${plan} Plan`,
                description: "Gelişmiş Yapay Zeka Asistanı Aylık Aboneliği",
              },
              unit_amount: plan === "PRO" ? 1900 : 9900, // $19.00 veya $99.00
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing`,
        metadata: {
          userId,
          plan,
        },
      });

      return res.json({ url: session.url });
    } catch (error: any) {
      return res.status(500).json({ message: "Ödeme oturumu oluşturulamadı.", error: error.message });
    }
  }
);

/**
 * Stripe Webhook Alıcısı (Abonelik Durumu Senkronizasyonu)
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !sig || !endpointSecret) {
    return res.status(400).send("Webhook ayarları eksik veya Stripe devredışı.");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Hatası: ${err.message}`);
  }

  // Ödeme ve abonelik tamamlama olaylarını yakala
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: plan as any,
          stripeCustomerId: session.customer as string,
        },
      });
      console.log(`Kullanıcı ${userId} başarıyla ${plan} plana yükseltildi (Stripe).`);
    }
  }

  return res.json({ received: true });
});

export default router;
