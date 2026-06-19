"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  KanbanSquare, FileText, Upload, Plus, Trash2, ArrowLeft,
  CheckCircle2, AlertCircle, FileSpreadsheet, FileImage
} from "lucide-react";
import Link from "next/link";

interface KanbanTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
}

export default function WorkspacePage() {
  // Kanban Tasks State
  const [tasks, setTasks] = useState<KanbanTask[]>([
    { id: "1", title: "SOLID prensipleri dokümantasyonunu hazırla", status: "TODO", priority: "HIGH" },
    { id: "2", title: "Next.js 15 WebSocket bağlantısını test et", status: "IN_PROGRESS", priority: "MEDIUM" },
    { id: "3", title: "PostgreSQL pgvector şemasını tamamla", status: "DONE", priority: "HIGH" },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Uploaded Documents State
  const [documents, setDocuments] = useState<UploadedDocument[]>([
    { id: "d1", name: "proje_mimarisi.pdf", type: "pdf", size: "2.4 MB" },
    { id: "d2", name: "veri_şablonu.csv", type: "csv", size: "120 KB" },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Görev Ekleme
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: KanbanTask = {
      id: Math.random().toString(),
      title: newTaskTitle.trim(),
      status: "TODO",
      priority: "MEDIUM"
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  // Görev Durumu Güncelleme (Sürükleme simülasyonu)
  const moveTaskStatus = (id: string, currentStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    const statusOrder: ("TODO" | "IN_PROGRESS" | "DONE")[] = ["TODO", "IN_PROGRESS", "DONE"];
    const nextIndex = (statusOrder.indexOf(currentStatus) + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];

    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  };

  // Görev Silme
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Dosya Yükleme Simülasyonu
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const newDoc: UploadedDocument = {
        id: Math.random().toString(),
        name: file.name,
        type: file.name.split('.').pop() || "txt",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      setDocuments([newDoc, ...documents]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-8">
      {/* Üst Kısım / Geri Dönüş */}
      <header className="max-w-7xl mx-auto w-full mb-8 flex justify-between items-center">
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Sohbete Geri Dön</span>
        </Link>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-purple via-accent-indigo to-accent-cyan bg-clip-text text-transparent">
          AI OS Workspace
        </h1>
      </header>

      {/* Grid Yapısı (Kanban + Belge Yükleme) */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL VE ORTA: KANBAN BOARD */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <KanbanSquare className="w-5 h-5 text-accent-purple" />
              <span>Kanban Görev Paneli</span>
            </h2>
            
            {/* Görev Ekleme Formu */}
            <form onSubmit={handleAddTask} className="flex space-x-2">
              <input
                type="text"
                placeholder="Yeni görev ekle..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="glass-input text-xs py-1.5 px-3 rounded-lg w-48"
              />
              <button 
                type="submit"
                className="bg-accent-purple text-white p-1.5 rounded-lg hover:bg-accent-purple/80 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* TODO KOLONU */}
            <div className="glass-panel rounded-2xl p-4 space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-800 pb-2">
                Yapılacaklar ({tasks.filter(t => t.status === "TODO").length})
              </div>
              <div className="space-y-3 min-h-[300px]">
                {tasks.filter(t => t.status === "TODO").map(task => (
                  <div key={task.id} className="glass-card rounded-xl p-3 border-l-4 border-l-accent-purple relative group">
                    <h3 className="text-xs font-medium text-white pr-6">{task.title}</h3>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] bg-red-900/40 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-900/30">
                        {task.priority}
                      </span>
                      <button 
                        onClick={() => moveTaskStatus(task.id, "TODO")}
                        className="text-[9px] text-accent-purple hover:underline"
                      >
                        İlerle
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* IN PROGRESS KOLONU */}
            <div className="glass-panel rounded-2xl p-4 space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-800 pb-2">
                Çalışılanlar ({tasks.filter(t => t.status === "IN_PROGRESS").length})
              </div>
              <div className="space-y-3 min-h-[300px]">
                {tasks.filter(t => t.status === "IN_PROGRESS").map(task => (
                  <div key={task.id} className="glass-card rounded-xl p-3 border-l-4 border-l-accent-indigo relative group">
                    <h3 className="text-xs font-medium text-white pr-6">{task.title}</h3>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] bg-yellow-900/40 text-yellow-400 font-bold px-1.5 py-0.5 rounded border border-yellow-900/30">
                        {task.priority}
                      </span>
                      <button 
                        onClick={() => moveTaskStatus(task.id, "IN_PROGRESS")}
                        className="text-[9px] text-accent-indigo hover:underline"
                      >
                        Tamamla
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE KOLONU */}
            <div className="glass-panel rounded-2xl p-4 space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-800 pb-2">
                Tamamlananlar ({tasks.filter(t => t.status === "DONE").length})
              </div>
              <div className="space-y-3 min-h-[300px]">
                {tasks.filter(t => t.status === "DONE").map(task => (
                  <div key={task.id} className="glass-card rounded-xl p-3 border-l-4 border-l-green-500 relative group bg-green-950/5">
                    <h3 className="text-xs font-medium text-gray-300 line-through pr-6">{task.title}</h3>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] bg-green-900/40 text-green-400 font-bold px-1.5 py-0.5 rounded border border-green-900/30">
                        Başarılı
                      </span>
                      <button 
                        onClick={() => moveTaskStatus(task.id, "DONE")}
                        className="text-[9px] text-gray-500 hover:underline"
                      >
                        Geri Al
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* SAĞ TARAF: BELGE YÜKLEME & HAFIZA (RAG) */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <FileText className="w-5 h-5 text-accent-cyan" />
            <span>Doküman & Hafıza Havuzu</span>
          </h2>

          {/* Drag & Drop Upload alanı */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`glass-panel border-2 border-dashed rounded-2xl p-6 text-center transition duration-200 ${
              isDragging ? "border-accent-cyan bg-accent-cyan/5" : "border-gray-800 hover:border-accent-cyan/50"
            }`}
          >
            <Upload className="w-8 h-8 text-accent-cyan mx-auto mb-3 animate-bounce" />
            <div className="text-sm font-semibold text-white">Yüklemek İçin Dosyayı Sürükleyin</div>
            <div className="text-xs text-gray-500 mt-1">PDF, TXT, CSV formatları desteklenir</div>
            <label className="mt-4 inline-block text-xs bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/30 px-4 py-2 rounded-xl cursor-pointer transition">
              Dosya Seç
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDocuments([{
                      id: Math.random().toString(),
                      name: file.name,
                      type: file.name.split('.').pop() || "txt",
                      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    }, ...documents]);
                  }
                }}
              />
            </label>
          </div>

          {/* Yüklenmiş Belgeler Listesi */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-800">
              Yüklenen Belgeler ({documents.length})
            </div>
            
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/40 hover:bg-gray-900 border border-gray-800 transition"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                    <FileText className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate max-w-[150px]">{doc.name}</div>
                    <div className="text-[10px] text-gray-500">{doc.size}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[8px] bg-green-950 text-green-400 border border-green-900/30 px-1 py-0.5 rounded">
                    Vektörleştirildi
                  </span>
                  <button 
                    onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                    className="text-gray-500 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Semantik RAG Bilgilendirmesi */}
          <div className="glass-card rounded-2xl p-4 border border-accent-cyan/20 bg-accent-cyan/5">
            <h3 className="text-xs font-semibold text-accent-cyan flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Yapay Zeka Hafızası Etkin</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Yüklediğiniz belgeler arka planda semantik olarak analiz edilir. 
              Sohbet ekranında asistan bu dosyalardaki bilgileri hatırlayıp 
              sorularınıza dosya içeriğine göre cevap verebilir.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}
