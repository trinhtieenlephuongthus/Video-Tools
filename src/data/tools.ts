import { ToolItem } from '../types';

export const TOOLS_LIST: ToolItem[] = [
  // Fast Big File Compressor (Đặc biệt người dùng yêu cầu)
  {
    id: 'big-file-compressor',
    name: 'Nén File Dung Lượng Lớn Siêu Tốc',
    category: 'compression',
    description: 'Nén cực nhanh các tệp video, ảnh, tài liệu và dữ liệu lớn trực tiếp trên trình duyệt không giới hạn dung lượng.',
    badge: 'CỰC NHANH ⚡',
    iconName: 'Zap',
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/40'
  },

  // 1. CÔNG CỤ VIDEO
  {
    id: 'video-editor',
    name: 'Video Editor (Trình chỉnh sửa)',
    category: 'video',
    description: 'Cắt, ghép, xoay, lật video, thêm nhạc nền, chèn văn bản, áp dụng bộ lọc màu phong phú.',
    badge: 'Phổ biến',
    iconName: 'Film',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-trimmer',
    name: 'Video Trimmer (Cắt đoạn video)',
    category: 'video',
    description: 'Cắt bỏ những đoạn đầu, cuối hoặc trích xuất đoạn giữa video theo giây chính xác.',
    iconName: 'Scissors',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-merger',
    name: 'Video Merger (Ghép video)',
    category: 'video',
    description: 'Ghép nối nhiều đoạn video nhỏ lại thành một file video hoàn chỉnh duy nhất.',
    iconName: 'Layers',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-converter',
    name: 'Video Converter (Đổi định dạng)',
    category: 'video',
    description: 'Chuyển đổi định dạng video (MP4, WEBM, MOV, MKV, AVI, GIF...) nhanh chóng.',
    iconName: 'RefreshCw',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-looper',
    name: 'Video Looper (Lặp lại video)',
    category: 'video',
    description: 'Lặp lại một đoạn clip ngắn nhiều lần (2x, 3x, 5x...) để tạo video dài hoặc boomerang.',
    iconName: 'Repeat',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-speed',
    name: 'Change Video Speed (Tốc độ video)',
    category: 'video',
    description: 'Tăng hoặc giảm tốc độ phát của video (tua nhanh 2x-4x hoặc slow-motion 0.25x-0.75x).',
    iconName: 'Gauge',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-resizer',
    name: 'Video Resizer (Đổi khung hình)',
    category: 'video',
    description: 'Thay đổi tỷ lệ khung hình video (16:9, 9:16 TikTok/Reels, 1:1 Instagram, 4:3) vừa vặn.',
    iconName: 'Maximize2',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-cropper',
    name: 'Video Cropper (Cắt viền video)',
    category: 'video',
    description: 'Cắt bỏ phần viền thừa (crop) của khung hình với khung cắt tự do hoặc cố định.',
    iconName: 'Crop',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-rotator',
    name: 'Video Rotator (Xoay video)',
    category: 'video',
    description: 'Xoay video 90°, 180° hoặc 270° để sửa các video quay ngược hướng trên điện thoại.',
    iconName: 'RotateCw',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-flipper',
    name: 'Video Flipper (Lật gương video)',
    category: 'video',
    description: 'Lật ngược video theo chiều ngang (Horizontal Mirror) hoặc chiều dọc (Vertical Mirror).',
    iconName: 'FlipHorizontal',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-watermark',
    name: 'Add Subtitles & Watermark',
    category: 'video',
    description: 'Chèn phụ đề, đóng dấu logo thương hiệu, chèn chữ văn bản bản quyền lên video.',
    iconName: 'Type',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-mute',
    name: 'Mute Video (Tắt âm thanh)',
    category: 'video',
    description: 'Tắt và loại bỏ hoàn toàn âm thanh nền của video, giữ hình ảnh sắc nét.',
    iconName: 'VolumeX',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-remove-audio',
    name: 'Remove Audio (Trích/Tách âm thanh)',
    category: 'video',
    description: 'Tách nhạc nền ra khỏi video và tải về file âm thanh riêng biệt tiện lợi.',
    iconName: 'FileAudio',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-reverse',
    name: 'Reverse Video (Đảo ngược video)',
    category: 'video',
    description: 'Tạo hiệu ứng phát ngược video kỳ diệu từ giây cuối cùng trở về điểm bắt đầu.',
    iconName: 'Rewind',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    id: 'video-volume',
    name: 'Volume Changer (Âm lượng video)',
    category: 'video',
    description: 'Tăng cường âm lượng video bị nhỏ (lên đến 300%) hoặc giảm nhỏ tiếng ồn nền.',
    iconName: 'Volume2',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },

  // 2. CÔNG CỤ ÂM THANH
  {
    id: 'audio-cutter',
    name: 'Audio Cutter (Cắt nhạc chuông)',
    category: 'audio',
    description: 'Cắt nhạc chuông, trích đoạn bài hát yêu thích với sóng âm trực quan.',
    badge: 'Phổ biến',
    iconName: 'Music',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-joiner',
    name: 'Audio Joiner (Nối nhạc)',
    category: 'audio',
    description: 'Nối nhiều bài hát, đoạn thu âm thành một bản mix mashup liên tục mượt mà.',
    iconName: 'Combine',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-converter',
    name: 'Audio Converter (Đổi định dạng nhạc)',
    category: 'audio',
    description: 'Chuyển đổi qua lại giữa MP3, WAV, M4A, FLAC, OGG với tùy chọn chất lượng bitrate.',
    iconName: 'FileAudio2',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-editor',
    name: 'Audio Editor (Biên tập âm thanh)',
    category: 'audio',
    description: 'Chỉnh sửa dạng sóng, thêm hiệu ứng Fade in/out làm dịu đầu/cuối, lọc tiếng ồn.',
    iconName: 'Sliders',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-tts',
    name: 'Text to Speech (Văn bản thành giọng nói)',
    category: 'audio',
    description: 'Chuyển văn bản thành giọng đọc tự nhiên (tiếng Việt, tiếng Anh...), chỉnh tốc độ và cao độ.',
    badge: 'AI / Giọng đọc',
    iconName: 'Mic2',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-recorder',
    name: 'Voice Recorder (Ghi âm trực tuyến)',
    category: 'audio',
    description: 'Ghi âm trực tiếp qua microphone trình duyệt với biểu đồ sóng âm thời gian thực.',
    iconName: 'Mic',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-volume',
    name: 'Change Audio Volume (Tăng/giảm âm lượng)',
    category: 'audio',
    description: 'Tăng âm lượng bài hát bị nhỏ lên đến 300% hoặc điều chỉnh mức âm tổng thể chuẩn.',
    iconName: 'Speaker',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-speed',
    name: 'Change Audio Speed (Tốc độ phát nhạc)',
    category: 'audio',
    description: 'Thay đổi tốc độ phát (tempo) bài hát từ 0.5x đến 2.0x mà không bị méo tiếng.',
    iconName: 'FastForward',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-pitch',
    name: 'Pitch Changer (Đổi tông cao độ)',
    category: 'audio',
    description: 'Thay đổi cao độ tông giọng hát nam thành nữ, hạ tone hoặc nâng tone hát karaoke.',
    iconName: 'Activity',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-reverse',
    name: 'Reverse Audio (Đảo ngược âm thanh)',
    category: 'audio',
    description: 'Phát ngược bài hát từ cuối lên đầu để tạo âm thanh ma mị hoặc hiệu ứng đặc biệt.',
    iconName: 'RotateCcw',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-trimmer',
    name: 'Audio Trimmer (Tỉa nhạc chính xác)',
    category: 'audio',
    description: 'Cắt chuẩn xác mili-giây từng câu hát hoặc khoảng lặng thừa trong bản ghi âm.',
    iconName: 'Percent',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },
  {
    id: 'audio-vocal-remover',
    name: 'Karaoke / Vocal Remover (Tách lời)',
    category: 'audio',
    description: 'Tách phần nhạc nền (Beat/Instrumental) và giọng hát (Acapella) bằng thuật toán triệt tiêu pha.',
    badge: 'Karaoke Beat',
    iconName: 'Disc',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  },

  // 3. CÔNG CỤ PDF
  {
    id: 'pdf-split',
    name: 'Split PDF (Tách file PDF)',
    category: 'pdf',
    description: 'Tách 1 file PDF nhiều trang thành từng file nhỏ lẻ hoặc trích xuất các trang lựa chọn.',
    badge: 'Phổ biến',
    iconName: 'Split',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },
  {
    id: 'pdf-merge',
    name: 'Merge PDF (Gộp file PDF)',
    category: 'pdf',
    description: 'Gộp nhiều file PDF hoặc hình ảnh lại thành một tập tin PDF duy nhất theo thứ tự.',
    iconName: 'CopyPlus',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF (Nén dung lượng PDF)',
    category: 'pdf',
    description: 'Giảm dung lượng tài liệu PDF tối ưu để dễ dàng gửi đính kèm qua Email hay Zalo.',
    iconName: 'FileArchive',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },
  {
    id: 'pdf-converter',
    name: 'PDF Converter (Chuyển đổi PDF)',
    category: 'pdf',
    description: 'Chuyển đổi qua lại giữa PDF và Word (.doc), Excel, Text (.txt), Hình ảnh JPG/PNG.',
    iconName: 'FileText',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },
  {
    id: 'pdf-protect',
    name: 'Protect PDF (Khóa mật khẩu PDF)',
    category: 'pdf',
    description: 'Đặt mật khẩu bảo vệ tài liệu PDF, chống người lạ mở đọc hay sao chép trái phép.',
    iconName: 'Lock',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },
  {
    id: 'pdf-unlock',
    name: 'Unlock PDF (Gỡ mật khẩu PDF)',
    category: 'pdf',
    description: 'Mở khóa và gỡ bỏ mật khẩu bảo vệ khỏi file PDF khi bạn có quyền truy cập.',
    iconName: 'Unlock',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30'
  },

  // 4. TRÌNH CHUYỂN ĐỔI ĐỊNH DẠNG (CONVERTERS)
  {
    id: 'converter-video-to-mp3',
    name: 'Video sang MP3',
    category: 'converter',
    description: 'Trích xuất âm thanh chất lượng cao từ các video clip thành file nhạc MP3/WAV.',
    badge: 'Hot',
    iconName: 'FileSpreadsheet',
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-500/20 border-sky-500/30'
  },
  {
    id: 'converter-image',
    name: 'Image Converter (Đổi định dạng ảnh)',
    category: 'converter',
    description: 'Chuyển đổi qua lại giữa JPG, PNG, WEBP, ICO, GIF, BMP... kèm chỉnh kích thước và nén.',
    iconName: 'Image',
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-500/20 border-sky-500/30'
  },
  {
    id: 'converter-document',
    name: 'Document Converter (Đổi tài liệu)',
    category: 'converter',
    description: 'Chuyển đổi định dạng văn bản (Word, Markdown, HTML, Text sang PDF hoặc văn bản thô).',
    iconName: 'FileCheck',
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-500/20 border-sky-500/30'
  },
  {
    id: 'converter-units',
    name: 'Unit Converter (Chuyển đổi đơn vị)',
    category: 'converter',
    description: 'Chuyển đổi tức thời các đơn vị: Độ dài, Cân nặng, Dung lượng số (MB, GB, TB), Tiền tệ, Nhiệt độ.',
    iconName: 'Compass',
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-500/20 border-sky-500/30'
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'Tất cả công cụ', count: 32 },
  { id: 'compression', name: 'Nén File Dung Lượng Lớn ⚡', count: 1 },
  { id: 'video', name: 'Công cụ Video', count: 14 },
  { id: 'audio', name: 'Công cụ Âm thanh', count: 12 },
  { id: 'pdf', name: 'Công cụ PDF', count: 6 },
  { id: 'converter', name: 'Bộ chuyển đổi', count: 4 },
];
