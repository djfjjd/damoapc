"use client";
/* eslint-disable @next/next/no-img-element -- selected local image uses a blob URL */

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { isVideoApiConfigured, VideoInputMode, VideoJob, VideoModel, videoApiUrl } from "@/lib/video-api";
import { MediaEditor } from "@/components/video-editor";

const fallbackModels: VideoModel[] = [{ id: "veo-3.1-fast", name: "Veo 3.1 Fast", provider: "Google", durations: [4, 6, 8], resolutions: ["720p", "1080p"], supportsImage: true }];

export function ShortformStudio() {
  const [mode, setMode] = useState<VideoInputMode>("text");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<Array<{ file: File; url: string }>>([]);
  const [models, setModels] = useState(fallbackModels);
  const [model, setModel] = useState(fallbackModels[0].id);
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState("720p");
  const [job, setJob] = useState<VideoJob | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const configured = isVideoApiConfigured();

  useEffect(() => {
    if (!configured) return;
    fetch(videoApiUrl("/api/video/models"))
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<{ models: VideoModel[] }>; })
      .then(({ models: next }) => { if (next.length) { setModels(next); setModel(next[0].id); } })
      .catch(() => undefined);
  }, [configured]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed" || !configured) return;
    const jobId = job.id;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(videoApiUrl(`/api/video/jobs/${jobId}`), { cache: "no-store" });
        const data = await response.json() as VideoJob & { error?: string };
        if (!response.ok) throw new Error(data.error || "작업 상태를 확인하지 못했습니다.");
        setJob(data);
        if (data.status === "completed" || data.status === "failed") window.clearInterval(timer);
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : "작업 상태를 확인하지 못했습니다.");
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [configured, job]);

  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setImages((current) => {
      const keys = new Set(current.map(({ file }) => `${file.name}-${file.size}-${file.lastModified}`));
      const added = selected.filter((file) => !keys.has(`${file.name}-${file.size}-${file.lastModified}`)).map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...current, ...added].slice(0, 4);
    });
    event.target.value = "";
  };
  const removeImage = (index: number) => setImages((current) => { URL.revokeObjectURL(current[index].url); return current.filter((_, itemIndex) => itemIndex !== index); });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setRequestError(null);
    if (!configured) { setRequestError("영상 API 주소가 설정되지 않았습니다. NEXT_PUBLIC_VIDEO_API_URL을 설정해 주세요."); return; }
    if (!prompt.trim()) { setRequestError("영상 장면을 구체적으로 입력해 주세요."); return; }
    if (mode === "image" && !images.length) { setRequestError("영상 제작에 사용할 이미지를 선택해 주세요."); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("prompt", prompt.trim()); form.set("inputMode", mode); form.set("model", model);
      form.set("duration", String(duration)); form.set("resolution", resolution); form.set("aspectRatio", "9:16");
      images.forEach(({ file }) => form.append("images", file));
      const response = await fetch(videoApiUrl("/api/video/jobs"), { method: "POST", body: form });
      const data = await response.json() as VideoJob & { error?: string };
      if (!response.ok) throw new Error(data.error || "영상 생성 요청에 실패했습니다.");
      setJob(data);
    } catch (error) { setRequestError(error instanceof Error ? error.message : "영상 생성 요청에 실패했습니다."); }
    finally { setSubmitting(false); }
  };

  const activeModel = models.find((item) => item.id === model) ?? models[0];
  const busy = submitting || Boolean(job && !["completed", "failed"].includes(job.status));

  return <><div className="creator-layout shortform-layout">
    <form className="creator-card video-creator" onSubmit={submit}>
      <div className="creator-head"><div><span className="eyebrow">INPUT</span><h2>AI 영상 만들기</h2></div><span className="step-label">9:16 VERTICAL</span></div>
      <div className="mode-tabs" role="tablist" aria-label="영상 입력 방식">
        <button type="button" role="tab" aria-selected={mode === "text"} className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}><Icon name="edit" size={16}/> 텍스트로 생성</button>
        <button type="button" role="tab" aria-selected={mode === "image"} className={mode === "image" ? "active" : ""} onClick={() => setMode("image")}><Icon name="image" size={16}/> 이미지로 생성</button>
      </div>
      <div className="idea-input video-prompt"><label htmlFor="video-prompt">영상 장면 설명 <em className="required-badge">필수</em></label><textarea id="video-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1500} required placeholder="예: 새벽의 서울 도심, 파란 스포츠카를 따라 카메라가 낮게 이동하는 시네마틱 장면"/><div><span>카메라 움직임, 조명, 분위기를 함께 입력하면 좋아요.</span><b>{prompt.length} / 1,500</b></div></div>
      {mode === "image" && <div className="image-start"><label>참고 이미지 <em className="required-badge">필수</em> <span>{images.length} / 4</span></label><input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseImages}/>{images.length ? <><div className="image-selected-grid">{images.map(({file,url},index)=><article key={`${file.name}-${file.lastModified}`}><img src={url} alt={`선택 이미지 ${index+1}`}/><div><b>{file.name}</b><span>{(file.size/1024/1024).toFixed(1)} MB</span></div><button type="button" onClick={()=>removeImage(index)} aria-label={`${file.name} 삭제`}>×</button></article>)}</div>{images.length<4&&<button type="button" className="add-image-button" onClick={()=>inputRef.current?.click()}><Icon name="plus" size={14}/> 이미지 더 추가</button>}</> : <button type="button" className="image-picker" onClick={() => inputRef.current?.click()}><Icon name="upload" size={20}/><span><b>이미지를 여러 장 선택하세요</b><small>JPG, PNG, WEBP · 장당 최대 10MB · 최대 4장</small></span></button>}</div>}
      <div className="video-options">
        <label><span>생성 모델</span><select value={model} onChange={(event) => setModel(event.target.value)}>{models.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.provider}</option>)}</select></label>
        <label><span>영상 길이</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{activeModel.durations.map((value) => <option value={value} key={value}>{value}초</option>)}</select></label>
        <label><span>해상도</span><select value={resolution} onChange={(event) => setResolution(event.target.value)}>{activeModel.resolutions.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><span>화면 비율</span><select value="9:16" disabled><option>9:16 세로</option></select></label>
      </div>
      {requestError && <div className="video-alert error" role="alert">{requestError}</div>}
      {!configured && <div className="video-alert">배포 설정 후 활성화됩니다. 필요한 값은 프로젝트의 <code>.env.example</code>을 확인하세요.</div>}
      <button type="submit" className="btn btn-primary creator-submit" disabled={busy}><Icon name={busy ? "clock" : "sparkles"} size={17}/>{submitting ? "요청하는 중…" : busy ? "AI 영상 생성 중" : "AI 영상 생성"}<small>{resolution} · {duration}s</small></button>
    </form>
    <VideoResult job={job}/>
  </div><MediaEditor configured={configured}/></>;
}

