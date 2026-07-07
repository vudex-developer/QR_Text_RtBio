import assert from "node:assert/strict";
import test from "node:test";

import { canAccessRole, verifyPassword } from "../src/auth.js";

test("verifyPassword accepts matching role password", () => {
  assert.equal(verifyPassword("operator", "1111"), true);
  assert.equal(verifyPassword("staff", "1111"), true);
  assert.equal(verifyPassword("admin", "1111"), true);
});

test("verifyPassword rejects wrong or unknown credentials", () => {
  assert.equal(verifyPassword("operator", "wrong"), false);
  assert.equal(verifyPassword("operator", ""), false);
  assert.equal(verifyPassword("visitor", "1111"), false);
});

test("canAccessRole uses one operator role for staff and admin tools", () => {
  assert.equal(canAccessRole("operator", "operator"), true);
  assert.equal(canAccessRole("staff", "operator"), true);
  assert.equal(canAccessRole("admin", "operator"), true);
  assert.equal(canAccessRole("", "operator"), false);
  assert.equal(canAccessRole("visitor", "operator"), false);
});
