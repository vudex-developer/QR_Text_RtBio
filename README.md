# RTBIO QR Survey App

QR 기반 RTBIO 행사 설문 및 제품 지급 관리 MVP입니다.

## 실행

외부 기기와 데이터를 공유하려면 Node 서버로 실행합니다.

```bash
npm start
```

브라우저에서 `http://localhost:4175`를 엽니다.

같은 Wi-Fi의 다른 기기에서 접속하려면:

```bash
HOST=0.0.0.0 PORT=4175 npm start
```

그 다음 다른 기기에서 `http://서버IP:4175`로 접속합니다.

## 화면

- `#/` 이벤트 진입 화면
- `#/survey` 방문자 정보 입력 및 10문항 설문
- `#/complete/:code` 완료 코드 화면
- `#/qr-display` 패드용 QR 크게 보기 화면
- `#/staff` 스태프 코드 조회 및 제품 지급 처리
- `#/admin` QR 발급, 행사 문구 수정, 설문 문항 수정, 관리자 목록, CSV 다운로드

## 현장 패드 QR 화면

패드에는 아래 주소를 전체화면으로 띄웁니다.

```text
http://localhost:4173/#/qr-display
```

운영 배포 후에는 `localhost` 대신 실제 배포 도메인을 사용합니다.

```text
https://your-domain.example/#/qr-display
```

## QR 발급

관리자 화면의 `QR 발급` 영역에서 설문 URL을 확인하고 QR 이미지를 다운로드할 수 있습니다.

운영 배포 후에는 설문 URL을 실제 배포 주소로 바꿉니다.

```text
https://your-domain.example/#/survey
```

현재 QR 이미지는 QuickChart QR 이미지 URL로 생성합니다. 운영 환경에서 외부 QR 서비스 의존성을 없애려면 다음 단계에서 브라우저 내부 QR 생성 모듈로 교체합니다.

## 설문 문항 수정

관리자 화면의 `설문 문항 수정` 영역에서 10문항을 수정할 수 있습니다.

각 문항은 일반 입력 폼으로 수정합니다.

- 질문 내용 입력
- 답변 방식 선택: 선택형 또는 주관식
- 선택형일 경우 선택지 입력

문항은 정확히 10개로 유지됩니다. 저장된 문항은 브라우저 `localStorage`에 보관되고 방문자 설문에 즉시 반영됩니다.

## 행사 문구 수정

관리자 화면의 `행사 문구 수정` 영역에서 현장용 표시 문구를 바꿀 수 있습니다.

- 행사명
- 지급 제품명
- 설문 안내 문구
- 완료 화면 안내 문구
- 개인정보 안내 문구

저장된 문구는 홈, 방문자 설문, 완료 화면, 패드 QR 화면에 반영됩니다.

## 데이터

Node 서버로 실행하면 데이터는 `data/rtbio-db.json`에 저장됩니다. 같은 서버 주소로 접속한 방문자/패드/운영자 PC가 같은 데이터를 공유합니다.

단순 정적 서버나 파일로 열면 브라우저 `localStorage` 폴백으로 동작합니다. 이 경우 기기별로 데이터가 분리됩니다.

## 검증

```bash
npm test
npm run check
```

## 운영 버전 확장

- Supabase `survey_forms`, `participants`, `survey_responses`, `redemptions` 테이블 추가
- 운영자 로그인 추가
- Vercel 배포
- 배포 URL 기반 QR 인쇄

Supabase 테이블 초안은 [docs/supabase-schema.sql](./docs/supabase-schema.sql)에 있습니다.

외부팀 전달 가이드는 [EXTERNAL_HANDOFF.md](./EXTERNAL_HANDOFF.md)를 확인하세요.

## 데모 로그인

현재 MVP는 브라우저 세션 기반 현장 비밀번호로 스태프/관리자 화면을 보호합니다.

- 운영자: `1111`

운영 배포 전에는 Supabase Auth 또는 서버 측 인증으로 교체해야 합니다.
