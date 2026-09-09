import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ToolGrid } from './components/ToolGrid';
import { BigFileCompressor } from './components/BigFileCompressor';
import { VideoEditorModal } from './components/video/VideoEditorModal';
import { AudioToolsModal } from './components/audio/AudioToolsModal';
import { PdfToolsModal } from './components/pdf/PdfToolsModal';
import { ConverterModal } from './components/converters/ConverterModal';
import { TOOLS_LIST } from './data/tools';
import { ToolItem, ToolCategory } from './types';
import { 
  Zap, 
  Film, 
  Music, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Globe,
  Sparkles,
  Layers
} from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active Tool Modal
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [showCompressorModal, setShowCompressorModal] = useState<boolean>(false);

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter((tool) => {
      const matchesCat = activeCategory === 'all' || tool.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        tool.name.toLowerCase().includes(q) || 
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle click on a tool card
  const handleSelectTool = (tool: ToolItem) => {
    if (tool.id === 'big-file-compressor') {
      setShowCompressorModal(true);
    } else {
      setSelectedTool(tool);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Sticky Navigation */}
      <Navbar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCompressor={() => setShowCompressorModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Hero Banner when viewing 'all' and no active search */}
        {activeCategory === 'all' && !searchQuery && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nền tảng tiện ích Web All-in-One 123apps Studio</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Mọi Công Cụ Chỉnh Sửa Video, Âm Thanh & PDF Trực Tuyến Trong Tầm Tay
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Cắt ghép video, tách lời bài hát Karaoke, nén file dung lượng lớn siêu tốc, chuyển đổi định dạng và bảo vệ PDF mà không cần cài đặt phần mềm.
              </p>

              {/* Quick Jump Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  onClick={() => setShowCompressorModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 transition"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Nén File Lớn Siêu Tốc</span>
                </button>
                <button
                  onClick={() => setSelectedTool(TOOLS_LIST.find(t => t.id === 'video-editor') || null)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <Film className="w-4 h-4" />
                  <span>Chỉnh Sửa Video</span>
                </button>
                <button
                  onClick={() => setSelectedTool(TOOLS_LIST.find(t => t.id === 'audio-vocal-remover') || null)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <Music className="w-4 h-4" />
                  <span>Tách Lời Karaoke</span>
                </button>
                <button
                  onClick={() => setSelectedTool(TOOLS_LIST.find(t => t.id === 'pdf-split') || null)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xử Lý PDF</span>
                </button>
              </div>
            </div>

            {/* Background aesthetic decorative shapes */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute right-20 bottom-0 w-72 h-72 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        )}

        {/* Highlighted Big File Compressor Banner when in compression filter */}
        {activeCategory === 'compression' && (
          <BigFileCompressor onClose={() => setActiveCategory('all')} isStandalone={false} />
        )}

        {/* Directory Grid of Tools */}
        {activeCategory !== 'compression' && (
          <ToolGrid
            tools={filteredTools}
            onSelectTool={handleSelectTool}
            activeCategory={activeCategory}
          />
        )}

        {/* Privacy & Performance Assurance Footer Block */}
        <div className="mt-16 pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-400 text-xs">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Bảo Mật 100%</h4>
              <p>Mọi tệp tin được xử lý trực tiếp trên trình duyệt máy khách (Client-Side), không tải lên máy chủ ngoài, an toàn tuyệt đối.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Cpu className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Xử Lý Tốc Độ Cao</h4>
              <p>Sử dụng Web Audio API, Canvas rendering, fflate đa luồng và Web Speech API cho phản hồi tức thì mượt mà.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <HardDrive className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Không Giới Hạn Tệp</h4>
              <p>Dễ dàng nén và chỉnh sửa các file video, âm thanh và PDF dung lượng lớn mà không bị chặn kích thước.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 123apps Studio • Bộ công cụ Đa Năng Trực Tuyến Chỉnh Sửa Video, Âm Thanh, PDF & Nén File Siêu Tốc.</p>
      </footer>

      {/* MODAL 1: BIG FILE COMPRESSOR (When triggered from quick button or card) */}
      {showCompressorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] p-6">
            <BigFileCompressor onClose={() => setShowCompressorModal(false)} isStandalone={false} />
          </div>
        </div>
      )}

      {/* MODAL 2: VIDEO TOOLS */}
      {selectedTool && selectedTool.category === 'video' && (
        <VideoEditorModal
          initialToolId={selectedTool.id}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* MODAL 3: AUDIO TOOLS */}
      {selectedTool && selectedTool.category === 'audio' && (
        <AudioToolsModal
          initialToolId={selectedTool.id}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* MODAL 4: PDF TOOLS */}
      {selectedTool && selectedTool.category === 'pdf' && (
        <PdfToolsModal
          initialToolId={selectedTool.id}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* MODAL 5: CONVERTER TOOLS */}
      {selectedTool && selectedTool.category === 'converter' && (
        <ConverterModal
          initialToolId={selectedTool.id}
          onClose={() => setSelectedTool(null)}
        />
      )}

    </div>
  );
}
