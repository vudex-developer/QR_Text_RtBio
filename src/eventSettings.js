const EVENT_SETTINGS_KEY = "rtbio-event-settings";

export const DEFAULT_EVENT_SETTINGS = {
  eventTitle: "RTBIO 현장 설문",
  productName: "RTBIO 제품",
  surveyIntro: "방문자 정보를 입력하고 10문항 설문을 완료하면 제품 수령용 완료 코드가 발급됩니다.",
  completionGuide: "아래 완료 코드를 현장 운영자에게 보여주세요.",
  privacyNotice:
    "입력하신 개인정보는 RTBIO 이벤트 참여 확인, 제품 지급 대상 확인, 설문 분석 및 후속 상담 안내를 위해 수집됩니다. 수집 항목은 이름, 회사명, 직책, 휴대폰 번호, 이메일, 설문 응답입니다.",
};

export function loadEventSettings(storage = window.localStorage) {
  try {
    const raw = storage.getItem(EVENT_SETTINGS_KEY);
    return sanitizeEventSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_EVENT_SETTINGS };
  }
}

export function saveEventSettings(settings, storage = window.localStorage) {
  const sanitized = sanitizeEventSettings(settings);
  storage.setItem(EVENT_SETTINGS_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function sanitizeEventSettings(settings) {
  return {
    eventTitle: withDefault(settings.eventTitle, DEFAULT_EVENT_SETTINGS.eventTitle),
    productName: withDefault(settings.productName, DEFAULT_EVENT_SETTINGS.productName),
    surveyIntro: withDefault(settings.surveyIntro, DEFAULT_EVENT_SETTINGS.surveyIntro),
    completionGuide: withDefault(settings.completionGuide, DEFAULT_EVENT_SETTINGS.completionGuide),
    privacyNotice: withDefault(settings.privacyNotice, DEFAULT_EVENT_SETTINGS.privacyNotice),
  };
}

export function validateEventSettings(settings) {
  const errors = [];

  if (!String(settings.eventTitle ?? "").trim()) errors.push("행사명을 입력해 주세요.");
  if (!String(settings.productName ?? "").trim()) errors.push("제품명을 입력해 주세요.");
  if (!String(settings.surveyIntro ?? "").trim()) errors.push("설문 안내 문구를 입력해 주세요.");
  if (!String(settings.completionGuide ?? "").trim()) errors.push("완료 안내 문구를 입력해 주세요.");
  if (!String(settings.privacyNotice ?? "").trim()) errors.push("개인정보 안내 문구를 입력해 주세요.");

  return errors;
}

function withDefault(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}
