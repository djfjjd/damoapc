export type IconName = "home" | "video" | "edit" | "store" | "receipt" | "youtube" | "sparkles" | "wand" | "send" | "check" | "arrow" | "chevron" | "more" | "play" | "search" | "bell" | "help" | "settings" | "folder" | "upload" | "clock" | "image" | "file" | "plus" | "trend";

export const tools: { slug: string; name: string; shortName: string; description: string; icon: IconName; tone: string; action: string; hint: string; accept: string }[] = [
  { slug: "shortform", name: "AI 숏폼 자동 제작", shortName: "AI 숏폼 제작", description: "주제만 입력하면 기획, 스크립트, 자막까지 완성된 숏폼을 제작합니다.", icon: "video", tone: "violet", action: "새 숏폼 만들기", hint: "영상 주제 또는 아이디어를 입력하세요", accept: "주제 입력" },
  { slug: "content", name: "블로그 · SNS 콘텐츠", shortName: "콘텐츠 생성", description: "브랜드 톤에 맞는 블로그와 소셜 콘텐츠를 채널별로 생성합니다.", icon: "edit", tone: "blue", action: "새 콘텐츠 만들기", hint: "작성할 콘텐츠의 주제를 입력하세요", accept: "주제 입력" },
  { slug: "commerce", name: "쇼핑몰 상품 등록", shortName: "상품 등록", description: "상품 이미지와 정보로 판매 문구를 만들고 여러 스토어에 등록합니다.", icon: "store", tone: "amber", action: "상품 등록 시작", hint: "상품 이미지 또는 엑셀 파일을 업로드하세요", accept: "파일 업로드" },
  { slug: "documents", name: "영수증 · 거래명세서 정리", shortName: "문서 정리", description: "증빙 문서를 인식하고 필요한 항목을 추출해 깔끔하게 분류합니다.", icon: "receipt", tone: "mint", action: "문서 정리 시작", hint: "영수증이나 거래명세서를 끌어다 놓으세요", accept: "파일 업로드" },
  { slug: "longform", name: "롱폼 → 숏폼 재가공", shortName: "롱폼 재가공", description: "긴 영상의 하이라이트를 찾아 플랫폼별 숏폼으로 자동 변환합니다.", icon: "youtube", tone: "coral", action: "영상 재가공 시작", hint: "YouTube URL을 붙여넣거나 영상을 업로드하세요", accept: "URL 또는 파일" },
];

export const recentJobs = [
  { title: "2026 마케팅 트렌드", type: "AI 숏폼", status: "완료", time: "12분 전", tone: "violet" },
  { title: "여름 신상품 소개", type: "Instagram", status: "생성 중", time: "28분 전", tone: "blue" },
  { title: "10월 거래명세서", type: "문서 정리", status: "완료", time: "1시간 전", tone: "mint" },
  { title: "오가닉 세럼 30ml", type: "상품 등록", status: "초안", time: "어제", tone: "amber" },
];
