import React from 'react';
import { 
  Zap, 
  Film, 
  Scissors, 
  Layers, 
  RefreshCw, 
  Repeat, 
  Gauge, 
  Maximize2, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  Type, 
  VolumeX, 
  FileAudio, 
  Rewind, 
  Volume2, 
  Music, 
  Combine, 
  FileAudio2, 
  Sliders, 
  Mic2, 
  Mic, 
  Speaker, 
  FastForward, 
  Activity, 
  RotateCcw, 
  Percent, 
  Disc, 
  Split, 
  CopyPlus, 
  FileArchive, 
  FileText, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  Image, 
  FileCheck, 
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ToolItem } from '../types';

interface ToolGridProps {
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
  activeCategory: string;
}

// Icon mapping helper
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Zap,
  Film,
  Scissors,
  Layers,
  RefreshCw,
  Repeat,
  Gauge,
  Maximize2,
  Crop,
  RotateCw,
  FlipHorizontal,
  Type,
  VolumeX,
  FileAudio,
  Rewind,
  Volume2,
  Music,
  Combine,
  FileAudio2,
  Sliders,
  Mic2,
  Mic,
  Speaker,
  FastForward,
  Activity,
  RotateCcw,
  Percent,
  Disc,
  Split,
  CopyPlus,
  FileArchive,
  FileText,
  Lock,
  Unlock,
  FileSpreadsheet,
  Image,
  FileCheck,
  Compass
};

export const ToolGrid: React.FC<ToolGridProps> = ({ tools, onSelectTool, activeCategory }) => {
  return (
    <div className="space-y-6">
      
      {/* Category Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>
              {activeCategory === 'all' && 'Tất Cả 32+ Công Cụ Trực Tuyến'}
              {activeCategory === 'compression' && 'Công Cụ Nén File Dung Lượng Lớn Siêu Tốc ⚡'}
              {activeCategory === 'video' && 'Công Cụ Chỉnh Sửa Video (14 Công Cụ)'}
              {activeCategory === 'audio' && 'Công Cụ Âm Thanh & Giọng Nói (12 Công Cụ)'}
              {activeCategory === 'pdf' && 'Công Cụ Xử Lý PDF (6 Công Cụ)'}
              {activeCategory === 'converter' && 'Trình Chuyển Đổi Định Dạng'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tools.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Xử lý tệp trực tiếp trong trình duyệt bằng Web Audio, Canvas & WASM • An toàn 100% bảo mật
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Không cần tải phần mềm
          </span>
          <span className="hidden md:flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Miễn phí & Không watermark
          </span>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {tools.map((tool) => {
          const IconComponent = ICON_MAP[tool.iconName] || Film;
          const isHighlight = tool.id === 'big-file-compressor';

          return (
            <div
              key={tool.id}
              id={`tool-card-${tool.id}`}
              onClick={() => onSelectTool(tool)}
              className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-0.5 ${
                isHighlight
                  ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-500/10 sm:col-span-2'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700 shadow-md hover:shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className={`p-3 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${tool.bgGradient}`}>
                    <IconComponent className={`w-6 h-6 ${tool.color}`} />
                  </div>

                  {tool.badge && (
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isHighlight
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className={`font-bold text-sm sm:text-base text-white group-hover:${tool.color} transition-colors flex items-center gap-1.5`}>
                  <span>{tool.name}</span>
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                <span>Mở công cụ</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
