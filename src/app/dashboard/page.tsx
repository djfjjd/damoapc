import Link from "next/link";
import { Icon } from "@/components/ui";
import { recentJobs, tools } from "@/lib/tools";

export default function Dashboard() {
  return <><section className="dash-heading"><div><p>WORKSPACE OVERVIEW</p><h1>작업 공간</h1><span>진행 중인 자동화와 최근 프로젝트를 확인하세요.</span></div><Link href="/dashboard/shortform" className="btn btn-primary"><Icon name="plus" size={16}/> 새 워크플로우</Link></section>
    <section className="metric-grid"><article><span>이번 달 실행</span><b>128</b><small>지난달 대비 <em>+18%</em></small></article><article><span>절약한 시간</span><b>42.5h</b><small>지난달 대비 <em>+6.2h</em></small></article><article><span>활성 워크플로우</span><b>8</b><small>5개 정상 실행 중</small></article><article><span>남은 크레딧</span><b>680</b><small>12월 1일 갱신</small></article></section>
    <section className="dash-section"><div className="dash-section-head"><div><h2>빠른 실행</h2><p>자주 사용하는 스튜디오에서 새 작업을 시작하세요.</p></div></div><div className="tool-grid">{tools.map(tool => <Link href={`/dashboard/${tool.slug}`} key={tool.slug} className="tool-card"><i><Icon name={tool.icon} size={18}/></i><div><h3>{tool.shortName}</h3><p>{tool.description}</p></div><Icon name="arrow" size={16}/></Link>)}</div></section>
    <section className="dash-section recent"><div className="dash-section-head"><div><h2>최근 프로젝트</h2><p>마지막으로 업데이트된 작업입니다.</p></div><span className="coming-label">전체 프로젝트 · 준비 중</span></div><div className="job-table"><div className="table-head"><span>프로젝트</span><span>유형</span><span>상태</span><span>업데이트</span></div>{recentJobs.map(job => <div className="table-row" key={job.title}><span><i className="job-icon"><Icon name="file" size={16}/></i><b>{job.title}</b></span><span>{job.type}</span><span><em className={job.status === "생성 중" ? "running" : job.status === "초안" ? "draft" : "done"}>{job.status}</em></span><span>{job.time}</span></div>)}</div></section>
  </>;
}
