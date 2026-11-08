export interface Env {
  DB: D1Database; MEDIA: R2Bucket; JOBS: Queue<JobMessage>;
  GEMINI_API_KEY?: string; VIDEO_PROVIDER: string; GOOGLE_VIDEO_MODEL: string; ALLOWED_ORIGINS: string;
  RENDER_SERVICE_URL?: string; RENDER_SERVICE_TOKEN?: string;
  PUBLIC_API_URL?: string;
  GOOGLE_ANALYSIS_MODEL?: string;
}
export type JobMessage = { id: string; action: "start-generation" | "poll-generation" | "start-render" | "poll-render" };
export type TimelineClip = { id: string; assetId: string; kind: string; name: string; trimStart: number; trimEnd: number; duration: number; transition: string; text?: string; volume?: number };
