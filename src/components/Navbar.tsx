import React from 'react';
import { 
  Zap, 
  Film, 
  Music, 
  FileText, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { ToolCategory } from '../types';

interface NavbarProps {
  activeCategory: ToolCategory | 'all';
  setActiveCategory: (cat: ToolCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCompressor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onOpenCompressor,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            id="app-logo"
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  123apps
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Bộ công cụ Media & PDF trực tuyến
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-tools-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công cụ: cắt video, tách giọng, nén file, PDF..."
              className="w-full bg-slate-800/80 border border-slate-700/80 text-sm rounded-xl pl-9 pr-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Special Quick Action: Big File Compressor */}
          <div className="flex items-center gap-2">
            <button
              id="quick-big-file-compressor-btn"
              onClick={onOpenCompressor}
              className="relative group overflow-hidden px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Zap className="w-4 h-4 fill-current animate-bounce" />
              <span>Nén File Siêu Tốc</span>
              <span className="hidden md:inline-block text-[10px] uppercase font-extrabold bg-slate-950/20 px-1.5 py-0.5 rounded text-slate-900">
                Lớn
              </span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-800/60 text-xs sm:text-sm">
          {[
            { id: 'all', label: 'Tất cả công cụ', icon: SlidersHorizontal },
            { id: 'compression', label: 'Nén Siêu Tốc ⚡', icon: Zap, highlight: true },
            { id: 'video', label: 'Video (14)', icon: Film },
            { id: 'audio', label: 'Âm thanh (12)', icon: Music },
            { id: 'pdf', label: 'PDF (6)', icon: FileText },
            { id: 'converter', label: 'Chuyển đổi (4)', icon: RefreshCw },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => {
                  setActiveCategory(cat.id as ToolCategory | 'all');
                  if (cat.id === 'compression') {
                    onOpenCompressor();
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? cat.highlight
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.highlight ? 'text-amber-400' : ''}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
