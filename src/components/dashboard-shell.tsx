"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, Icon } from "@/components/ui";
import { tools } from "@/lib/tools";
import { useState } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "open" : ""}`}><div className="side-brand"><Link href="/"><Brand /></Link><button onClick={() => setOpen(false)} className="mobile-close">×</button></div><nav><p>WORKSPACE</p><Link className={pathname === "/dashboard" ? "active" : ""} href="/dashboard"><Icon name="home" /> 홈</Link><p>AI TOOLS</p>{tools.map(tool => <Link key={tool.slug} className={pathname.endsWith(tool.slug) ? "active" : ""} href={`/dashboard/${tool.slug}`}><Icon name={tool.icon} /> {tool.shortName}</Link>)}</nav><div className="side-bottom"><Link href="#"><Icon name="folder" /> 내 작업</Link><Link href="#"><Icon name="settings" /> 설정</Link><div className="credit-box"><div><span>이번 달 크레딧</span><b>680 <small>/ 1,000</small></b></div><div className="credit-track"><i /></div><Link href="#">플랜 업그레이드 <Icon name="arrow" size={14} /></Link></div><div className="profile"><span>FM</span><div><b>FlowMoa Team</b><small>team@flowmoa.ai</small></div><Icon name="more" /></div></div></aside>
    <div className="app-main"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)}>☰</button><div className="top-search"><Icon name="search" size={18} /><span>무엇이든 검색하세요</span><kbd>⌘ K</kbd></div><div className="top-actions"><button>KO <Icon name="chevron" size={12} /></button><button aria-label="도움말"><Icon name="help" /></button><button aria-label="알림" className="notification"><Icon name="bell" /><i /></button><span className="top-avatar">FM</span></div></header><main className="dashboard-content">{children}</main></div>{open && <button className="scrim" onClick={() => setOpen(false)} aria-label="메뉴 닫기" />}
  </div>;
}