function VideoResult({ job }: { job: VideoJob | null }) {
  if (!job) return <aside className="guide-card video-result"><div className="preview-toolbar"><span>VIDEO PREVIEW</span><em>대기 중</em></div><div className="empty-preview portrait-empty"><Icon name="video" size={26}/><h3>생성 영상 미리보기</h3><p>9:16 영상이 완성되면 이곳에서 확인하고 MP4로 다운로드할 수 있습니다.</p></div></aside>;
  const running = !["completed", "failed"].includes(job.status);
  return <aside className="guide-card video-result"><div className="preview-toolbar"><span>VIDEO PREVIEW</span><em className={job.status}>{job.status === "completed" ? "완료" : job.status === "failed" ? "오류" : "생성 중"}</em></div>
    {running && <div className="generation-progress"><div className="progress-visual"><Icon name="sparkles" size={24}/></div><h3>영상을 생성하고 있습니다</h3><p>페이지를 닫아도 서버에서 작업은 계속됩니다.</p><div className="progress-track"><i style={{ width: `${job.progress}%` }}/></div><b>{job.progress}%</b><span>{job.status === "queued" ? "작업 대기 중" : job.status === "submitting" ? "AI 모델에 요청 중" : "프레임 생성 및 저장 중"}</span></div>}
    {job.status === "failed" && <div className="result-error"><Icon name="video" size={25}/><h3>영상을 생성하지 못했습니다</h3><p>{job.error || "잠시 후 다시 시도해 주세요."}</p></div>}
    {job.status === "completed" && job.videoUrl && <div className="completed-video"><video src={videoApiUrl(job.videoUrl)} controls playsInline preload="metadata"/><div><span>{job.resolution} · {job.duration}초 · 9:16</span><a className="btn btn-primary" href={videoApiUrl(job.downloadUrl || job.videoUrl)} download><Icon name="arrow" size={16}/> MP4 다운로드</a></div></div>}
  </aside>;
}

