"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, Icon, Menu } from "@/components/ui";
import { tools } from "@/lib/tools";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "open" : ""}`}><div className="side-brand"><Link href="/"><Brand /></Link><button onClick={() => setOpen(false)} className="mobile-close" aria-label="메뉴 닫기">×</button></div><nav><p>WORKSPACE</p><Link className={pathname === "/dashboard" ? "active" : ""} href="/dashboard"><Icon name="home" /> 개요</Link><p>AUTOMATION STUDIOS</p>{tools.map(tool => <Link key={tool.slug} className={pathname.endsWith(tool.slug) ? "active" : ""} href={`/dashboard/${tool.slug}`}><Icon name={tool.icon} /> {tool.shortName}</Link>)}</nav><div className="side-bottom"><div className="disabled-nav"><Icon name="folder" /> 프로젝트 <span>준비 중</span></div><div className="disabled-nav"><Icon name="settings" /> 설정 <span>준비 중</span></div><div className="credit-box"><div><span>MONTHLY CREDITS</span><b>680 <small>/ 1,000</small></b></div><div className="credit-track"><i /></div></div><div className="profile"><span>FM</span><div><b>FlowMoa Team</b><small>Free workspace</small></div></div></div></aside>
    <div className="app-main"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="메뉴 열기"><Menu size={20}/></button><div className="top-search"><Icon name="search" size={17} /><span>검색</span><kbd>⌘ K</kbd></div><div className="top-actions"><span className="beta-label">BETA</span><button aria-label="도움말" disabled><Icon name="help" /></button><button aria-label="알림" disabled><Icon name="bell" /></button><ThemeToggle /><span className="top-avatar">FM</span></div></header><main className="dashboard-content">{children}</main></div>{open && <button className="scrim" onClick={() => setOpen(false)} aria-label="메뉴 닫기" />}
  </div>;
}
