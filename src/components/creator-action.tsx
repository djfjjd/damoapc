"use client";

import { Icon } from "@/components/ui";

export function CreatorAction({ action }: { action: string; requiresPrompt: boolean }) {
  return <div className="creator-action-wrap"><button type="button" className="btn btn-primary creator-submit" disabled aria-describedby="api-status"><Icon name="sparkles" size={16}/>{action}<small>준비 중</small></button><p id="api-status" className="api-status">AI 생성 API 연결 후 사용할 수 있습니다.</p></div>;
}
