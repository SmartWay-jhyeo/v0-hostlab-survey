# HostLab 지역 수요조사 프로젝트

## 시작 시 필수 작업

**세션 시작 시 ai_log 폴더 내의 모든 로그 파일을 읽어서 이전 작업 내용을 파악하세요.**

```
ai_log/
├── 2025-12-03_1545_crawling_status_feature.md
└── ... (추가 로그)
```

## 프로젝트 개요

- **프로젝트명**: HostLab 지역 수요조사
- **기술 스택**: Next.js 16, React 19, Supabase, Tailwind CSS
- **용도**: 단기임대 분석을 위한 지역 수요조사 수집

## 주요 파일 구조

```
app/
├── page.tsx              # 홈 (수요조사 폼)
└── admin/page.tsx        # 관리자 페이지

components/
├── survey-form.tsx       # 수요조사 입력 폼
├── survey-results.tsx    # 관리자 결과 대시보드
└── ui/                   # Radix UI 기반 컴포넌트

lib/
├── actions/survey.ts     # Server Actions
├── supabase/             # Supabase 클라이언트
└── region-utils.ts       # 지역 유틸리티
```

## Supabase 테이블

- `region_demand_surveys`: 수요조사 응답
- `cities`, `districts`, `neighborhoods`: 지역 계층 구조
- `crawled_regions`: 크롤링 완료 상태 관리

## 관리자 비밀번호

`hostlab2025` (클라이언트 코드에 하드코딩됨)

## 배포

main 브랜치 push 시 자동 배포 (Vercel)
