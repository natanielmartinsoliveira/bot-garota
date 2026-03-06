export interface MediaContext {
  type: 'image' | 'video' | 'audio';
  description: string;
  mood?: string;
  heatScore?: number;
  desireScore?: number;
  nsfwLevel?: number;
  objects?: string[];
  transcript?: string;
  duration?: number;
}