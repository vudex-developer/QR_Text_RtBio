import { DEFAULT_SURVEY_QUESTIONS } from "./questions.js";

const QUESTIONS_KEY = "rtbio-survey-questions";

export function loadQuestions(storage = window.localStorage) {
  const saved = readSavedQuestions(storage);
  return sanitizeQuestions(saved ?? DEFAULT_SURVEY_QUESTIONS);
}

export function saveQuestions(questions, storage = window.localStorage) {
  const sanitized = sanitizeQuestions(questions);
  storage.setItem(QUESTIONS_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function resetQuestions(storage = window.localStorage) {
  storage.removeItem(QUESTIONS_KEY);
  return sanitizeQuestions(DEFAULT_SURVEY_QUESTIONS);
}

export function parseQuestionsText(text) {
  return String(text)
    .split("\n")
    .map((line, index) => parseQuestionLine(line, index))
    .filter(Boolean);
}

export function serializeQuestionsText(questions) {
  return sanitizeQuestions(questions)
    .map((question) => {
      if (question.type === "text") {
        return `${question.label} | text`;
      }
      return `${question.label} | ${question.options.join(" / ")}`;
    })
    .join("\n");
}

export function validateQuestions(questions) {
  const sanitized = sanitizeQuestions(questions);
  const errors = [];

  if (sanitized.length !== 10) {
    errors.push("설문 문항은 정확히 10개여야 합니다.");
  }

  sanitized.forEach((question, index) => {
    if (!question.label) {
      errors.push(`${index + 1}번 문항의 질문 내용을 입력해 주세요.`);
    }

    if (question.type === "choice" && question.options.length < 2) {
      errors.push(`${index + 1}번 선택형 문항은 선택지가 2개 이상 필요합니다.`);
    }
  });

  return errors;
}

function parseQuestionLine(line, index) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const [rawLabel, rawOptions = "text"] = trimmed.split("|").map((part) => part.trim());
  const id = `q${index + 1}`;

  if (rawOptions.toLowerCase() === "text") {
    return {
      id,
      label: rawLabel,
      type: "text",
      placeholder: "답변을 입력해 주세요.",
    };
  }

  return {
    id,
    label: rawLabel,
    type: "choice",
    options: rawOptions
      .split("/")
      .map((option) => option.trim())
      .filter(Boolean),
  };
}

function readSavedQuestions(storage) {
  try {
    const raw = storage.getItem(QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function sanitizeQuestions(questions) {
  return questions.slice(0, 10).map((question, index) => {
    const id = `q${index + 1}`;
    const label = String(question.label ?? "").trim();

    if (question.type === "choice") {
      return {
        id,
        label,
        type: "choice",
        options: Array.from(
          new Set((question.options ?? []).map((option) => String(option).trim()).filter(Boolean)),
        ),
      };
    }

    return {
      id,
      label,
      type: "text",
      placeholder: String(question.placeholder ?? "답변을 입력해 주세요.").trim(),
    };
  });
}
