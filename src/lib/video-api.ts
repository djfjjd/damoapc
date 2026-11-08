export type VideoInputMode = "text" | "image";
export type VideoJobStatus = "queued" | "submitting" | "processing" | "completed" | "failed";

export type VideoModel = {
  id: string;
  name: string;
  provider: string;
  durations: number[];
  resolutions: string[];
  supportsImage: boolean;
};

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  progress: number;
  prompt: string;
  inputMode: VideoInputMode;
  model: string;
  duration: number;
  resolution: string;
  aspectRatio: "9:16";
  error?: string | null;
  videoUrl?: string | null;
  downloadUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const configuredBase = process.env.NEXT_PUBLIC_VIDEO_API_URL?.replace(/\/$/, "") ?? "";

export function videoApiUrl(path: string) {
  return `${configuredBase}${path}`;
}

export function isVideoApiConfigured() {
  return Boolean(configuredBase);
}

