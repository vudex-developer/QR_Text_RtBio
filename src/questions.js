export const DEFAULT_SURVEY_QUESTIONS = [
  {
    id: "q1",
    label: "RTBIO 제품 또는 서비스를 이전에 알고 계셨나요?",
    type: "choice",
    options: ["처음 알게 됨", "이름만 알고 있음", "제품을 검토한 적 있음", "이미 사용 중"],
  },
  {
    id: "q2",
    label: "가장 관심 있는 제품군은 무엇인가요?",
    type: "choice",
    options: ["진단 장비", "시약/소모품", "자동화 솔루션", "기타"],
  },
  {
    id: "q3",
    label: "제품 도입 또는 구매 검토 시기는 언제인가요?",
    type: "choice",
    options: ["1개월 이내", "3개월 이내", "6개월 이내", "미정"],
  },
  {
    id: "q4",
    label: "제품 선택 시 가장 중요하게 보는 요소는 무엇인가요?",
    type: "choice",
    options: ["성능", "가격", "안정성", "사후 지원"],
  },
  {
    id: "q5",
    label: "현재 유사 제품을 사용 중이신가요?",
    type: "choice",
    options: ["예", "아니오", "도입 검토 중"],
  },
  {
    id: "q6",
    label: "구매 또는 도입 의사결정에 어느 정도 관여하시나요?",
    type: "choice",
    options: ["최종 결정", "검토/추천", "정보 수집", "해당 없음"],
  },
  {
    id: "q7",
    label: "후속 안내를 어떤 방식으로 받기 원하시나요?",
    type: "choice",
    options: ["이메일", "전화", "문자", "희망하지 않음"],
  },
  {
    id: "q8",
    label: "상담 또는 데모를 희망하시나요?",
    type: "choice",
    options: ["예", "아니오", "추후 검토"],
  },
  {
    id: "q9",
    label: "이번 이벤트를 알게 된 경로는 무엇인가요?",
    type: "choice",
    options: ["현장 안내", "초청장", "지인 소개", "기타"],
  },
  {
    id: "q10",
    label: "RTBIO에 남기고 싶은 문의사항이 있나요?",
    type: "text",
    placeholder: "문의사항 또는 관심 내용을 입력해 주세요.",
  },
];
