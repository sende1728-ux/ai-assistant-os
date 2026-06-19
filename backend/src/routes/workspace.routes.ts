import { Router, Response } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";
import { MemoryService } from "../services/memory.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware as any);

// ==========================================
// KANBAN BOARD / GÖREV SİSTEMİ (TASKS)
// ==========================================

/**
 * Görevleri Listele
 */
router.get("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ message: "Görevler yüklenemedi.", error: error.message });
  }
});

/**
 * Görev Oluştur
 */
router.post("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  const { title, status, priority, notes, dueDate } = req.body;
  if (!title) return res.status(400).json({ message: "Görev başlığı zorunludur." });

  try {
    const task = await prisma.task.create({
      data: {
        title,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId!,
      },
    });
    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ message: "Görev oluşturulamadı.", error: error.message });
  }
});

/**
 * Görev Güncelle (Örn: Kanban'da sürükleme durumunda status güncelleme)
 */
router.put("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { title, status, priority, notes, dueDate } = req.body;
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!task) return res.status(404).json({ message: "Görev bulunamadı." });

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? title : task.title,
        status: status !== undefined ? status : task.status,
        priority: priority !== undefined ? priority : task.priority,
        notes: notes !== undefined ? notes : task.notes,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      },
    });

    return res.json(updatedTask);
  } catch (error: any) {
    return res.status(500).json({ message: "Görev güncellenemedi.", error: error.message });
  }
});

/**
 * Görev Sil
 */
router.delete("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });

    if (!task) return res.status(404).json({ message: "Görev bulunamadı." });

    await prisma.task.delete({ where: { id: req.params.id } });
    return res.json({ message: "Görev başarıyla silindi." });
  } catch (error: any) {
    return res.status(500).json({ message: "Görev silinemedi.", error: error.message });
  }
});

// ==========================================
// DOSYA / DOKÜMAN SİSTEMİ (DOCUMENTS & RAG)
// ==========================================

/**
 * Dokümanları Listele
 */
router.get("/documents", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    return res.json(docs);
  } catch (error: any) {
    return res.status(500).json({ message: "Dokümanlar yüklenemedi.", error: error.message });
  }
});

/**
 * Doküman Yükleme & Metin Ayıklama & Vektörleştirme (RAG)
 */
router.post(
  "/documents/upload",
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "Yüklenecek dosya bulunamadı." });
    }

    const { originalname, mimetype, buffer } = req.file;
    let extractedText = "";
    let docType = "txt";

    try {
      if (mimetype === "application/pdf") {
        docType = "pdf";
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else if (mimetype.startsWith("text/")) {
        docType = "txt";
        extractedText = buffer.toString("utf-8");
      } else {
        docType = "file";
        extractedText = `Desteklenmeyen dosya türünden yükleme yapıldı: ${originalname}`;
      }

      // Veritabanına kaydet
      const document = await prisma.document.create({
        data: {
          name: originalname,
          type: docType,
          content: extractedText,
          fileUrl: `/uploads/${Date.now()}_${originalname}`, // Sanal dosya yolu
          userId: req.userId!,
        },
      });

      // RAG Entegrasyonu: Dosya metnini parçalara (chunks) ayır ve Vector Database hafızasına ekle
      if (extractedText.trim().length > 0) {
        // Metni yaklaşık 500 karakterlik paragraflara bölüyoruz
        const chunks = extractedText.match(/[^.!?]+[.!?]+(\s|$)/g) || [extractedText];
        let currentChunk = "";
        
        for (const sentence of chunks) {
          currentChunk += sentence;
          if (currentChunk.length > 500) {
            await MemoryService.addMemory(
              req.userId!,
              `[Doküman Hafızası: ${originalname}] ${currentChunk.trim()}`
            );
            currentChunk = "";
          }
        }
        if (currentChunk.trim().length > 0) {
          await MemoryService.addMemory(
            req.userId!,
            `[Doküman Hafızası: ${originalname}] ${currentChunk.trim()}`
          );
        }
      }

      return res.status(201).json({
        message: "Dosya başarıyla yüklendi ve yapay zeka hafızasına entegre edildi.",
        document,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Dosya işleme hatası.", error: error.message });
    }
  }
);

export default router;
