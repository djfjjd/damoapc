import type { Env, JobMessage, TimelineClip } from "./types";

const models = [{ id: "veo-3.1-fast", name: "Veo 3.1 Fast", provider: "Google", durations: [4, 6, 8], resolutions: ["720p", "1080p"], supportsImage: true }];
const now = () => new Date().toISOString();
const json = (value: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

function cors(request: Request, env: Env) {
  const origin = request.headers.get("origin") || "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim());
  return { "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0] || "", "vary": "Origin", "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS", "access-control-allow-headers": "Content-Type" };
}
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."; }
function validateId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

async function getJob(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM video_jobs WHERE id = ?").bind(id).first<Record<string, unknown>>();
}
function publicJob(row: Record<string, unknown>) {
  return { id: row.id, projectId: row.project_id, status: row.status, progress: row.progress, prompt: row.prompt, inputMode: row.input_mode, model: row.model, duration: row.duration, resolution: row.resolution, aspectRatio: row.aspect_ratio, error: row.error, videoUrl: row.output_key ? `/api/video/jobs/${row.id}/content` : null, downloadUrl: row.output_key ? `/api/video/jobs/${row.id}/content?download=1` : null, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url); const path = url.pathname; const headers = cors(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (path === "/health") return json({ ok: true }, 200, headers);
  if (path === "/api/video/models" && request.method === "GET") return json({ models }, 200, headers);

  if (path === "/api/projects" && request.method === "POST") {
    const body = await request.json<Record<string, unknown>>(); const id = crypto.randomUUID(); const stamp = now();
    await env.DB.prepare("INSERT INTO video_projects (id,name,purpose,style,aspect_ratio,resolution,duration,captions,timeline_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, String(body.name || "제목 없는 영상"), String(body.purpose || "social"), String(body.style || "clean"), String(body.aspectRatio || "9:16"), String(body.resolution || "720p"), Number(body.duration || 15), body.captions ? 1 : 0, "[]", stamp, stamp).run();
    return json({ id, createdAt: stamp }, 201, headers);
  }
  const projectMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})$/i);
  if (projectMatch && request.method === "GET") {
    const project = await env.DB.prepare("SELECT * FROM video_projects WHERE id=?").bind(projectMatch[1]).first();
    if (!project) return json({ error: "프로젝트를 찾을 수 없습니다." }, 404, headers);
    const assets = await env.DB.prepare("SELECT id,name,mime_type,size,kind,duration,created_at FROM media_assets WHERE project_id=? ORDER BY created_at").bind(projectMatch[1]).all();
    return json({ project, assets: assets.results }, 200, headers);
  }
  if (projectMatch && request.method === "PUT") {
    const body = await request.json<Record<string, unknown>>(); const timeline = Array.isArray(body.timeline) ? body.timeline : [];
    await env.DB.prepare("UPDATE video_projects SET name=?,purpose=?,style=?,aspect_ratio=?,resolution=?,duration=?,captions=?,timeline_json=?,updated_at=? WHERE id=?")
      .bind(String(body.name || "제목 없는 영상"), String(body.purpose || "social"), String(body.style || "clean"), String(body.aspectRatio || "9:16"), String(body.resolution || "720p"), Number(body.duration || 15), body.captions ? 1 : 0, JSON.stringify(timeline), now(), projectMatch[1]).run();
    return json({ ok: true }, 200, headers);
  }
  const analyzeMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})\/analyze$/i);
  if (analyzeMatch && request.method === "POST") {
    if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY Secret이 설정되지 않았습니다." }, 503, headers);
    const project = await env.DB.prepare("SELECT * FROM video_projects WHERE id=?").bind(analyzeMatch[1]).first<Record<string,unknown>>();
    const assets = await env.DB.prepare("SELECT id,name,mime_type,size,r2_key,kind FROM media_assets WHERE project_id=? ORDER BY created_at").bind(analyzeMatch[1]).all<Record<string,unknown>>();
    if (!project || !assets.results.length) return json({ error: "분석할 프로젝트 파일이 없습니다." }, 400, headers);
    const parts:Array<Record<string,unknown>>=[{text:`You are a professional short-form video editor. Recommend the best sequence and edit duration for these assets. Purpose=${project.purpose}, style=${project.style}, target seconds=${project.duration}, aspect=${project.aspect_ratio}. Return JSON only: {"clips":[{"assetId":"id","duration":number,"transition":"none|dissolve|fade|slide","reason":"short Korean reason"}],"summary":"Korean summary"}. Assets: ${assets.results.map(a=>`${a.id}:${a.name}:${a.kind}`).join(", ")}`}];
    for(const asset of assets.results){if(String(asset.kind)==="image"&&Number(asset.size)<=4_000_000){const object=await env.MEDIA.get(String(asset.r2_key));if(object){const bytes=new Uint8Array(await object.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));parts.push({inlineData:{mimeType:asset.mime_type,data:btoa(binary)}});}}}
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GOOGLE_ANALYSIS_MODEL||"gemini-2.5-flash"}:generateContent`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json"}})});
    const data=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>};if(!response.ok)return json({error:"AI 미디어 분석 요청에 실패했습니다.",detail:data},502,headers);const text=data.candidates?.[0]?.content?.parts?.[0]?.text;if(!text)return json({error:"AI가 편집 구성을 반환하지 않았습니다."},502,headers);
    try{return json(JSON.parse(text),200,headers);}catch{return json({error:"AI 편집 구성 응답을 해석하지 못했습니다."},502,headers);}
  }

  const uploadMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})\/assets$/i);
  if (uploadMatch && request.method === "POST") {
    const name = decodeURIComponent(request.headers.get("x-file-name") || "upload"); const mime = request.headers.get("content-type") || "application/octet-stream";
    const allowed = /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm)|audio\/(mpeg|wav|x-m4a|mp4))$/;
    if (!allowed.test(mime)) return json({ error: "지원하지 않는 파일 형식입니다." }, 415, headers);
    if (!request.body) return json({ error: "파일 내용이 없습니다." }, 400, headers);
    const assetId = crypto.randomUUID(); const key = `projects/${uploadMatch[1]}/assets/${assetId}/${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: mime } });
    const object = await env.MEDIA.head(key); const kind = mime.split("/")[0];
    await env.DB.prepare("INSERT INTO media_assets (id,project_id,name,mime_type,size,r2_key,kind,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(assetId, uploadMatch[1], name, mime, object?.size || 0, key, kind, now()).run();
    return json({ id: assetId, name, mimeType: mime, size: object?.size || 0, kind, contentUrl: `/api/assets/${assetId}/content` }, 201, headers);
  }
  const assetMatch = path.match(/^\/api\/assets\/([0-9a-f-]{36})(?:\/content)?$/i);
  if (assetMatch && request.method === "GET") {
    const asset = await env.DB.prepare("SELECT * FROM media_assets WHERE id=?").bind(assetMatch[1]).first<Record<string, unknown>>();
    if (!asset) return json({ error: "파일을 찾을 수 없습니다." }, 404, headers);
    const object = await env.MEDIA.get(String(asset.r2_key)); if (!object) return json({ error: "저장 파일을 찾을 수 없습니다." }, 404, headers);
    const responseHeaders = new Headers(headers); object.writeHttpMetadata(responseHeaders); responseHeaders.set("etag", object.httpEtag); responseHeaders.set("accept-ranges", "bytes");
    return new Response(object.body, { headers: responseHeaders });
  }
  if (assetMatch && request.method === "DELETE") {
    const asset = await env.DB.prepare("SELECT r2_key FROM media_assets WHERE id=?").bind(assetMatch[1]).first<{r2_key:string}>();
    if (asset) await env.MEDIA.delete(asset.r2_key); await env.DB.prepare("DELETE FROM media_assets WHERE id=?").bind(assetMatch[1]).run();
    return new Response(null, { status: 204, headers });
  }

  if (path === "/api/video/jobs" && request.method === "POST") {
    const form = await request.formData(); const id = crypto.randomUUID(); const stamp = now(); const images = form.getAll("images").filter((item):item is File=>item instanceof File&&item.size>0); const inputKeys:string[]=[];
    if(images.length>4)return json({error:"참고 이미지는 최대 4장까지 업로드할 수 있습니다."},413,headers);
    for(const [index,image] of images.entries()){if(image.size>10_000_000)return json({error:`${image.name}: 이미지는 장당 10MB 이하여야 합니다.`},413,headers);if(!/^image\/(jpeg|png|webp)$/.test(image.type))return json({error:`${image.name}: 지원하지 않는 이미지 형식입니다.`},415,headers);const key=`jobs/${id}/input/${index}-${image.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;await env.MEDIA.put(key,image.stream(),{httpMetadata:{contentType:image.type}});inputKeys.push(key);}
    const prompt = String(form.get("prompt") || "").trim(); if (!prompt) return json({ error: "영상 설명을 입력해 주세요." }, 400, headers);
    await env.DB.prepare("INSERT INTO video_jobs (id,kind,status,progress,prompt,input_mode,model,duration,resolution,aspect_ratio,input_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,"generate","queued",3,prompt,String(form.get("inputMode") || "text"),String(form.get("model") || "veo-3.1-fast"),Number(form.get("duration") || 8),String(form.get("resolution") || "720p"),String(form.get("aspectRatio") || "9:16"),inputKeys.length?JSON.stringify(inputKeys):null,stamp,stamp).run();
    await env.JOBS.send({ id, action: "start-generation" }); return json(publicJob((await getJob(env,id))!), 202, headers);
  }
  if (path === "/api/render/jobs" && request.method === "POST") {
    if (!env.RENDER_SERVICE_URL || !env.RENDER_SERVICE_TOKEN) return json({ error: "FFmpeg 렌더 서비스가 설정되지 않았습니다." }, 503, headers);
    const body = await request.json<{projectId?:string}>(); if (!body.projectId || !validateId(body.projectId)) return json({ error: "올바른 프로젝트 ID가 필요합니다." }, 400, headers);
    const id=crypto.randomUUID(), stamp=now(); await env.DB.prepare("INSERT INTO video_jobs (id,project_id,kind,status,progress,created_at,updated_at) VALUES (?,?, 'render','queued',3,?,?)").bind(id,body.projectId,stamp,stamp).run();
    await env.JOBS.send({id,action:"start-render"}); return json(publicJob((await getJob(env,id))!),202,headers);
  }
  const jobMatch = path.match(/^\/api\/video\/jobs\/([0-9a-f-]{36})(?:\/content)?$/i);
  if (jobMatch) {
    const row = await getJob(env, jobMatch[1]); if (!row) return json({ error: "작업을 찾을 수 없습니다." }, 404, headers);
    if (path.endsWith("/content")) { if (!row.output_key) return json({ error: "완성 영상이 아직 없습니다." }, 409, headers); const object=await env.MEDIA.get(String(row.output_key)); if(!object) return json({error:"영상 파일을 찾을 수 없습니다."},404,headers); const h=new Headers(headers); object.writeHttpMetadata(h); if(url.searchParams.has("download")) h.set("content-disposition",`attachment; filename="flowmoa-${row.id}.mp4"`); return new Response(object.body,{headers:h}); }
    return json(publicJob(row),200,headers);
  }
  return json({ error: "경로를 찾을 수 없습니다." }, 404, headers);
}

async function update(env:Env,id:string,status:string,progress:number,extra="",values:unknown[]=[]){await env.DB.prepare(`UPDATE video_jobs SET status=?,progress=?,updated_at=?${extra} WHERE id=?`).bind(status,progress,now(),...values,id).run();}
async function callGoogle(env:Env,row:Record<string,unknown>){
  if(!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY Secret이 설정되지 않았습니다.");
  const instance:Record<string,unknown>={prompt:row.prompt}; if(row.input_key){let keys:string[];try{const parsed=JSON.parse(String(row.input_key));keys=Array.isArray(parsed)?parsed:[String(row.input_key)];}catch{keys=[String(row.input_key)];}const encoded:Array<{bytesBase64Encoded:string;mimeType:string}>=[];for(const key of keys){const object=await env.MEDIA.get(key);if(object){const bytes=new Uint8Array(await object.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));encoded.push({bytesBase64Encoded:btoa(binary),mimeType:object.httpMetadata?.contentType||"image/jpeg"});}}if(encoded[0])instance.image=encoded[0];if(encoded.length>1)instance.referenceImages=encoded.slice(1).map(image=>({image,referenceType:"asset"}));}
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GOOGLE_VIDEO_MODEL}:predictLongRunning`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({instances:[instance],parameters:{aspectRatio:row.aspect_ratio,resolution:row.resolution,durationSeconds:row.duration,sampleCount:1}})});
  const data=await response.json<Record<string,unknown>>();if(!response.ok)throw new Error(JSON.stringify(data));return String(data.name||"");
}
async function processMessage(message:Message<JobMessage>,env:Env){
  const row=await getJob(env,message.body.id);if(!row){message.ack();return;}
  try{
    if(message.body.action==="start-generation"){await update(env,String(row.id),"submitting",10);const operation=await callGoogle(env,row);await update(env,String(row.id),"processing",18,",provider_operation=?",[operation]);await env.JOBS.send({id:String(row.id),action:"poll-generation"},{delaySeconds:20});}
    else if(message.body.action==="poll-generation"){
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/${row.provider_operation}`,{headers:{"x-goog-api-key":env.GEMINI_API_KEY!}});const data=await response.json() as {done?:boolean;error?:{message?:string};response?:{generateVideoResponse?:{generatedSamples?:Array<{video?:{uri?:string}}>};generatedVideos?:Array<{video?:{uri?:string}}>}};if(!response.ok)throw new Error(JSON.stringify(data));
      if(!data.done){const progress=Math.min(90,Number(row.progress)+7);await update(env,String(row.id),"processing",progress);await env.JOBS.send({id:String(row.id),action:"poll-generation"},{delaySeconds:20});}
      else {if(data.error)throw new Error(data.error.message||"영상 생성에 실패했습니다.");const uri=data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri||data.response?.generatedVideos?.[0]?.video?.uri;if(!uri)throw new Error("영상 제공사가 결과 파일을 반환하지 않았습니다.");const video=await fetch(uri,{headers:{"x-goog-api-key":env.GEMINI_API_KEY!}});if(!video.ok||!video.body)throw new Error("완성 영상을 내려받지 못했습니다.");const key=`jobs/${row.id}/output.mp4`;await env.MEDIA.put(key,video.body,{httpMetadata:{contentType:"video/mp4"}});await update(env,String(row.id),"completed",100,",output_key=?",[key]);}}
    else if(message.body.action==="start-render"){
      const project=await env.DB.prepare("SELECT * FROM video_projects WHERE id=?").bind(row.project_id).first<Record<string,unknown>>();if(!project)throw new Error("프로젝트를 찾을 수 없습니다.");
      const timeline=JSON.parse(String(project.timeline_json||"[]")) as TimelineClip[];const apiBase=env.PUBLIC_API_URL?.replace(/\/$/,"");if(!apiBase)throw new Error("PUBLIC_API_URL이 설정되지 않았습니다.");
      const payload={jobId:row.id,project,timeline:timeline.map(c=>({...c,url:`${apiBase}/api/assets/${c.assetId}/content`}))};const response=await fetch(`${env.RENDER_SERVICE_URL}/jobs`,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${env.RENDER_SERVICE_TOKEN}`},body:JSON.stringify(payload)});const data=await response.json<{id?:string;error?:string}>();if(!response.ok)throw new Error(data.error||"렌더 요청 실패");await update(env,String(row.id),"processing",15,",provider_operation=?",[data.id]);await env.JOBS.send({id:String(row.id),action:"poll-render"},{delaySeconds:10});
    } else {const response=await fetch(`${env.RENDER_SERVICE_URL}/jobs/${row.provider_operation}`,{headers:{"authorization":`Bearer ${env.RENDER_SERVICE_TOKEN}`}});const data=await response.json() as {status:string;progress?:number;error?:string;outputUrl?:string};if(data.status==="failed")throw new Error(data.error||"렌더 실패");if(data.status!=="completed"){await update(env,String(row.id),"processing",Math.min(92,Number(data.progress||row.progress)));await env.JOBS.send({id:String(row.id),action:"poll-render"},{delaySeconds:10});}else{if(!data.outputUrl)throw new Error("렌더 결과 URL이 없습니다.");const video=await fetch(data.outputUrl,{headers:{"authorization":`Bearer ${env.RENDER_SERVICE_TOKEN}`}});if(!video.ok||!video.body)throw new Error("렌더 결과 다운로드 실패");const key=`projects/${row.project_id}/renders/${row.id}.mp4`;await env.MEDIA.put(key,video.body,{httpMetadata:{contentType:"video/mp4"}});await update(env,String(row.id),"completed",100,",output_key=?",[key]);}}
    message.ack();
  }catch(error){const attempt=Number(row.attempt||0)+1;if(attempt<5){await env.DB.prepare("UPDATE video_jobs SET attempt=?,error=?,updated_at=? WHERE id=?").bind(attempt,errorMessage(error),now(),row.id).run();message.retry({delaySeconds:Math.min(300,30*attempt)});}else{await update(env,String(row.id),"failed",Number(row.progress),",error=?",[errorMessage(error)]);message.ack();}}
}

export default { async fetch(request:Request,env:Env){try{return await router(request,env);}catch(error){return json({error:errorMessage(error)},500,cors(request,env));}}, async queue(batch:MessageBatch<JobMessage>,env:Env){for(const message of batch.messages)await processMessage(message,env);} } satisfies ExportedHandler<Env,JobMessage>;
