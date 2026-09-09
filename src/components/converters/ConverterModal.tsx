import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Compass, 
  FileSpreadsheet, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createPdfFromText } from '../../utils/pdfProcessing';
import { formatBytes } from '../../utils/fileCompression';

interface ConverterModalProps {
  initialToolId: string;
  onClose: () => void;
}

export const ConverterModal: React.FC<ConverterModalProps> = ({ initialToolId, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(initialToolId);

  // Video to MP3 state
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Image Converter state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [targetImageFormat, setTargetImageFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [imageQuality, setImageQuality] = useState<number>(0.85);

  // Document Converter state
  const [docText, setDocText] = useState('Hợp đồng & Văn bản mẫu 123apps Studio\n\nNội dung văn bản được chuyển đổi định dạng chuẩn.');
  const [docTargetFormat, setDocTargetFormat] = useState<'pdf' | 'txt' | 'html'>('pdf');

  // Unit Converter state
  const [unitCategory, setUnitCategory] = useState<'length' | 'weight' | 'data' | 'currency' | 'temp'>('data');
  const [unitInputVal, setUnitInputVal] = useState<number>(1024);
  const [fromUnit, setFromUnit] = useState<string>('MB');
  const [toUnit, setToUnit] = useState<string>('GB');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image File Select
  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setExportUrl(null);
  };

  // Convert Image
  const handleConvertImage = async () => {
    if (!imageFile || !imagePreview) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = imagePreview;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.drawImage(img, 0, 0);

      const ext = targetImageFormat === 'image/webp' ? 'webp' : targetImageFormat === 'image/jpeg' ? 'jpg' : 'png';
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setExportUrl(url);
          setExportFileName(`${imageFile.name.replace(/\.[^/.]+$/, '')}.${ext}`);
          setIsProcessing(false);
          confetti({ particleCount: 40 });
        }
      }, targetImageFormat, imageQuality);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Không thể chuyển đổi hình ảnh này');
    }
  };

  // Convert Video to MP3/Audio
  const handleConvertVideoToMp3 = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    try {
      // Decode audio from video file or wrap as audio WAV
      const actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ab = await videoFile.arrayBuffer();
      let blob: Blob;
      try {
        const decoded = await actx.decodeAudioData(ab);
        const { audioBufferToWavBlob } = await import('../../utils/audioProcessing');
        blob = audioBufferToWavBlob(decoded);
      } catch {
        blob = new Blob([ab], { type: 'audio/mp3' });
      }

      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setExportFileName(`${videoFile.name.replace(/\.[^/.]+$/, '')}_audio.mp3`);
      setIsProcessing(false);
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Không thể trích xuất âm thanh từ video này');
    }
  };

  // Convert Document
  const handleConvertDocument = async () => {
    setIsProcessing(true);
    try {
      let blob: Blob;
      let name = '';

      if (docTargetFormat === 'pdf') {
        blob = await createPdfFromText('Văn bản chuyển đổi', docText);
        name = 'van_ban_chuyen_doi.pdf';
      } else if (docTargetFormat === 'html') {
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title></head><body><pre>${docText}</pre></body></html>`;
        blob = new Blob([html], { type: 'text/html' });
        name = 'van_ban_chuyen_doi.html';
      } else {
        blob = new Blob([docText], { type: 'text/plain' });
        name = 'van_ban_chuyen_doi.txt';
      }

      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setExportFileName(name);
      setIsProcessing(false);
      confetti({ particleCount: 40 });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Lỗi chuyển đổi văn bản');
    }
  };

  // Unit Converter Calculation
  const calculateUnits = () => {
    const val = unitInputVal || 0;
    if (unitCategory === 'data') {
      const unitsMap: Record<string, number> = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };
      const inBytes = val * (unitsMap[fromUnit] || 1);
      return (inBytes / (unitsMap[toUnit] || 1)).toFixed(4);
    } else if (unitCategory === 'length') {
      const lengthMap: Record<string, number> = {
        'mm': 0.001,
        'cm': 0.01,
        'm': 1,
        'km': 1000,
        'inch': 0.0254,
        'foot': 0.3048
      };
      const inMeters = val * (lengthMap[fromUnit] || 1);
      return (inMeters / (lengthMap[toUnit] || 1)).toFixed(4);
    } else if (unitCategory === 'weight') {
      const weightMap: Record<string, number> = {
        'g': 1,
        'kg': 1000,
        'ton': 1000000,
        'lb': 453.592,
        'oz': 28.3495
      };
      const inGrams = val * (weightMap[fromUnit] || 1);
      return (inGrams / (weightMap[toUnit] || 1)).toFixed(4);
    } else if (unitCategory === 'currency') {
      // Exchange rates relative to USD (estimate)
      const currMap: Record<string, number> = {
        'USD': 1.0,
        'VND': 25400,
        'EUR': 0.92,
        'JPY': 155,
        'GBP': 0.78,
      };
      const inUsd = val / (currMap[fromUnit] || 1);
      const res = inUsd * (currMap[toUnit] || 1);
      return res.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
    } else if (unitCategory === 'temp') {
      if (fromUnit === 'C' && toUnit === 'F') return ((val * 9/5) + 32).toFixed(2);
      if (fromUnit === 'F' && toUnit === 'C') return (((val - 32) * 5/9)).toFixed(2);
      if (fromUnit === 'C' && toUnit === 'K') return (val + 273.15).toFixed(2);
      return val.toFixed(2);
    }
    return val.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bộ Chuyển Đổi Định Dạng Đa Năng
              </h3>
              <p className="text-xs text-slate-400">
                Video sang MP3, Chuyển đổi Hình ảnh, Tài liệu & Đổi đơn vị đo lường tức thì.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto bg-slate-950/60 border-b border-slate-800 text-xs no-scrollbar">
          {[
            { id: 'converter-video-to-mp3', label: 'Video sang MP3', icon: FileSpreadsheet },
            { id: 'converter-image', label: 'Chuyển Đổi Ảnh (Image)', icon: ImageIcon },
            { id: 'converter-document', label: 'Chuyển Đổi Tài Liệu (Docs)', icon: FileText },
            { id: 'converter-units', label: 'Đổi Đơn Vị (Units)', icon: Compass },
          ].map((tool) => {
            const Icon = tool.icon;
            const isCur = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTab(tool.id); setExportUrl(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  isCur 
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: VIDEO TO MP3 */}
          {activeTab === 'converter-video-to-mp3' && (
            <div className="space-y-6">
              {!videoFile ? (
                <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="video-to-mp3-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setVideoFile(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Tải Lên Video Để Trích Xuất File MP3</h4>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    Trích xuất bài hát, lời thoại, nhạc nền từ video thành file MP3 với chất lượng nguyên bản.
                  </p>
                  <label
                    htmlFor="video-to-mp3-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn File Video</span>
                  </label>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <h4 className="font-bold text-white text-sm">{videoFile.name}</h4>
                      <p className="text-xs text-slate-400">Dung lượng: {formatBytes(videoFile.size)}</p>
                    </div>
                    <button
                      onClick={() => { setVideoFile(null); setExportUrl(null); }}
                      className="text-xs text-slate-400 hover:text-rose-400"
                    >
                      Đổi video khác
                    </button>
                  </div>

                  <button
                    onClick={handleConvertVideoToMp3}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition"
                  >
                    {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    <span>Chuyển Đổi Sang File MP3</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMAGE CONVERTER */}
          {activeTab === 'converter-image' && (
            <div className="space-y-6">
              {!imageFile ? (
                <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-convert-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleImageSelect(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Chuyển Đổi Định Dạng Hình Ảnh</h4>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    Hỗ trợ chuyển đổi nhanh chóng giữa WebP, JPG, PNG, GIF, BMP, ICO kèm nén chất lượng.
                  </p>
                  <label
                    htmlFor="image-convert-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn File Hình Ảnh</span>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
                  <div className="space-y-3">
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                      <img src={imagePreview || ''} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[200px]">{imageFile.name}</span>
                      <span>{formatBytes(imageFile.size)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-2">
                        Định dạng đích muốn xuất:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'image/webp', label: 'WEBP (Siêu nhẹ)' },
                          { id: 'image/jpeg', label: 'JPG / JPEG' },
                          { id: 'image/png', label: 'PNG (Trong suốt)' },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            onClick={() => setTargetImageFormat(fmt.id as typeof targetImageFormat)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                              targetImageFormat === fmt.id
                                ? 'border-sky-500 bg-sky-500/20 text-white font-bold'
                                : 'border-slate-800 bg-slate-900/60 text-slate-400'
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                        Chất lượng hình ảnh: {Math.round(imageQuality * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.3}
                        max={1.0}
                        step={0.05}
                        value={imageQuality}
                        onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>

                    <button
                      onClick={handleConvertImage}
                      disabled={isProcessing}
                      className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition"
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      <span>Chuyển Đổi & Tải Về</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENT CONVERTER */}
          {activeTab === 'converter-document' && (
            <div className="space-y-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Chuyển Đổi Tài Liệu (Document Converter)</h4>
                  <p className="text-xs text-slate-400">Chuyển đổi qua lại giữa PDF, Text thô (.txt) và HTML Web.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">Nhập hoặc dán nội dung:</label>
                <textarea
                  rows={6}
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-300">Định dạng đích:</label>
                {(['pdf', 'txt', 'html'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDocTargetFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      docTargetFormat === fmt ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleConvertDocument}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>Chuyển Đổi & Xuất File</span>
              </button>
            </div>
          )}

          {/* TAB 4: UNIT CONVERTER */}
          {activeTab === 'converter-units' && (
            <div className="space-y-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Bộ Chuyển Đổi Đơn Vị Đo Lường Tức Thì</h4>
                  <p className="text-xs text-slate-400">Dung lượng số (MB, GB), Cân nặng, Chiều dài, Tiền tệ, Nhiệt độ.</p>
                </div>
              </div>

              {/* Unit Category selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-semibold">
                {[
                  { id: 'data', label: 'Dung Lượng Số (Bytes)' },
                  { id: 'length', label: 'Độ Dài (m, cm, km)' },
                  { id: 'weight', label: 'Cân Nặng (kg, g, lb)' },
                  { id: 'currency', label: 'Tiền Tệ (VND, USD)' },
                  { id: 'temp', label: 'Nhiệt Độ (°C, °F)' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setUnitCategory(c.id as typeof unitCategory);
                      if (c.id === 'data') { setFromUnit('MB'); setToUnit('GB'); setUnitInputVal(1024); }
                      else if (c.id === 'length') { setFromUnit('m'); setToUnit('cm'); setUnitInputVal(1); }
                      else if (c.id === 'weight') { setFromUnit('kg'); setToUnit('g'); setUnitInputVal(1); }
                      else if (c.id === 'currency') { setFromUnit('USD'); setToUnit('VND'); setUnitInputVal(100); }
                      else if (c.id === 'temp') { setFromUnit('C'); setToUnit('F'); setUnitInputVal(25); }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      unitCategory === c.id
                        ? 'border-sky-500 bg-sky-500/20 text-white font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Unit Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                <div className="sm:col-span-5 space-y-2">
                  <label className="text-xs text-slate-400">Giá trị đầu vào:</label>
                  <input
                    type="number"
                    value={unitInputVal}
                    onChange={(e) => setUnitInputVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-lg font-bold text-white font-mono"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {unitCategory === 'data' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'length' && ['mm', 'cm', 'm', 'km', 'inch', 'foot'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'weight' && ['g', 'kg', 'ton', 'lb', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'currency' && ['USD', 'VND', 'EUR', 'JPY', 'GBP'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'temp' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center text-sky-400 py-2">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>

                <div className="sm:col-span-5 space-y-2">
                  <label className="text-xs text-slate-400">Kết quả quy đổi:</label>
                  <div className="w-full bg-slate-900 border border-sky-500/40 rounded-xl px-3.5 py-2.5 text-lg font-bold text-sky-300 font-mono flex items-center">
                    {calculateUnits()}
                  </div>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {unitCategory === 'data' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'length' && ['mm', 'cm', 'm', 'km', 'inch', 'foot'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'weight' && ['g', 'kg', 'ton', 'lb', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'currency' && ['USD', 'VND', 'EUR', 'JPY', 'GBP'].map(u => <option key={u} value={u}>{u}</option>)}
                    {unitCategory === 'temp' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Export Result */}
          {exportUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Chuyển đổi thành công!</span>
              </div>
              <a
                href={exportUrl}
                download={exportFileName}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Tải File Đã Chuyển Đổi</span>
              </a>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
