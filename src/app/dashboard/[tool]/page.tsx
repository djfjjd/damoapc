import { notFound } from "next/navigation";
import { Icon } from "@/components/ui";
import { ReferenceUpload } from "@/components/reference-upload";
import { CreatorAction } from "@/components/creator-action";
import { recentJobs, tools } from "@/lib/tools";

export function generateStaticParams() { return tools.map(({ slug }) => ({ tool: slug })); }

export default async function ToolPage({ params }: PageProps<"/dashboard/[tool]">) {
  const { tool: slug } = await params;
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) notFound();
  const isUpload = tool.accept.includes("파일");

  return <>
    <section className="tool-hero"><div><h1>{tool.name}</h1></div><span className="studio-state">Draft workspace</span></section>
    <div className="creator-layout"><section className="creator-card">
      <div className="creator-head"><div><h2>{tool.accept}</h2></div><span className="step-label">STEP 1 OF 2</span></div>
      {isUpload ? <div className="dropzone"><span><Icon name="upload" size={28} /></span><h3>{tool.hint}</h3><p>PNG, JPG, PDF, XLSX, MP4 · 최대 500MB</p><button className="secondary-button">내 컴퓨터에서 선택</button></div> : <><div className="idea-input"><label htmlFor="idea">콘텐츠 아이디어 <em className="required-badge">필수</em></label><textarea id="idea" required placeholder={tool.hint} /><div><span>예: 2026년 소상공인 마케팅 트렌드 5가지</span><b>0 / 1,000</b></div></div><ReferenceUpload /></>}
      <div className="creator-options"><div><label>출력 언어</label><button>한국어 <Icon name="chevron" size={14} /></button></div><div><label>브랜드 톤</label><button>전문적이고 친근하게 <Icon name="chevron" size={14} /></button></div></div>
      <CreatorAction action={tool.action} requiresPrompt={!isUpload} />
    </section><aside className="guide-card"><div className="preview-toolbar"><span>OUTPUT PREVIEW</span><em>대기 중</em></div><div className="empty-preview"><Icon name={tool.icon} size={24}/><h3>결과 미리보기</h3><p>입력과 옵션을 설정하면 생성 결과가 이곳에 표시됩니다.</p></div><div className="preview-meta"><span>Format</span><b>{slug === "content" ? "Post / Article" : slug === "documents" ? "Structured data" : slug === "commerce" ? "Product listing" : "9:16 Video"}</b><span>Language</span><b>한국어</b></div></aside></div>
    <section className="dash-section tool-recent"><div className="dash-section-head"><div><h2>최근 {tool.shortName} 작업</h2><p>이 도구로 만든 작업을 이어서 편집하세요.</p></div><button>전체 보기 <Icon name="arrow" size={15} /></button></div><div className="mini-jobs">{recentJobs.slice(0, 3).map((job) => <article key={job.title}><i className={`job-thumb ${job.tone}`}><Icon name="file" /></i><div><b>{job.title}</b><small>{job.time}</small></div><em>{job.status}</em><Icon name="more" /></article>)}</div></section>
  </>;
}
