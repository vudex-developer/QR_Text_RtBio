import assert from "node:assert/strict";
import test from "node:test";

import {
  createCompletionCode,
  createMemoryStore,
  toCsv,
} from "../src/store.js";

const validLead = {
  name: "Kim Hana",
  company: "RTBIO Partner",
  title: "Manager",
  phone: "010-1234-5678",
  email: "hana@example.com",
  privacyAgreed: true,
};

const validAnswers = {
  q1: "Yes",
  q2: "Diagnostics",
  q3: "Within 3 months",
  q4: "Quality",
  q5: "Yes",
  q6: "Manager",
  q7: "Email",
  q8: "Yes",
  q9: "Expo",
  q10: "Please contact me",
};

test("createCompletionCode returns RTBIO-prefixed readable codes", () => {
  const code = createCompletionCode(() => 0.123456);

  assert.match(code, /^RTB-[A-Z0-9]{6}$/);
});

test("createMemoryStore creates a participant with pending redemption", () => {
  const store = createMemoryStore({ now: () => "2026-07-07T00:00:00.000Z" });

  const participant = store.createSubmission(validLead, validAnswers);

  assert.equal(participant.name, "Kim Hana");
  assert.equal(participant.redemptionStatus, "pending");
  assert.match(participant.completionCode, /^RTB-[A-Z0-9]{6}$/);
  assert.equal(store.list().length, 1);
});

test("createMemoryStore detects duplicate phone and email submissions", () => {
  const store = createMemoryStore();
  store.createSubmission(validLead, validAnswers);

  const duplicates = store.findDuplicates({
    phone: "010-1234-5678",
    email: "hana@example.com",
  });

  assert.deepEqual(duplicates, {
    phone: true,
    email: true,
  });
});

test("redeem marks pending records and blocks repeated redemption", () => {
  const store = createMemoryStore({ now: () => "2026-07-07T00:00:00.000Z" });
  const participant = store.createSubmission(validLead, validAnswers);

  const first = store.redeem(participant.completionCode, "Staff A");
  const second = store.redeem(participant.completionCode, "Staff B");

  assert.equal(first.ok, true);
  assert.equal(first.record.redemptionStatus, "redeemed");
  assert.equal(first.record.redeemedBy, "Staff A");
  assert.deepEqual(second, {
    ok: false,
    reason: "already_redeemed",
    record: first.record,
  });
});

test("redeem returns not_found for unknown completion codes", () => {
  const store = createMemoryStore();

  const result = store.redeem("RTB-NOCODE", "Staff A");

  assert.deepEqual(result, {
    ok: false,
    reason: "not_found",
    record: null,
  });
});

test("toCsv exports lead, answer, and redemption fields with escaping", () => {
  const store = createMemoryStore({ now: () => "2026-07-07T00:00:00.000Z" });
  const participant = store.createSubmission(
    { ...validLead, company: "ACME, Inc." },
    validAnswers,
  );
  store.redeem(participant.completionCode, "Staff A");

  const csv = toCsv(store.list());

  assert.match(csv, /"ACME, Inc\."/);
  assert.match(csv, /Kim Hana/);
  assert.match(csv, /redeemed/);
  assert.match(csv, /Please contact me/);
});
