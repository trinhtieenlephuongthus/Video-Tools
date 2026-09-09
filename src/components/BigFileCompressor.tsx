import React, { useState, useRef } from 'react';
import { 
  Zap, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileBox, 
  Clock, 
  Gauge, 
  Layers, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressLargeFile, formatBytes, CompressionLevel, CompressionResult } from '../utils/fileCompression';

interface BigFileCompressorProps {
  onClose?: () => void;
  isStandalone?: boolean;
}

export const BigFileCompressor: React.FC<BigFileCompressorProps> = ({ onClose, isStandalone = false }) => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const startCompression = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(5);

      const compResult = await compressLargeFile(file, level, (percent) => {
        setProgress(percent);
      });

      setResult(compResult);
      setIsProcessing(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình nén file');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${isStandalone ? 'p-4 sm:p-6' : 'p-0'}`}>
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 border border-amber-500/30 p-6 mb-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Công Cụ Nén File Dung Lượng Lớn Nhanh Chóng
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  SIÊU TỐC
                </span>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl">
                Nén các tệp Video 4K, Âm thanh chất lượng cao, Hình ảnh RAW, PDF hoặc dữ liệu hàng trăm MB/GB trực tiếp trong trình duyệt bằng công nghệ tăng tốc luồng máy khách.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-start md:self-center px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Quay lại danh mục
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl">
        
        {/* Upload Dropzone */}
        {!file && (
          <div
            id="compressor-dropzone"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-600/80 hover:border-amber-400/70 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Upload className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Kéo & Thả tệp dung lượng lớn vào đây
            </h3>
            <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
              Hỗ trợ tệp Video (MP4, MKV, MOV), Ảnh (JPG, PNG, WEBP), Âm thanh (WAV, MP3), Tài liệu, Tệp nén...
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition">
              <Upload className="w-4 h-4" />
              <span>Chọn tệp từ máy tính</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Không giới hạn dung lượng
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Riêng tư trên máy
              </span>
            </div>
          </div>
        )}

        {/* Selected File & Compression Controls */}
        {file && (
          <div className="space-y-6">
            
            {/* File Info Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileBox className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-sm sm:text-base max-w-xs sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Dung lượng gốc: <strong className="text-amber-300">{formatBytes(file.size)}</strong></span>
                    <span>•</span>
                    <span className="capitalize">{file.type || 'Tập tin nhị phân'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="text-xs text-slate-400 hover:text-rose-400 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
              >
                Đổi file khác
              </button>
            </div>

            {/* Compression Level Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Chọn Chế Độ Nén
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'fast',
                    name: 'Siêu Tốc (Fast)',
                    desc: 'Tốc độ tối đa, phù hợp file cực lớn > 500MB',
                    speed: '~80 MB/s',
                    badge: 'Nhanh nhất'
                  },
                  {
                    id: 'balanced',
                    name: 'Cân Bằng (Balanced)',
                    desc: 'Tối ưu giữa dung lượng giảm và tốc độ xử lý',
                    speed: '~45 MB/s',
                    badge: 'Khuyên dùng'
                  },
                  {
                    id: 'max',
                    name: 'Tối Đa (Maximum)',
                    desc: 'Giảm tối đa kích thước tệp, nén sâu nhất',
                    speed: '~25 MB/s',
                    badge: 'Tiết kiệm nhất'
                  }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    id={`compress-level-${mode.id}`}
                    onClick={() => setLevel(mode.id as CompressionLevel)}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      level === mode.id
                        ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/20'
                        : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{mode.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        level === mode.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{mode.desc}</p>
                    <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Tốc độ: {mode.speed}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button & Progress */}
            {!result && (
              <div className="pt-2">
                <button
                  id="start-compression-btn"
                  onClick={startCompression}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang nén dữ liệu ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      <span>Bắt Đầu Nén File Ngay</span>
                    </>
                  )}
                </button>

                {isProcessing && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Đang nén đa luồng trên trình duyệt...</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Result Statistics Card */}
            {result && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900 border border-emerald-500/30 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Nén thành công!</h4>
                      <p className="text-xs text-slate-300">File đã được nén tối ưu và sẵn sàng tải về.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">
                      -{result.ratio}%
                    </span>
                    <p className="text-[11px] text-slate-400">Dung lượng tiết kiệm</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <p className="text-[11px] text-slate-400">Ban đầu</p>
                    <p className="font-bold text-slate-200 text-sm">{formatBytes(result.originalSize)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                    <p className="text-[11px] text-emerald-400">Sau khi nén</p>
                    <p className="font-bold text-emerald-300 text-sm">{formatBytes(result.compressedSize)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Thời gian
                    </p>
                    <p className="font-bold text-slate-200 text-sm">{(result.durationMs / 1000).toFixed(2)}s</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Tốc độ
                    </p>
                    <p className="font-bold text-amber-400 text-sm">{result.speedMBps} MB/s</p>
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    id="download-compressed-file-btn"
                    onClick={handleDownload}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition"
                  >
                    <Download className="w-5 h-5" />
                    <span>Tải File Đã Nén ({formatBytes(result.compressedSize)})</span>
                  </button>
                  <button
                    onClick={() => { setFile(null); setResult(null); }}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
                  >
                    Nén file khác
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
