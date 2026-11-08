# FlowMoa

Next.js 정적 프런트엔드와 Cloudflare Worker 기반 AI 영상 제작 API입니다. Pages는 정적 UI를 배포하고, 별도 Worker가 D1 프로젝트/작업 상태, R2 미디어, Queues 비동기 작업을 담당합니다. FFmpeg 렌더링은 `render-service/` 컨테이너에서 수행합니다.

## 로컬 확인

```bash
npm install
cp .env.example .env.local
npm run dev
npm run dev:worker
```

`NEXT_PUBLIC_VIDEO_API_URL`에는 로컬 Worker 주소(기본 `http://localhost:8787`) 또는 배포된 Worker URL을 넣습니다. Next.js 정적 export 특성상 이 값은 Pages 빌드 시점에 필요합니다.

## Cloudflare 리소스 설정

```bash
npx wrangler d1 create flowmoa
npx wrangler r2 bucket create flowmoa-media
npx wrangler queues create flowmoa-video-jobs
npx wrangler queues create flowmoa-video-jobs-dlq
```

반환된 D1 ID와 실제 Worker URL을 `worker/wrangler.jsonc`의 `database_id`, `PUBLIC_API_URL`에 입력합니다. `ALLOWED_ORIGINS`에는 Pages 도메인과 커스텀 도메인을 쉼표로 추가합니다.

```bash
npx wrangler d1 migrations apply flowmoa --remote --config worker/wrangler.jsonc
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put RENDER_SERVICE_TOKEN --config worker/wrangler.jsonc
```

`render-service/`를 Cloud Run 등 FFmpeg 실행이 가능한 컨테이너 서비스에 배포합니다.

- `RENDER_SERVICE_TOKEN`: Worker에 저장한 값과 동일
- `PUBLIC_RENDER_URL`: 렌더 서비스의 공개 HTTPS 기본 URL
- `PORT`: 플랫폼 제공값

그 후 Worker에 렌더 서비스 URL을 Secret으로 저장하고 배포합니다.

```bash
npx wrangler secret put RENDER_SERVICE_URL --config worker/wrangler.jsonc
npm run deploy:worker
```

Google AI Studio에서 결제가 활성화된 Gemini API 키가 필요합니다. 기본 영상 모델은 `veo-3.1-fast-generate-preview`, 자료 분석 모델은 `gemini-2.5-flash`이며 Wrangler 변수로 교체할 수 있습니다.

## Pages 빌드 설정

- Build command: `npm run build`
- Build output: `out`
- Environment variable: `NEXT_PUBLIC_VIDEO_API_URL=https://<video-worker-url>`

Worker나 렌더 서비스가 설정되지 않으면 UI는 성공한 것처럼 표시하지 않고 실제 설정 오류를 보여줍니다.

## 검증

```bash
npm run lint
npm run build
npm run typecheck:worker
node --check render-service/server.mjs
```
