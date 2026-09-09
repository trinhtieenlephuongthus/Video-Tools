export type ToolCategory = 'video' | 'audio' | 'pdf' | 'converter' | 'compression';

export interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  badge?: string;
  iconName: string;
  color: string;
  bgGradient: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  statusText: string;
  error?: string;
  resultUrl?: string;
  resultFileName?: string;
  originalSize?: number;
  compressedSize?: number;
}
