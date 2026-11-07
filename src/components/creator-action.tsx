"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

export function CreatorAction({ action, requiresPrompt }: { action: string; requiresPrompt: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [error, setError] = useState("");

  const startCreation = () => {
    if (status === "loading") return;
    const prompt = document.querySelector<HTMLTextAreaElement>("#idea");
    if (requiresPrompt && !prompt?.value.trim()) {
      setError("콘텐츠 아이디어를 입력해 주세요.");
      prompt?.focus();
      return;
    }
    setError("");
    setStatus("loading");
    window.setTimeout(() => setStatus("ready"), 900);
  };

  return <div className="creator-action-wrap">
    <button type="button" className="primary-button creator-submit" onClick={startCreation} disabled={status === "loading"}>
      <Icon name={status === "ready" ? "check" : "sparkles"} />
      {status === "loading" ? "요청 준비 중..." : status === "ready" ? "생성 요청 준비 완료" : action}
      {status === "idle" && <small>10 credits</small>}
    </button>
    {error && <p className="creator-error" role="alert">{error}</p>}
    {status === "ready" && <div className="creator-ready" role="status"><Icon name="check" size={15} /><div><b>입력 자료가 준비되었습니다.</b><span>AI 생성 API가 연결되면 이 요청으로 바로 제작을 시작합니다.</span></div></div>}
  </div>;
}
