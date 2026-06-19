import { Router, Response } from "express";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Tüm sohbet rotaları JWT korumalıdır
router.use(authMiddleware as any);

/**
 * Yeni Klasör Oluştur (Folder)
 */
router.post("/folders", async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Klasör ismi zorunludur." });

  try {
    const folder = await prisma.folder.create({
      data: {
        name,
        userId: req.userId!,
      },
    });
    return res.status(201).json(folder);
  } catch (error: any) {
    return res.status(500).json({ message: "Klasör oluşturulamadı.", error: error.message });
  }
});

/**
 * Kullanıcının Tüm Klasörlerini Getir
 */
router.get("/folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.userId! },
      include: { chats: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(folders);
  } catch (error: any) {
    return res.status(500).json({ message: "Klasörler yüklenemedi.", error: error.message });
  }
});

/**
 * Yeni Sohbet Oluştur (Chat)
 */
router.post("/chats", async (req: AuthenticatedRequest, res: Response) => {
  const { title, folderId } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        title: title || "Yeni Sohbet",
        userId: req.userId!,
        folderId: folderId || null,
      },
    });
    return res.status(201).json(chat);
  } catch (error: any) {
    return res.status(500).json({ message: "Sohbet oluşturulamadı.", error: error.message });
  }
});

/**
 * Kullanıcının Tüm Sohbetlerini Getir (Klasörsüzler dahil)
 */
router.get("/chats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(chats);
  } catch (error: any) {
    return res.status(500).json({ message: "Sohbetler yüklenemedi.", error: error.message });
  }
});

/**
 * Sohbet Detayı ve Mesajları Getir
 */
router.get("/chats/:id/messages", async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id;
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId! },
    });

    if (!chat) {
      return res.status(404).json({ message: "Sohbet bulunamadı veya yetkiniz yok." });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ chat, messages });
  } catch (error: any) {
    return res.status(500).json({ message: "Mesajlar yüklenemedi.", error: error.message });
  }
});

/**
 * Sohbeti Güncelle (Başlık Değiştirme / Klasöre Taşıma)
 */
router.put("/chats/:id", async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id;
  const { title, folderId } = req.body;

  try {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId! },
    });

    if (!chat) {
      return res.status(404).json({ message: "Sohbet bulunamadı." });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        title: title !== undefined ? title : chat.title,
        folderId: folderId !== undefined ? folderId : chat.folderId,
      },
    });

    return res.json(updatedChat);
  } catch (error: any) {
    return res.status(500).json({ message: "Sohbet güncellenemedi.", error: error.message });
  }
});

/**
 * Sohbet Sil
 */
router.delete("/chats/:id", async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id;
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId! },
    });

    if (!chat) {
      return res.status(404).json({ message: "Sohbet bulunamadı." });
    }

    await prisma.chat.delete({ where: { id: chatId } });
    return res.json({ message: "Sohbet başarıyla silindi." });
  } catch (error: any) {
    return res.status(500).json({ message: "Sohbet silinemedi.", error: error.message });
  }
});

export default router;
