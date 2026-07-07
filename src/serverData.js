import { DEFAULT_EVENT_SETTINGS, sanitizeEventSettings } from "./eventSettings.js";
import { DEFAULT_SURVEY_QUESTIONS } from "./questions.js";
import { sanitizeQuestions } from "./questionSettings.js";
import {
  createMemoryStore,
  toCsv,
} from "./store.js";

export function createInitialDatabase() {
  return {
    records: [],
    questions: sanitizeQuestions(DEFAULT_SURVEY_QUESTIONS),
    eventSettings: sanitizeEventSettings(DEFAULT_EVENT_SETTINGS),
  };
}

export function createJsonDatabase(options = {}) {
  let data = normalizeDatabase(options.initialData ?? createInitialDatabase());
  const write = options.write ?? (async () => {});
  const now = options.now;
  const random = options.random;

  async function persist() {
    await write(data);
  }

  function createRecordStore() {
    return createMemoryStore({
      initialRecords: data.records,
      now,
      random,
    });
  }

  return {
    async listRecords() {
      return data.records.map(cloneRecord);
    },

    async findByCode(code) {
      return createRecordStore().findByCode(code);
    },

    async createSubmission(lead, answers) {
      const store = createRecordStore();
      const record = store.createSubmission(lead, answers);
      data = { ...data, records: store.list() };
      await persist();
      return record;
    },

    async redeem(code, redeemedBy) {
      const store = createRecordStore();
      const result = store.redeem(code, redeemedBy);

      if (result.ok) {
        data = { ...data, records: store.list() };
        await persist();
      }

      return result;
    },

    async findDuplicates(lead) {
      return createRecordStore().findDuplicates(lead);
    },

    async exportCsv() {
      return toCsv(data.records);
    },

    async loadQuestions() {
      return data.questions.map(cloneQuestion);
    },

    async saveQuestions(questions) {
      data = { ...data, questions: sanitizeQuestions(questions) };
      await persist();
      return data.questions.map(cloneQuestion);
    },

    async resetQuestions() {
      data = { ...data, questions: sanitizeQuestions(DEFAULT_SURVEY_QUESTIONS) };
      await persist();
      return data.questions.map(cloneQuestion);
    },

    async loadEventSettings() {
      return { ...data.eventSettings };
    },

    async saveEventSettings(settings) {
      data = { ...data, eventSettings: sanitizeEventSettings(settings) };
      await persist();
      return { ...data.eventSettings };
    },
  };
}

function normalizeDatabase(value) {
  return {
    records: Array.isArray(value.records) ? value.records.map(cloneRecord) : [],
    questions: sanitizeQuestions(value.questions ?? DEFAULT_SURVEY_QUESTIONS),
    eventSettings: sanitizeEventSettings(value.eventSettings ?? DEFAULT_EVENT_SETTINGS),
  };
}

function cloneRecord(record) {
  return { ...record, answers: { ...record.answers } };
}

function cloneQuestion(question) {
  return question.type === "choice"
    ? { ...question, options: [...question.options] }
    : { ...question };
}
