import assert from "node:assert/strict";
import test from "node:test";

import {
  parseQuestionsText,
  serializeQuestionsText,
  validateQuestions,
} from "../src/questionSettings.js";

test("parseQuestionsText builds choice and text questions from editable lines", () => {
  const questions = parseQuestionsText(
    "관심 제품은 무엇인가요? | 장비 / 시약 / 기타\n문의사항을 적어주세요 | text",
  );

  assert.deepEqual(questions, [
    {
      id: "q1",
      label: "관심 제품은 무엇인가요?",
      type: "choice",
      options: ["장비", "시약", "기타"],
    },
    {
      id: "q2",
      label: "문의사항을 적어주세요",
      type: "text",
      placeholder: "답변을 입력해 주세요.",
    },
  ]);
});

test("validateQuestions requires exactly 10 questions", () => {
  const questions = parseQuestionsText("질문 1 | 예 / 아니오");

  assert.deepEqual(validateQuestions(questions), ["설문 문항은 정확히 10개여야 합니다."]);
});

test("serializeQuestionsText returns admin editable format", () => {
  const questions = parseQuestionsText("관심 제품은 무엇인가요? | 장비 / 시약\n문의사항 | text");

  assert.equal(
    serializeQuestionsText(questions),
    "관심 제품은 무엇인가요? | 장비 / 시약\n문의사항 | text",
  );
});
