"use client";
/* eslint-disable @next/next/no-img-element -- local blob previews cannot use the image optimizer */

import { useRef, useState } from "react";
import { Icon } from "@/components/ui";

type PreviewFile = { file: File; url: string };

export function ReferenceUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const media = Array.from(incoming).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    setFiles((current) => {
      const keys = new Set(current.map(({ file }) => `${file.name}-${file.size}-${file.lastModified}`));
      const added = media.filter((file) => !keys.has(`${file.name}-${file.size}-${file.lastModified}`)).map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...current, ...added];
    });
  };
  const removeFile = (index: number) => setFiles((current) => { URL.revokeObjectURL(current[index].url); return current.filter((_, itemIndex) => itemIndex !== index); });

  return <div className="reference-upload">
    <div className="reference-title"><div><b>참고 자료 첨부</b><em>선택</em></div><p>AI가 첨부한 이미지와 영상을 콘텐츠 제작에 참고하거나 활용합니다.</p></div>
    <div className={`reference-dropzone ${dragging ? "is-dragging" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple onClick={(event) => event.stopPropagation()} onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
      <span><Icon name="upload" size={20} /></span><div><b>사진 또는 동영상을 업로드하세요</b><small>여러 파일을 선택하거나 여기로 끌어다 놓을 수 있어요</small><em>JPG, PNG, WEBP, GIF, MP4, MOV · 파일당 최대 500MB</em></div><strong>파일 선택</strong>
    </div>
    {files.length > 0 && <div className="reference-files"><div className="reference-files-head"><b>첨부된 자료</b><span>{files.length}개</span></div><div className="reference-file-grid">{files.map(({ file, url }, index) => <article key={`${file.name}-${file.lastModified}`}><div className="reference-preview">{file.type.startsWith("image/") ? <img src={url} alt="" /> : <video src={url} muted preload="metadata" />}</div><div><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(file.size > 1048576 ? 1 : 2)} MB · {file.type.startsWith("image/") ? "이미지" : "동영상"}</small></div><button type="button" onClick={() => removeFile(index)} aria-label={`${file.name} 삭제`}>×</button></article>)}</div><button type="button" className="add-more-files" onClick={() => inputRef.current?.click()}><Icon name="plus" size={14} /> 자료 더 추가하기</button></div>}
  </div>;
}
