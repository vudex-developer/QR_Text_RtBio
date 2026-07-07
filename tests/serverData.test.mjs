import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialDatabase,
  createJsonDatabase,
} from "../src/serverData.js";

const lead = {
  name: "Kim Hana",
  company: "RTBIO Partner",
  title: "Manager",
  phone: "010-1234-5678",
  email: "hana@example.com",
  privacyAgreed: true,
};

const answers = {
  q1: "처음 알게 됨",
  q2: "진단 장비",
  q3: "3개월 이내",
  q4: "성능",
  q5: "예",
  q6: "검토/추천",
  q7: "이메일",
  q8: "예",
  q9: "현장 안내",
  q10: "연락 바랍니다",
};

test("createInitialDatabase includes records, questions, and event settings", () => {
  const database = createInitialDatabase();

  assert.deepEqual(database.records, []);
  assert.equal(database.questions.length, 10);
  assert.equal(database.eventSettings.eventTitle, "RTBIO 현장 설문");
});

test("createJsonDatabase persists submissions and redemptions", async () => {
  const writes = [];
  const database = createJsonDatabase({
    initialData: createInitialDatabase(),
    write: async (value) => writes.push(value),
    now: () => "2026-07-07T00:00:00.000Z",
    random: () => 0.1,
  });

  const participant = await database.createSubmission(lead, answers);
  const redemption = await database.redeem(participant.completionCode, "Operator");

  assert.equal(participant.redemptionStatus, "pending");
  assert.equal(redemption.ok, true);
  assert.equal((await database.listRecords())[0].redemptionStatus, "redeemed");
  assert.equal(writes.length, 2);
});

test("createJsonDatabase stores editable questions and event settings", async () => {
  const database = createJsonDatabase({
    initialData: createInitialDatabase(),
    write: async () => {},
  });

  const questions = await database.saveQuestions([
    { id: "q1", label: "질문 1", type: "choice", options: ["예", "아니오"] },
    { id: "q2", label: "질문 2", type: "text", placeholder: "입력" },
    { id: "q3", label: "질문 3", type: "text", placeholder: "입력" },
    { id: "q4", label: "질문 4", type: "text", placeholder: "입력" },
    { id: "q5", label: "질문 5", type: "text", placeholder: "입력" },
    { id: "q6", label: "질문 6", type: "text", placeholder: "입력" },
    { id: "q7", label: "질문 7", type: "text", placeholder: "입력" },
    { id: "q8", label: "질문 8", type: "text", placeholder: "입력" },
    { id: "q9", label: "질문 9", type: "text", placeholder: "입력" },
    { id: "q10", label: "질문 10", type: "text", placeholder: "입력" },
  ]);
  const settings = await database.saveEventSettings({
    eventTitle: "행사명",
    productName: "제품명",
    surveyIntro: "설문 안내",
    completionGuide: "완료 안내",
    privacyNotice: "개인정보 안내",
  });

  assert.equal(questions[0].label, "질문 1");
  assert.equal(settings.eventTitle, "행사명");
});
