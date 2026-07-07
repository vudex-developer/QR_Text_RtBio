import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_EVENT_SETTINGS,
  sanitizeEventSettings,
  validateEventSettings,
} from "../src/eventSettings.js";

test("sanitizeEventSettings keeps defaults for empty values", () => {
  const settings = sanitizeEventSettings({
    eventTitle: "",
    productName: "  ",
    surveyIntro: "Updated intro",
  });

  assert.equal(settings.eventTitle, DEFAULT_EVENT_SETTINGS.eventTitle);
  assert.equal(settings.productName, DEFAULT_EVENT_SETTINGS.productName);
  assert.equal(settings.surveyIntro, "Updated intro");
});

test("validateEventSettings requires public display text", () => {
  const errors = validateEventSettings({
    eventTitle: "",
    productName: "",
    surveyIntro: "",
    completionGuide: "",
    privacyNotice: "",
  });

  assert.deepEqual(errors, [
    "행사명을 입력해 주세요.",
    "제품명을 입력해 주세요.",
    "설문 안내 문구를 입력해 주세요.",
    "완료 안내 문구를 입력해 주세요.",
    "개인정보 안내 문구를 입력해 주세요.",
  ]);
});
