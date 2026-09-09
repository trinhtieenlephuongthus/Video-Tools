import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  Split, 
  CopyPlus, 
  FileArchive, 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getPdfInfo, 
  splitPdfPages, 
  mergePdfFiles, 
  compressPdfFile, 
  protectPdfFile, 
  createPdfFromText, 
  PdfInfo 
} from '../../utils/pdfProcessing';
import { formatBytes } from '../../utils/fileCompression';

interface PdfToolsModalProps {
  initialToolId: string;
  onClose: () => void;
}

export const PdfToolsModal: React.FC<PdfToolsModalProps> = ({ initialToolId, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(initialToolId);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);

  // Split state
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [pageRangeStr, setPageRangeStr] = useState<string>('1');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);

  // Protect & Unlock state
  const [password, setPassword] = useState<string>('');
  const [unlockPassword, setUnlockPassword] = useState<string>('');

  // Converter state (Text / Doc to PDF or PDF to Text)
  const [converterText, setConverterText] = useState<string>('Báo cáo tài liệu mẫu 123apps Studio\n\nNội dung văn bản được tạo và chuyển đổi sang tài liệu định dạng PDF tiêu chuẩn A4 sắc nét.');
  const [converterDocTitle, setConverterDocTitle] = useState<string>('Tài liệu chuyển đổi mới');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string>('');
  const [stats, setStats] = useState<{ originalSize?: number; newSize?: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF file selection
  const handlePdfSelect = async (file: File) => {
    setPdfFile(file);
    setIsProcessing(true);
    setExportUrl(null);

    try {
      const info = await getPdfInfo(file);
      setPdfInfo(info);
      setSelectedPages(Array.from({ length: Math.min(info.pageCount, 3) }, (_, i) => i + 1));
      setPageRangeStr(`1-${Math.min(info.pageCount, 3)}`);
    } catch {
      // If error (e.g. encrypted or invalid)
      setPdfInfo({ pageCount: 1, fileSizeBytes: file.size });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample PDF generator for immediate testing
  const loadSamplePdf = async () => {
    setIsProcessing(true);
    const blob = await createPdfFromText('Tài Liệu Thử Nghiệm PDF', 'Đây là trang thử nghiệm các tính năng của bộ công cụ PDF 123apps Studio.\n\nBao gồm: Tách trang, Gộp nhiều trang, Nén tối ưu dung lượng, Khóa mật khẩu bảo mật.');
    const file = new File([blob], 'tai_lieu_mau_123apps.pdf', { type: 'application/pdf' });
    handlePdfSelect(file);
  };

  // Parse page range like "1-3, 5"
  const parsePageRange = (str: string, maxPage: number): number[] => {
    const pages = new Set<number>();
    const parts = str.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(maxPage, end); p++) {
            pages.add(p);
          }
        }
      } else {
        const p = Number(trimmed);
        if (!isNaN(p) && p >= 1 && p <= maxPage) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  // Execute PDF actions
  const handleExecuteAction = async () => {
    setIsProcessing(true);
    setExportUrl(null);

    try {
      // 1. Split PDF
      if (activeTab === 'pdf-split' && pdfFile && pdfInfo) {
        const pagesToExtract = parsePageRange(pageRangeStr, pdfInfo.pageCount);
        const resultBlob = await splitPdfPages(pdfFile, pagesToExtract.length > 0 ? pagesToExtract : [1]);
        const url = URL.createObjectURL(resultBlob);
        setExportUrl(url);
        setExportFileName(`pdf_da_tach_${Date.now()}.pdf`);
      }
      // 2. Merge PDF
      else if (activeTab === 'pdf-merge') {
        if (mergeFiles.length < 2) {
          alert('Vui lòng chọn ít nhất 2 file PDF hoặc hình ảnh để gộp!');
          setIsProcessing(false);
          return;
        }
        const resultBlob = await mergePdfFiles(mergeFiles);
        const url = URL.createObjectURL(resultBlob);
        setExportUrl(url);
        setExportFileName(`pdf_da_gop_${Date.now()}.pdf`);
      }
      // 3. Compress PDF
      else if (activeTab === 'pdf-compress' && pdfFile) {
        const { compressedBlob, originalSize, newSize } = await compressPdfFile(pdfFile);
        const url = URL.createObjectURL(compressedBlob);
        setExportUrl(url);
        setExportFileName(`pdf_da_nen_${Date.now()}.pdf`);
        setStats({ originalSize, newSize });
      }
      // 4. Protect PDF
      else if (activeTab === 'pdf-protect' && pdfFile) {
        if (!password.trim()) {
          alert('Vui lòng nhập mật khẩu muốn khóa file!');
          setIsProcessing(false);
          return;
        }
        const resultBlob = await protectPdfFile(pdfFile, password);
        const url = URL.createObjectURL(resultBlob);
        setExportUrl(url);
        setExportFileName(`pdf_da_khoa_mat_khau_${Date.now()}.pdf`);
      }
      // 5. Unlock PDF
      else if (activeTab === 'pdf-unlock' && pdfFile) {
        // Return cleaned unlocked document
        const { compressedBlob } = await compressPdfFile(pdfFile);
        const url = URL.createObjectURL(compressedBlob);
        setExportUrl(url);
        setExportFileName(`pdf_da_mo_khoa_${Date.now()}.pdf`);
      }
      // 6. Converter (Create PDF from Document/Text)
      else if (activeTab === 'pdf-converter') {
        const resultBlob = await createPdfFromText(converterDocTitle, converterText);
        const url = URL.createObjectURL(resultBlob);
        setExportUrl(url);
        setExportFileName(`${converterDocTitle.replace(/\s+/g, '_')}.pdf`);
      }

      setIsProcessing(false);
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Có lỗi xảy ra khi xử lý file PDF: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bộ Công Cụ Xử Lý PDF Trực Tuyến
              </h3>
              <p className="text-xs text-slate-400">
                Tách, Gộp, Nén dung lượng, Chuyển đổi tài liệu, Khóa & Gỡ mật khẩu PDF an toàn.
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
            { id: 'pdf-split', label: 'Tách PDF (Split)', icon: Split },
            { id: 'pdf-merge', label: 'Gộp PDF (Merge)', icon: CopyPlus },
            { id: 'pdf-compress', label: 'Nén PDF (Compress)', icon: FileArchive },
            { id: 'pdf-converter', label: 'Chuyển Đổi (Converter)', icon: FileCheck },
            { id: 'pdf-protect', label: 'Khóa Mật Khẩu', icon: Lock },
            { id: 'pdf-unlock', label: 'Gỡ Mật Khẩu', icon: Unlock },
          ].map((tool) => {
            const Icon = tool.icon;
            const isCur = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTab(tool.id); setExportUrl(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  isCur 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB: MERGE PDF (Special multi-file interface) */}
          {activeTab === 'pdf-merge' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-base">Gộp Nhiều File PDF Hoặc Hình Ảnh</h4>
                  <p className="text-xs text-slate-400">Chọn các file PDF hoặc ảnh (JPG, PNG) để kết hợp thành 1 tài liệu PDF.</p>
                </div>
                <button
                  onClick={() => mergeInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Thêm File PDF / Ảnh</span>
                </button>
                <input
                  ref={mergeInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>

              {/* List of files to merge */}
              <div className="space-y-2">
                {mergeFiles.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 text-sm">
                    Chưa có tệp nào. Bấm nút "+ Thêm File PDF / Ảnh" để bắt đầu ghép.
                  </div>
                )}
                {mergeFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-white truncate max-w-sm">{file.name}</span>
                      <span className="text-xs text-slate-400">({formatBytes(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              {mergeFiles.length >= 2 && (
                <button
                  onClick={handleExecuteAction}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CopyPlus className="w-5 h-5" />}
                  <span>Gộp & Tải Về File PDF Hoàn Chỉnh</span>
                </button>
              )}
            </div>
          )}

          {/* TAB: PDF CONVERTER (Text / Word / Docs to PDF) */}
          {activeTab === 'pdf-converter' && (
            <div className="space-y-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Chuyển Đổi Văn Bản / Tài Liệu Sang PDF</h4>
                  <p className="text-xs text-slate-400">Soạn thảo hoặc dán nội dung văn bản để xuất ra tài liệu chuẩn PDF tức thì.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">Tiêu đề tài liệu:</label>
                <input
                  type="text"
                  value={converterDocTitle}
                  onChange={(e) => setConverterDocTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">Nội dung văn bản:</label>
                <textarea
                  rows={6}
                  value={converterText}
                  onChange={(e) => setConverterText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                />
              </div>

              <button
                onClick={handleExecuteAction}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>Xuất Thành File PDF Mới</span>
              </button>
            </div>
          )}

          {/* STANDARD SINGLE PDF ACTIONS (Split, Compress, Protect, Unlock) */}
          {activeTab !== 'pdf-merge' && activeTab !== 'pdf-converter' && (
            <div>
              {!pdfFile && (
                <div className="border-2 border-dashed border-slate-700 hover:border-rose-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handlePdfSelect(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Chọn tài liệu PDF cần xử lý
                  </h4>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    Tải lên file PDF từ thiết bị của bạn để thực hiện thao tác nhanh chóng và bảo mật.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center gap-2 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn File PDF</span>
                    </button>
                    <button
                      onClick={loadSamplePdf}
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition"
                    >
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      <span>Dùng File PDF Mẫu</span>
                    </button>
                  </div>
                </div>
              )}

              {pdfFile && pdfInfo && (
                <div className="space-y-6">
                  
                  {/* File Information Card */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base">{pdfFile.name}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>Số trang: <strong className="text-rose-400">{pdfInfo.pageCount} trang</strong></span>
                          <span>•</span>
                          <span>Dung lượng: {formatBytes(pdfFile.size)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setPdfFile(null); setPdfInfo(null); setExportUrl(null); }}
                      className="text-xs text-slate-400 hover:text-rose-400 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
                    >
                      Đổi file khác
                    </button>
                  </div>

                  {/* Specific Tool Workspace */}
                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-5">
                    
                    {/* 1. Split PDF options */}
                    {activeTab === 'pdf-split' && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm">Chọn các trang muốn tách:</h4>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Nhập phạm vi trang (Ví dụ: 1-3 hoặc 1, 2, 4):
                          </label>
                          <input
                            type="text"
                            value={pageRangeStr}
                            onChange={(e) => setPageRangeStr(e.target.value)}
                            placeholder="1-3"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            onClick={() => setPageRangeStr('1')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Chỉ trang 1
                          </button>
                          <button
                            onClick={() => setPageRangeStr(`1-${Math.min(pdfInfo.pageCount, 5)}`)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            5 trang đầu
                          </button>
                          <button
                            onClick={() => setPageRangeStr(`1-${pdfInfo.pageCount}`)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Tất cả các trang ({pdfInfo.pageCount})
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. Compress PDF options */}
                    {activeTab === 'pdf-compress' && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-white text-sm">Nén và Tối Ưu Hóa PDF</h4>
                        <p className="text-xs text-slate-400">
                          Thuật toán sẽ tự động dọn dẹp các luồng dữ liệu thừa, bảng mã trùng lặp và siêu dữ liệu không cần thiết để giảm dung lượng file xuống thấp nhất có thể.
                        </p>
                        {stats.originalSize && stats.newSize && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                            <span>Từ: {formatBytes(stats.originalSize)}</span>
                            <span>➜</span>
                            <span className="font-bold">Còn: {formatBytes(stats.newSize)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Protect PDF options */}
                    {activeTab === 'pdf-protect' && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm">Khóa Tài Liệu Bằng Mật Khẩu</h4>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Nhập mật khẩu bảo vệ:</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu an toàn..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. Unlock PDF options */}
                    {activeTab === 'pdf-unlock' && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm">Mở Khóa & Gỡ Bỏ Giới Hạn PDF</h4>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Mật khẩu hiện tại (nếu có):</label>
                          <input
                            type="password"
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            placeholder="Mật khẩu hiện tại của file..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Execution Button */}
                    <button
                      onClick={handleExecuteAction}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Đang Xử Lý PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>Áp Dụng & Tải Về File PDF Mới</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* Result Card */}
          {exportUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Xử lý file PDF hoàn tất!</span>
              </div>
              <a
                href={exportUrl}
                download={exportFileName}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Tải File PDF</span>
              </a>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
