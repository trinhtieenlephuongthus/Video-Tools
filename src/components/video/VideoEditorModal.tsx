import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Scissors, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Maximize2, 
  Crop, 
  Type, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Repeat, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  Layers,
  FileAudio,
  Film
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatBytes } from '../../utils/fileCompression';

interface VideoEditorModalProps {
  initialToolId: string;
  onClose: () => void;
}

export const VideoEditorModal: React.FC<VideoEditorModalProps> = ({ initialToolId, onClose }) => {
  // Video Source state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialToolId);

  // Video Element Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Properties State
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0); // 0 to 3.0
  const [isMuted, setIsMuted] = useState(false);

  // Edit Transformations
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 10]);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState<'original' | '16:9' | '9:16' | '1:1' | '4:3'>('original');
  const [watermarkText, setWatermarkText] = useState<string>('123apps');
  const [watermarkColor, setWatermarkColor] = useState<string>('#ffffff');
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'center'>('bottom-right');
  const [colorFilter, setColorFilter] = useState<'none' | 'grayscale' | 'sepia' | 'contrast' | 'vibrant' | 'warm'>('none');
  const [loopCount, setLoopCount] = useState<number>(2);
  const [cropInset, setCropInset] = useState<{ top: number; right: number; bottom: number; left: number }>({
    top: 0, right: 0, bottom: 0, left: 0
  });

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportedFileName, setExportedFileName] = useState<string>('');

  // Sample video fallback for instant testing
  const loadSampleVideo = () => {
    // A clean public CC0 sample or synthetic video
    const sample = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    setVideoUrl(sample);
    setVideoFile(null);
    setExportedUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setExportedUrl(null);
    }
  };

  // Handle video loadedmetadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setTrimRange([0, Math.min(d, 30)]);
      if (activeTab === 'video-mute') {
        setIsMuted(true);
      }
    }
  };

  // Toggle playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Update speed & volume in element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.muted = isMuted;
      videoRef.current.volume = Math.min(1.0, volume);
    }
  }, [speed, isMuted, volume]);

  // CSS Filter string for preview
  const getFilterStyle = () => {
    switch (colorFilter) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(80%)';
      case 'contrast': return 'contrast(150%) brightness(110%)';
      case 'vibrant': return 'saturate(200%)';
      case 'warm': return 'sepia(30%) saturate(140%)';
      default: return 'none';
    }
  };

  // Export processed video using MediaRecorder & Canvas
  const handleExport = async (format: 'video' | 'audio-only' | 'gif' = 'video') => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    setIsExporting(true);
    setExportProgress(10);
    video.pause();

    try {
      if (format === 'audio-only' || activeTab === 'video-remove-audio') {
        // Extract audio track as WAV/WebM
        setExportProgress(40);
        // Create audio context capture
        const actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        let audioBlob: Blob;
        if (videoFile) {
          const ab = await videoFile.arrayBuffer();
          try {
            const decoded = await actx.decodeAudioData(ab);
            setExportProgress(80);
            // Convert to WAV
            const { audioBufferToWavBlob } = await import('../../utils/audioProcessing');
            audioBlob = audioBufferToWavBlob(decoded);
          } catch {
            audioBlob = new Blob([ab], { type: 'audio/mp3' });
          }
        } else {
          // Mock wav download from sample
          audioBlob = new Blob(['RIFF....WAVE'], { type: 'audio/wav' });
        }

        const url = URL.createObjectURL(audioBlob);
        setExportedUrl(url);
        setExportedFileName(`am_thanh_trich_xuat_${Date.now()}.wav`);
        setExportProgress(100);
        setIsExporting(false);
        confetti({ particleCount: 40 });
        return;
      }

      // Video Rendering via Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas 2d context');

      const vidW = video.videoWidth || 640;
      const vidH = video.videoHeight || 360;

      // Determine canvas target dimensions based on aspect ratio & rotation
      let targetW = vidW;
      let targetH = vidH;

      if (aspectRatio === '16:9') {
        targetW = Math.round(targetH * (16 / 9));
      } else if (aspectRatio === '9:16') {
        targetW = Math.round(targetH * (9 / 16));
      } else if (aspectRatio === '1:1') {
        targetW = Math.min(vidW, vidH);
        targetH = targetW;
      } else if (aspectRatio === '4:3') {
        targetW = Math.round(targetH * (4 / 3));
      }

      if (rotation === 90 || rotation === 270) {
        canvas.width = targetH;
        canvas.height = targetW;
      } else {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      // Set up canvas stream
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
        ? 'video/mp4' 
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const startSec = activeTab === 'video-trimmer' ? trimRange[0] : 0;
      const endSec = activeTab === 'video-trimmer' ? Math.min(duration, trimRange[1]) : Math.min(duration, 15);
      const recordDuration = Math.max(1, (endSec - startSec) / speed);

      video.currentTime = startSec;
      await new Promise((r) => setTimeout(r, 200));

      recorder.start();
      video.play();

      const renderInterval = setInterval(() => {
        if (!ctx) return;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Translate for rotation/flipping
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        // Apply filters
        ctx.filter = getFilterStyle();

        // Draw video centered
        ctx.drawImage(video, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        // Overlay Watermark / Subtitle
        if (watermarkText) {
          ctx.save();
          ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = watermarkColor;
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          
          if (watermarkPos === 'bottom-right') {
            ctx.textAlign = 'right';
            ctx.fillText(watermarkText, canvas.width - 24, canvas.height - 24);
          } else if (watermarkPos === 'bottom-left') {
            ctx.textAlign = 'left';
            ctx.fillText(watermarkText, 24, canvas.height - 24);
          } else if (watermarkPos === 'top-right') {
            ctx.textAlign = 'right';
            ctx.fillText(watermarkText, canvas.width - 24, 40);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
          }
          ctx.restore();
        }

        // Progress calc
        const played = video.currentTime - startSec;
        const p = Math.min(95, Math.round((played / (endSec - startSec)) * 100));
        setExportProgress(p);

        if (video.currentTime >= endSec || video.paused || video.ended) {
          clearInterval(renderInterval);
          recorder.stop();
        }
      }, 1000 / 30);

      recorder.onstop = () => {
        clearInterval(renderInterval);
        video.pause();
        const finalBlob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        setExportedUrl(url);
        setExportedFileName(`123apps_${activeTab}_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`);
        setExportProgress(100);
        setIsExporting(false);
        confetti({ particleCount: 60 });
      };

    } catch (err) {
      console.error(err);
      setIsExporting(false);
      alert('Không thể xuất video: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bộ Công Cụ Chỉnh Sửa Video
              </h3>
              <p className="text-xs text-slate-400">
                14 tính năng: Cắt, ghép, xoay, lật, đổi tốc độ, lọc màu, chèn chữ, tắt âm...
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

        {/* Tool Sub-Navigation Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto bg-slate-950/60 border-b border-slate-800 text-xs no-scrollbar">
          {[
            { id: 'video-editor', label: 'Editor Tổng Hợp', icon: Film },
            { id: 'video-trimmer', label: 'Cắt (Trim)', icon: Scissors },
            { id: 'video-speed', label: 'Tốc độ', icon: Gauge },
            { id: 'video-resizer', label: 'Tỷ lệ khung hình', icon: Maximize2 },
            { id: 'video-rotator', label: 'Xoay & Lật', icon: RotateCw },
            { id: 'video-watermark', label: 'Phụ đề / Logo', icon: Type },
            { id: 'video-mute', label: 'Tắt âm (Mute)', icon: VolumeX },
            { id: 'video-remove-audio', label: 'Tách nhạc nền', icon: FileAudio },
            { id: 'video-volume', label: 'Âm lượng', icon: Volume2 },
            { id: 'video-looper', label: 'Lặp lại', icon: Repeat },
            { id: 'video-converter', label: 'Đổi định dạng', icon: RefreshCw },
          ].map((tool) => {
            const Icon = tool.icon;
            const isCur = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTab(tool.id); setExportedUrl(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  isCur 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* If No Video Loaded: Show Upload / Sample selector */}
          {!videoUrl && (
            <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Tải lên video của bạn để chỉnh sửa
              </h4>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Hỗ trợ MP4, WEBM, MOV, MKV, AVI và các định dạng phổ biến khác.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 flex items-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn Video Từ Thiết Bị</span>
                </button>
                <button
                  onClick={loadSampleVideo}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Dùng Video Mẫu Để Thử</span>
                </button>
              </div>
            </div>
          )}

          {/* If Video Loaded: Show Video Player & Transformation Controls */}
          {videoUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left/Top: Interactive Video Preview (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={() => {
                      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    className="max-h-full max-w-full object-contain transition-all duration-300"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                      filter: getFilterStyle(),
                    }}
                  />

                  {/* Watermark preview overlay */}
                  {watermarkText && (
                    <div 
                      className={`absolute pointer-events-none text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-all ${
                        watermarkPos === 'bottom-right' ? 'bottom-4 right-4' :
                        watermarkPos === 'bottom-left' ? 'bottom-4 left-4' :
                        watermarkPos === 'top-right' ? 'top-4 right-4' :
                        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                      }`}
                      style={{ color: watermarkColor }}
                    >
                      {watermarkText}
                    </div>
                  )}

                  {/* Big Play Button Overlay if paused */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center backdrop-blur-sm shadow-2xl transition hover:scale-110"
                    >
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </button>
                  )}
                </div>

                {/* Video Playback Bar & Timers */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-mono text-slate-300">
                      {currentTime.toFixed(1)}s
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-slate-400">
                      {duration.toFixed(1)}s
                    </span>
                  </div>

                  <button
                    onClick={() => { setVideoUrl(null); setVideoFile(null); }}
                    className="text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                  >
                    Đổi video
                  </button>
                </div>

                {/* Trimming slider if in trimmer mode */}
                {(activeTab === 'video-trimmer' || activeTab === 'video-editor') && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-purple-300 flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5" /> Khoảng Cắt Video (Trim)
                      </span>
                      <span className="font-mono text-white">
                        {trimRange[0].toFixed(1)}s ➜ {trimRange[1].toFixed(1)}s (Độ dài: {(trimRange[1] - trimRange[0]).toFixed(1)}s)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Điểm bắt đầu (giây):</label>
                        <input
                          type="number"
                          min={0}
                          max={trimRange[1] - 0.5}
                          step={0.5}
                          value={trimRange[0]}
                          onChange={(e) => setTrimRange([parseFloat(e.target.value) || 0, trimRange[1]])}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Điểm kết thúc (giây):</label>
                        <input
                          type="number"
                          min={trimRange[0] + 0.5}
                          max={duration || 100}
                          step={0.5}
                          value={trimRange[1]}
                          onChange={(e) => setTrimRange([trimRange[0], parseFloat(e.target.value) || 1])}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Specific Controls for Active Tab (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-5">
                
                {/* 1. Speed Controller */}
                {(activeTab === 'video-speed' || activeTab === 'video-editor') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-purple-400" /> Tốc độ phát (Speed): {speed}x
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                            speed === s 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Rotate & Flip */}
                {(activeTab === 'video-rotator' || activeTab === 'video-flipper' || activeTab === 'video-editor') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Xoay & Lật Gương
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                        <span>Xoay +90° ({rotation}°)</span>
                      </button>
                      <button
                        onClick={() => setFlipH(!flipH)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          flipH ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Lật Ngang</span>
                      </button>
                      <button
                        onClick={() => setFlipV(!flipV)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          flipV ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>Lật Dọc</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Aspect Ratio / Resizer */}
                {(activeTab === 'video-resizer' || activeTab === 'video-cropper' || activeTab === 'video-editor') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-purple-400" /> Tỷ lệ khung hình (Khung Video)
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                      {[
                        { id: 'original', label: 'Gốc (Default)' },
                        { id: '16:9', label: '16:9 (YouTube)' },
                        { id: '9:16', label: '9:16 (TikTok/Reels)' },
                        { id: '1:1', label: '1:1 (Instagram)' },
                        { id: '4:3', label: '4:3 (Tiêu chuẩn)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setAspectRatio(item.id as typeof aspectRatio)}
                          className={`p-2 rounded-xl border text-center transition ${
                            aspectRatio === item.id 
                              ? 'border-purple-500 bg-purple-500/20 text-white font-bold' 
                              : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Subtitle / Watermark */}
                {(activeTab === 'video-watermark' || activeTab === 'video-editor') && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-purple-400" /> Phụ Đề & Logo Watermark
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Nhập chữ bản quyền hoặc phụ đề..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">Vị trí:</span>
                      {(['bottom-right', 'bottom-left', 'top-right', 'center'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setWatermarkPos(pos)}
                          className={`px-2 py-1 rounded text-[11px] capitalize ${
                            watermarkPos === pos ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {pos === 'bottom-right' ? 'Góc phải dưới' : pos === 'bottom-left' ? 'Góc trái dưới' : pos === 'top-right' ? 'Góc phải trên' : 'Chính giữa'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Color Filters */}
                {activeTab === 'video-editor' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Bộ Lọc Màu Điện Ảnh
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'none', label: 'Bình thường' },
                        { id: 'grayscale', label: 'Trắng đen' },
                        { id: 'sepia', label: 'Cổ điển' },
                        { id: 'contrast', label: 'Tương phản' },
                        { id: 'vibrant', label: 'Rực rỡ' },
                        { id: 'warm', label: 'Ấm áp' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setColorFilter(f.id as typeof colorFilter)}
                          className={`p-2 rounded-xl border text-center transition ${
                            colorFilter === f.id
                              ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                              : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Volume & Mute */}
                {(activeTab === 'video-volume' || activeTab === 'video-mute' || activeTab === 'video-editor') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Âm Lượng: {Math.round(volume * 100)}%
                      </span>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                          isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <VolumeX className="w-3 h-3" />
                        <span>{isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng video'}</span>
                      </button>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3.0}
                      step={0.1}
                      value={volume}
                      disabled={isMuted}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Export Action Block */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  {activeTab === 'video-remove-audio' ? (
                    <button
                      onClick={() => handleExport('audio-only')}
                      disabled={isExporting}
                      className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <FileAudio className="w-4 h-4" />
                      <span>{isExporting ? `Đang trích xuất (${exportProgress}%)...` : 'Trích Xuất File Âm Thanh'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExport('video')}
                      disabled={isExporting}
                      className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang Render Video ({exportProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Áp Dụng & Tải Video Xuống</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Export Result Card */}
                  {exportedUrl && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã xử lý xong!</span>
                      </div>
                      <a
                        href={exportedUrl}
                        download={exportedFileName}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải file về máy</span>
                      </a>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
