import {
  loadEventSettings,
  saveEventSettings,
} from "./eventSettings.js";
import {
  loadQuestions,
  resetQuestions,
  saveQuestions,
} from "./questionSettings.js";

const STORAGE_KEY = "rtbio-survey-records";

export function createCompletionCode(random = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(random() * alphabet.length)];
  }

  return `RTB-${suffix}`;
}

export function createMemoryStore(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const random = options.random ?? Math.random;
  let records = [...(options.initialRecords ?? [])];

  function list() {
    return records.map((record) => ({ ...record, answers: { ...record.answers } }));
  }

  function findByCode(code) {
    const normalizedCode = String(code ?? "").trim().toUpperCase();
    const record = records.find((item) => item.completionCode === normalizedCode);
    return record ? { ...record, answers: { ...record.answers } } : null;
  }

  function findDuplicates({ phone, email }) {
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);

    return {
      phone: records.some((record) => normalizePhone(record.phone) === normalizedPhone),
      email: records.some((record) => normalizeEmail(record.email) === normalizedEmail),
    };
  }

  function createSubmission(lead, answers) {
    const completionCode = nextUniqueCode(records, random);
    const timestamp = now();
    const record = {
      id: cryptoId(random),
      name: lead.name.trim(),
      company: lead.company.trim(),
      title: lead.title.trim(),
      phone: lead.phone.trim(),
      email: lead.email.trim(),
      privacyAgreed: Boolean(lead.privacyAgreed),
      completionCode,
      createdAt: timestamp,
      answers: { ...answers },
      redemptionStatus: "pending",
      redeemedAt: "",
      redeemedBy: "",
    };

    records = [record, ...records];
    return { ...record, answers: { ...record.answers } };
  }

  function redeem(code, redeemedBy) {
    const normalizedCode = String(code ?? "").trim().toUpperCase();
    const index = records.findIndex((record) => record.completionCode === normalizedCode);

    if (index === -1) {
      return { ok: false, reason: "not_found", record: null };
    }

    const record = records[index];
    if (record.redemptionStatus === "redeemed") {
      return { ok: false, reason: "already_redeemed", record: cloneRecord(record) };
    }

    const updated = {
      ...record,
      redemptionStatus: "redeemed",
      redeemedAt: now(),
      redeemedBy: String(redeemedBy || "Staff").trim(),
    };

    records = records.map((item) => (item.id === updated.id ? updated : item));
    return { ok: true, record: cloneRecord(updated) };
  }

  return {
    list,
    findByCode,
    findDuplicates,
    createSubmission,
    redeem,
  };
}

export function createLocalStore() {
  const initialRecords = readRecords();
  const memory = createMemoryStore({ initialRecords });

  function persistAndReturn(value) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory.list()));
    return value;
  }

  return {
    list: memory.list,
    findByCode: memory.findByCode,
    findDuplicates: memory.findDuplicates,
    createSubmission(lead, answers) {
      return persistAndReturn(memory.createSubmission(lead, answers));
    },
    redeem(code, redeemedBy) {
      return persistAndReturn(memory.redeem(code, redeemedBy));
    },
    exportCsv() {
      return toCsv(memory.list());
    },
    loadQuestions() {
      return loadQuestions();
    },
    saveQuestions(questions) {
      return saveQuestions(questions);
    },
    resetQuestions() {
      return resetQuestions();
    },
    loadEventSettings() {
      return loadEventSettings();
    },
    saveEventSettings(settings) {
      return saveEventSettings(settings);
    },
  };
}

export function createBrowserStore() {
  if (window.location.protocol === "file:") {
    return wrapAsyncStore(createLocalStore());
  }

  return createApiStore();
}

function createApiStore() {
  let localStore;

  function local() {
    if (!localStore) {
      localStore = wrapAsyncStore(createLocalStore());
    }

    return localStore;
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      const error = new Error(`Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
  }

  async function withFallback(action, fallback) {
    try {
      return await action();
    } catch {
      return fallback();
    }
  }

  return {
    list: () => withFallback(() => request("/api/records"), () => local().list()),
    findByCode: (code) =>
      withFallback(
        () => request(`/api/record?code=${encodeURIComponent(code)}`),
        () => local().findByCode(code),
      ),
    findDuplicates: (lead) =>
      withFallback(
        () => request("/api/duplicates", { method: "POST", body: JSON.stringify(lead) }),
        () => local().findDuplicates(lead),
      ),
    createSubmission: (lead, answers) =>
      withFallback(
        () =>
          request("/api/submissions", {
            method: "POST",
            body: JSON.stringify({ lead, answers }),
          }),
        () => local().createSubmission(lead, answers),
      ),
    redeem: (code, redeemedBy) =>
      withFallback(
        () =>
          request("/api/redemptions", {
            method: "POST",
            body: JSON.stringify({ code, redeemedBy }),
          }),
        () => local().redeem(code, redeemedBy),
      ),
    exportCsv: () => withFallback(() => request("/api/export.csv"), () => local().exportCsv()),
    loadQuestions: () => withFallback(() => request("/api/questions"), () => local().loadQuestions()),
    saveQuestions: (questions) =>
      withFallback(
        () => request("/api/questions", { method: "PUT", body: JSON.stringify(questions) }),
        () => local().saveQuestions(questions),
      ),
    resetQuestions: () =>
      withFallback(
        () => request("/api/questions/reset", { method: "POST", body: "{}" }),
        () => local().resetQuestions(),
      ),
    loadEventSettings: () =>
      withFallback(() => request("/api/event-settings"), () => local().loadEventSettings()),
    saveEventSettings: (settings) =>
      withFallback(
        () =>
          request("/api/event-settings", {
            method: "PUT",
            body: JSON.stringify(settings),
          }),
        () => local().saveEventSettings(settings),
      ),
  };
}

function wrapAsyncStore(store) {
  return {
    list: async () => store.list(),
    findByCode: async (code) => store.findByCode(code),
    findDuplicates: async (lead) => store.findDuplicates(lead),
    createSubmission: async (lead, answers) => store.createSubmission(lead, answers),
    redeem: async (code, redeemedBy) => store.redeem(code, redeemedBy),
    exportCsv: async () => store.exportCsv(),
    loadQuestions: async () => store.loadQuestions(),
    saveQuestions: async (questions) => store.saveQuestions(questions),
    resetQuestions: async () => store.resetQuestions(),
    loadEventSettings: async () => store.loadEventSettings(),
    saveEventSettings: async (settings) => store.saveEventSettings(settings),
  };
}

export function toCsv(records) {
  const headers = [
    "createdAt",
    "completionCode",
    "name",
    "company",
    "title",
    "phone",
    "email",
    "redemptionStatus",
    "redeemedAt",
    "redeemedBy",
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9",
    "q10",
  ];

  const rows = records.map((record) =>
    headers.map((header) => csvCell(record.answers?.[header] ?? record[header] ?? "")).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function nextUniqueCode(records, random) {
  let code = createCompletionCode(random);
  while (records.some((record) => record.completionCode === code)) {
    code = createCompletionCode(random);
  }
  return code;
}

function normalizePhone(phone) {
  return String(phone ?? "").replace(/\D/g, "");
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function cryptoId(random) {
  return `participant-${Date.now().toString(36)}-${Math.floor(random() * 1000000).toString(36)}`;
}

function cloneRecord(record) {
  return { ...record, answers: { ...record.answers } };
}

function readRecords() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
