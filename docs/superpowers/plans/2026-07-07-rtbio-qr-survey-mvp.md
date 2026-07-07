# RTBIO QR Survey MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local static MVP for QR-based RTBIO lead capture, survey completion, completion-code lookup, product redemption, admin review, and CSV export.

**Architecture:** A single static app renders visitor, staff, and admin views from URL hash routes. Domain logic lives in small JavaScript modules and data persistence is isolated behind a localStorage store so it can later be swapped for Supabase.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js built-in test runner.

## Global Constraints

- No dependency install is required for the MVP.
- Visitor form must collect name, company, title, phone, email, and privacy consent.
- Survey must contain 10 questions.
- Completion code must be generated on successful submission.
- Staff must be able to search by completion code and mark redemption complete.
- Already redeemed codes must not be redeemable again.
- Admin must be able to view all submissions and export CSV.

---

### Task 1: Core Domain Logic

**Files:**
- Create: `src/questions.js`
- Create: `src/store.js`
- Test: `tests/store.test.mjs`

**Interfaces:**
- Produces: `SURVEY_QUESTIONS`, `createMemoryStore()`, `createCompletionCode()`, `toCsv(records)`

- [ ] Write tests for completion code uniqueness, record creation, redemption blocking, duplicate detection, and CSV escaping.
- [ ] Implement questions and store functions.
- [ ] Run `node --test tests/store.test.mjs`.

### Task 2: Visitor App

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.js`

**Interfaces:**
- Consumes: `SURVEY_QUESTIONS`, `createLocalStore()`
- Produces: hash routes `#/`, `#/survey`, `#/complete/:code`

- [ ] Render event landing page.
- [ ] Render lead form and 10 survey questions.
- [ ] Validate required fields and privacy agreement.
- [ ] Save submission and route to completion screen.

### Task 3: Staff and Admin Views

**Files:**
- Modify: `src/app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: store methods `findByCode`, `redeem`, `list`, `exportCsv`
- Produces: hash routes `#/staff`, `#/admin`

- [ ] Render staff code lookup.
- [ ] Block already redeemed codes.
- [ ] Render admin table.
- [ ] Add CSV download.

### Task 4: Manual Verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: local run instructions and production upgrade notes.

- [ ] Run automated tests.
- [ ] Open `index.html` in browser or serve the folder.
- [ ] Submit a sample visitor.
- [ ] Redeem the generated code in staff view.
- [ ] Confirm admin table and CSV contain the submission.
