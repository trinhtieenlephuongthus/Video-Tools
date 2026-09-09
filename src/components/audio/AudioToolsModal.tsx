import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Music, 
  Sliders, 
  Volume2, 
  Gauge, 
  Activity, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Radio, 
  Disc, 
  Combine, 
  RefreshCw, 
  CheckCircle2, 
  VolumeX,
  FileAudio,
  Sparkles,
  StopCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  decodeAudioFile, 
  extractWaveformPeaks, 
  trimAudioBuffer, 
  joinAudioBuffers, 
  reverseAudioBuffer, 
  processAudioEffects, 
  extractVocalsOrKaraoke, 
  changeAudioSpeedAndPitch, 
  audioBufferToWavBlob, 
  getAudioContext 
} from '../../utils/audioProcessing';
import { formatBytes } from '../../utils/fileCompression';

interface AudioToolsModalProps {
  initialToolId: string;
  onClose: () => void;
}

export const AudioToolsModal: React.FC<AudioToolsModalProps> = ({ initialToolId, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(initialToolId);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Tools parameters
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [volumeGain, setVolumeGain] = useState(1.0); // 0 to 3.0
  const [tempoSpeed, setTempoSpeed] = useState(1.0); // 0.5 to 2.0
  const [pitchSemitones, setPitchSemitones] = useState(0); // -12 to +12
  const [fadeInSec, setFadeInSec] = useState(1);
  const [fadeOutSec, setFadeOutSec] = useState(2);
  const [vocalMode, setVocalMode] = useState<'original' | 'instrumental' | 'vocals'>('instrumental');

  // Multi-file Joiner
  const [joinFiles, setJoinFiles] = useState<File[]>([]);

  // Text-To-Speech state
  const [ttsText, setTtsText] = useState('Chào mừng bạn đến với bộ công cụ âm thanh trực tuyến 123apps Studio!');
  const [ttsVoice, setTtsVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Processing & Export
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const joinInputRef = useRef<HTMLInputElement>(null);

  // Load Speech Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Default to Vietnamese or first voice
        const viVoice = voices.find(v => v.lang.includes('vi'));
        if (viVoice) setTtsVoice(viVoice.name);
        else if (voices.length > 0) setTtsVoice(voices[0].name);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Stop playback when unmounting or switching
  const stopPlayback = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // ignore
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  // Handle Audio File Upload
  const handleAudioSelect = async (file: File) => {
    stopPlayback();
    setAudioFile(file);
    setIsProcessing(true);
    setExportUrl(null);

    try {
      const buffer = await decodeAudioFile(file);
      setAudioBuffer(buffer);
      const peaks = extractWaveformPeaks(buffer, 120);
      setWaveformPeaks(peaks);
      setTrimStart(0);
      setTrimEnd(Math.min(buffer.duration, 30));
    } catch (err) {
      console.error(err);
      alert('Không thể giải mã file âm thanh này. Vui lòng chọn file MP3, WAV hoặc M4A hợp lệ.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate a pleasant synthetic test music if user wants a quick demo
  const loadSyntheticDemo = async () => {
    stopPlayback();
    setIsProcessing(true);
    const actx = getAudioContext();
    const durationSec = 12;
    const sampleRate = actx.sampleRate;
    const buffer = actx.createBuffer(2, durationSec * sampleRate, sampleRate);
    const chL = buffer.getChannelData(0);
    const chR = buffer.getChannelData(1);

    // Simple melodic synth chords & vocal simulation
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const noteA = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t % 1 * 2);
      const noteC = Math.sin(2 * Math.PI * 554.37 * t) * Math.exp(-t % 1 * 2);
      const noteE = Math.sin(2 * Math.PI * 659.25 * t) * Math.exp(-t % 1 * 2);
      const vocalMid = Math.sin(2 * Math.PI * 330 * t) * (Math.sin(2 * Math.PI * 4 * t) * 0.5 + 0.5); // Center vocal
      
      chL[i] = (noteA * 0.3 + noteC * 0.2 + vocalMid * 0.4) * 0.5;
      chR[i] = (noteE * 0.3 + noteC * 0.2 + vocalMid * 0.4) * 0.5;
    }

    setAudioBuffer(buffer);
    setAudioFile(new File([], 'sample_audio_demo.wav'));
    setWaveformPeaks(extractWaveformPeaks(buffer, 120));
    setTrimStart(0);
    setTrimEnd(durationSec);
    setIsProcessing(false);
  };

  // Play / Pause AudioBuffer
  const togglePlayAudio = (bufferToPlay = audioBuffer) => {
    if (!bufferToPlay) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    const actx = getAudioContext();
    const source = actx.createBufferSource();
    source.buffer = bufferToPlay;
    source.playbackRate.value = tempoSpeed;

    const gainNode = actx.createGain();
    gainNode.gain.value = volumeGain;

    source.connect(gainNode);
    gainNode.connect(actx.destination);

    source.start(0);
    audioSourceRef.current = source;
    setIsPlaying(true);
    playbackStartTimestampRef.current = actx.currentTime;

    source.onended = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    const updateTimer = () => {
      if (!audioSourceRef.current) return;
      const elapsed = (actx.currentTime - playbackStartTimestampRef.current) * tempoSpeed;
      setPlaybackTime(Math.min(bufferToPlay.duration, elapsed));
      if (elapsed < bufferToPlay.duration) {
        animFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateTimer);
  };

  // Process and Apply Current Action
  const handleProcessAction = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);
    stopPlayback();

    try {
      let finalBuffer: AudioBuffer = audioBuffer;

      // 1. Audio Cutter / Trimmer
      if (activeTab === 'audio-cutter' || activeTab === 'audio-trimmer') {
        finalBuffer = trimAudioBuffer(audioBuffer, trimStart, trimEnd);
      }
      // 2. Volume & Fade
      else if (activeTab === 'audio-volume' || activeTab === 'audio-editor') {
        finalBuffer = processAudioEffects(audioBuffer, {
          volume: volumeGain,
          fadeInSec: activeTab === 'audio-editor' ? fadeInSec : 0,
          fadeOutSec: activeTab === 'audio-editor' ? fadeOutSec : 0,
        });
      }
      // 3. Reverse Audio
      else if (activeTab === 'audio-reverse') {
        finalBuffer = reverseAudioBuffer(audioBuffer);
      }
      // 4. Karaoke / Vocal Remover
      else if (activeTab === 'audio-vocal-remover') {
        finalBuffer = extractVocalsOrKaraoke(audioBuffer, vocalMode === 'vocals' ? 'vocals' : 'instrumental');
      }
      // 5. Speed & Pitch
      else if (activeTab === 'audio-speed' || activeTab === 'audio-pitch') {
        finalBuffer = await changeAudioSpeedAndPitch(audioBuffer, tempoSpeed, pitchSemitones);
      }

      // Convert buffer to WAV blob
      const wavBlob = audioBufferToWavBlob(finalBuffer);
      const url = URL.createObjectURL(wavBlob);
      setExportUrl(url);
      setExportFileName(`123apps_${activeTab}_${Date.now()}.wav`);
      setIsProcessing(false);
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Lỗi xử lý âm thanh: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Joiner processing
  const handleJoinProcess = async () => {
    if (joinFiles.length < 2) {
      alert('Vui lòng chọn ít nhất 2 file âm thanh để nối lại!');
      return;
    }
    setIsProcessing(true);
    try {
      const decodedBuffers: AudioBuffer[] = [];
      for (const f of joinFiles) {
        decodedBuffers.push(await decodeAudioFile(f));
      }
      const combined = joinAudioBuffers(decodedBuffers);
      const wavBlob = audioBufferToWavBlob(combined);
      const url = URL.createObjectURL(wavBlob);
      setExportUrl(url);
      setExportFileName(`123apps_audio_joined_${Date.now()}.wav`);
      setIsProcessing(false);
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Lỗi khi nối file âm thanh');
    }
  };

  // Text to Speech
  const handleSpeakTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ Web Speech API.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const voiceObj = availableVoices.find(v => v.name === ttsVoice);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Voice Recording with Microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const actx = getAudioContext();
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setExportUrl(url);
        setExportFileName(`ghi_am_micro_${Date.now()}.webm`);
        stream.getTracks().forEach(t => t.stop());
        confetti({ particleCount: 40 });
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      // Animate Mic waveform
      const drawMic = () => {
        if (!micCanvasRef.current || !micAnalyserRef.current) return;
        const canvas = micCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
        micAnalyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / dataArray.length) * 2;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }

        if (mediaRecorder.state === 'recording') {
          requestAnimationFrame(drawMic);
        }
      };
      requestAnimationFrame(drawMic);

    } catch (err) {
      console.error(err);
      alert('Không thể truy cập microphone: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    setIsRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bộ Công Cụ Âm Thanh & Giọng Nói
              </h3>
              <p className="text-xs text-slate-400">
                12 tính năng: Cắt nhạc, nối nhạc, đổi tốc độ/tông giọng, đảo ngược, Text to Speech, ghi âm, tách lời Karaoke...
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

        {/* Tool Selector Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto bg-slate-950/60 border-b border-slate-800 text-xs no-scrollbar">
          {[
            { id: 'audio-cutter', label: 'Cắt Nhạc (Cutter)', icon: Music },
            { id: 'audio-vocal-remover', label: 'Karaoke / Tách Lời', icon: Disc },
            { id: 'audio-tts', label: 'Text to Speech', icon: Mic },
            { id: 'audio-recorder', label: 'Ghi Âm Micro', icon: Radio },
            { id: 'audio-joiner', label: 'Nối Nhạc (Joiner)', icon: Combine },
            { id: 'audio-volume', label: 'Tăng Âm Lượng', icon: Volume2 },
            { id: 'audio-speed', label: 'Tốc Độ (Tempo)', icon: Gauge },
            { id: 'audio-pitch', label: 'Đổi Tông (Pitch)', icon: Activity },
            { id: 'audio-reverse', label: 'Đảo Ngược Âm', icon: RotateCcw },
            { id: 'audio-editor', label: 'Biên Tập (Fade/Gain)', icon: Sliders },
            { id: 'audio-converter', label: 'Đổi Định Dạng', icon: RefreshCw },
          ].map((tool) => {
            const Icon = tool.icon;
            const isCur = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTab(tool.id); stopPlayback(); setExportUrl(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  isCur 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
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
          
          {/* SPECIAL MODE 1: TEXT TO SPEECH */}
          {activeTab === 'audio-tts' && (
            <div className="max-w-2xl mx-auto space-y-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Chuyển Đổi Văn Bản Thành Giọng Nói</h4>
                  <p className="text-xs text-slate-400">Công nghệ Text-to-Speech tự nhiên hỗ trợ tiếng Việt và quốc tế.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Nhập văn bản cần đọc:
                </label>
                <textarea
                  rows={4}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Gõ hoặc dán nội dung muốn phát âm thanh..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Giọng đọc (Voice):</label>
                  <select
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tốc độ: {ttsRate}x</label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cao độ giọng: {ttsPitch}x</label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSpeakTTS}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
              >
                {isSpeaking ? (
                  <>
                    <StopCircle className="w-5 h-5 text-rose-900" />
                    <span>Dừng Đọc</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Phát Giọng Nói Ngay</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* SPECIAL MODE 2: VOICE RECORDER */}
          {activeTab === 'audio-recorder' && (
            <div className="max-w-xl mx-auto space-y-6 text-center bg-slate-950/60 p-8 rounded-2xl border border-slate-800">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Radio className={`w-10 h-10 ${isRecording ? 'animate-pulse text-rose-400' : ''}`} />
              </div>

              <div>
                <h4 className="font-bold text-lg text-white mb-1">
                  Ghi Âm Bằng Microphone
                </h4>
                <p className="text-xs text-slate-400">
                  Ghi âm trực tiếp chất lượng phòng thu ngay trên trình duyệt mà không cần cài thêm phần mềm.
                </p>
              </div>

              {/* Live Waveform Canvas */}
              <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
                {isRecording ? (
                  <canvas ref={micCanvasRef} width={400} height={70} className="w-full h-full" />
                ) : (
                  <span className="text-xs text-slate-500">Sóng âm thanh sẽ hiển thị khi bạn bắt đầu ghi âm</span>
                )}
              </div>

              {/* Timer */}
              <div className="font-mono text-3xl font-extrabold text-white">
                {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                {(recordingSeconds % 60).toString().padStart(2, '0')}
              </div>

              {/* Record Action */}
              <div className="flex justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Bắt Đầu Ghi Âm</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-sm border border-rose-500/40 flex items-center gap-2 transition"
                  >
                    <StopCircle className="w-5 h-5 fill-current" />
                    <span>Dừng & Lưu Bản Ghi</span>
                  </button>
                )}
              </div>

              {exportUrl && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-semibold">Đã lưu bản ghi âm thành công!</span>
                  <a
                    href={exportUrl}
                    download={exportFileName}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Về File (.webm)</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* SPECIAL MODE 3: AUDIO JOINER */}
          {activeTab === 'audio-joiner' && (
            <div className="max-w-2xl mx-auto space-y-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Combine className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Ghép Nối Nhiều Bản Nhạc (Joiner)</h4>
                    <p className="text-xs text-slate-400">Gộp các file MP3/WAV thành một bản mix liên tục duy nhất.</p>
                  </div>
                </div>
                <button
                  onClick={() => joinInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  + Thêm Bài Hát
                </button>
                <input
                  ref={joinInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setJoinFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>

              {/* List of files to join */}
              <div className="space-y-2">
                {joinFiles.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-400 text-sm">
                    Chưa có bài hát nào được chọn. Hãy bấm "+ Thêm Bài Hát" để tải lên danh sách.
                  </div>
                )}
                {joinFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-white truncate max-w-sm">{file.name}</span>
                      <span className="text-xs text-slate-400">({formatBytes(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setJoinFiles(joinFiles.filter((_, i) => i !== idx))}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              {joinFiles.length > 0 && (
                <button
                  onClick={handleJoinProcess}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Combine className="w-5 h-5" />}
                  <span>Nối & Xuất File Bản Mix Hoàn Chỉnh</span>
                </button>
              )}
            </div>
          )}

          {/* STANDARD AUDIO FILE EDITING TOOLS (Cutter, Vocal Remover, Speed, Volume, Pitch, Reverse, Editor) */}
          {activeTab !== 'audio-tts' && activeTab !== 'audio-recorder' && activeTab !== 'audio-joiner' && (
            <div>
              {!audioBuffer && (
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleAudioSelect(e.target.files[0]);
                    }}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Music className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Tải lên file âm thanh để bắt đầu
                  </h4>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    Hỗ trợ định dạng MP3, WAV, M4A, FLAC, OGG, AAC với tốc độ xử lý tức thì.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn File Âm Thanh</span>
                    </button>
                    <button
                      onClick={loadSyntheticDemo}
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Thử Với Bản Nhạc Mẫu</span>
                    </button>
                  </div>
                </div>
              )}

              {audioBuffer && (
                <div className="space-y-6">
                  
                  {/* Waveform Visualizer & Playhead */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-emerald-400" />
                        <span>{audioFile?.name || 'Bản nhạc mẫu'} ({audioBuffer.duration.toFixed(1)}s)</span>
                      </span>
                      <span className="font-mono text-emerald-400">
                        {playbackTime.toFixed(1)}s / {audioBuffer.duration.toFixed(1)}s
                      </span>
                    </div>

                    {/* Waveform Graphic Bar */}
                    <div className="relative h-24 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-between px-2 gap-1 border border-slate-800 select-none">
                      {waveformPeaks.map((peak, idx) => {
                        const percent = (idx / waveformPeaks.length) * audioBuffer.duration;
                        const isPast = percent <= playbackTime;
                        const inTrimZone = (activeTab === 'audio-cutter' || activeTab === 'audio-trimmer') 
                          ? percent >= trimStart && percent <= trimEnd
                          : true;

                        return (
                          <div
                            key={idx}
                            className={`flex-1 rounded-full transition-all duration-100 ${
                              isPast ? 'bg-emerald-400' : inTrimZone ? 'bg-emerald-500/50' : 'bg-slate-700'
                            }`}
                            style={{ height: `${Math.max(10, peak * 85)}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Play / Pause & Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlayAudio()}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                          <span>{isPlaying ? 'Tạm Dừng' : 'Nghe Thử'}</span>
                        </button>
                        <span className="text-xs text-slate-400">
                          {audioBuffer.numberOfChannels} kênh • {audioBuffer.sampleRate} Hz
                        </span>
                      </div>
                      <button
                        onClick={() => { setAudioBuffer(null); setAudioFile(null); stopPlayback(); }}
                        className="text-xs text-slate-400 hover:text-rose-400"
                      >
                        Đổi file khác
                      </button>
                    </div>
                  </div>

                  {/* Specific Controls per Tool */}
                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-6">
                    
                    {/* 1. Cutter / Trimmer Controls */}
                    {(activeTab === 'audio-cutter' || activeTab === 'audio-trimmer') && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm">Khoảng Cắt Nhạc (Start & End)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Điểm bắt đầu (giây):</label>
                            <input
                              type="number"
                              step={0.1}
                              min={0}
                              max={trimEnd - 0.5}
                              value={trimStart}
                              onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Điểm kết thúc (giây):</label>
                            <input
                              type="number"
                              step={0.1}
                              min={trimStart + 0.5}
                              max={audioBuffer.duration}
                              value={trimEnd}
                              onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 1)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Độ dài đoạn cắt xuất ra: <strong className="text-emerald-400">{(trimEnd - trimStart).toFixed(1)} giây</strong>
                        </p>
                      </div>
                    )}

                    {/* 2. Vocal Remover / Karaoke */}
                    {activeTab === 'audio-vocal-remover' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Disc className="w-5 h-5 text-emerald-400" />
                          <h4 className="font-bold text-white text-sm">Chế Độ Tách Lời & Nhạc Beat</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'original', label: 'Bản gốc', desc: 'Âm thanh đầy đủ' },
                            { id: 'instrumental', label: 'Tách Beat Karaoke', desc: 'Loại bỏ giọng hát ca sĩ' },
                            { id: 'vocals', label: 'Tách Giọng Hát (Acapella)', desc: 'Giữ lại phần vocal lời hát' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setVocalMode(m.id as typeof vocalMode)}
                              className={`p-3.5 rounded-xl border text-left transition ${
                                vocalMode === m.id
                                  ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold'
                                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <div className="text-sm font-bold">{m.label}</div>
                              <div className="text-xs text-slate-400 mt-1">{m.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Speed / Tempo */}
                    {activeTab === 'audio-speed' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                          <span>Tốc độ phát (Tempo): {tempoSpeed}x</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                            <button
                              key={s}
                              onClick={() => setTempoSpeed(s)}
                              className={`py-2 rounded-xl text-xs font-semibold ${
                                tempoSpeed === s ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Pitch Changer */}
                    {activeTab === 'audio-pitch' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                          <span>Cao độ giọng (Pitch): {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} nốt bán cung (semitones)</span>
                        </label>
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={1}
                          value={pitchSemitones}
                          onChange={(e) => setPitchSemitones(parseInt(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>-12 (Trầm/Hạ 1 quãng tám)</span>
                          <span>0 (Gốc)</span>
                          <span>+12 (Bổng/Nâng 1 quãng tám)</span>
                        </div>
                      </div>
                    )}

                    {/* 5. Volume */}
                    {activeTab === 'audio-volume' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                          <span>Âm lượng khuếch đại: {Math.round(volumeGain * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={3.0}
                          step={0.1}
                          value={volumeGain}
                          onChange={(e) => setVolumeGain(parseFloat(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>0% (Tắt tiếng)</span>
                          <span>100% (Chuẩn)</span>
                          <span>300% (Kích âm cực đại)</span>
                        </div>
                      </div>
                    )}

                    {/* 6. Reverse Audio note */}
                    {activeTab === 'audio-reverse' && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                        Hiệu ứng đảo ngược sẽ lật toàn bộ sóng âm thanh từ giây cuối cùng trở về ban đầu, tạo ra chất âm huyền bí thú vị.
                      </div>
                    )}

                    {/* Action Execution Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleProcessAction}
                        disabled={isProcessing}
                        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Đang Xử Lý Âm Thanh...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            <span>Áp Dụng & Xuất File Nhạc (.wav)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Export Result */}
                    {exportUrl && (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Xuất file âm thanh thành công!</span>
                        </div>
                        <a
                          href={exportUrl}
                          download={exportFileName}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải Về Máy</span>
                        </a>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
