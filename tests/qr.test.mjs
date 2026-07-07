import assert from "node:assert/strict";
import test from "node:test";

import { getQrImageUrl, getSurveyUrl } from "../src/qr.js";

test("getSurveyUrl points to the survey hash route", () => {
  const url = getSurveyUrl("https://event.example.com/app/index.html");

  assert.equal(url, "https://event.example.com/app/index.html#/survey");
});

test("getQrImageUrl encodes the survey URL for QR rendering", () => {
  const url = getQrImageUrl("https://event.example.com/#/survey");

  assert.equal(
    url,
    "https://quickchart.io/qr?text=https%3A%2F%2Fevent.example.com%2F%23%2Fsurvey&size=800&margin=2",
  );
});
