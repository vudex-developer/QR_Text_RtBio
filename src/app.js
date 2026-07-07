import {
  canAccessRole,
  getCurrentRole,
  signIn,
  signOut,
} from "./auth.js";
import {
  DEFAULT_EVENT_SETTINGS,
  validateEventSettings,
} from "./eventSettings.js";
import {
  validateQuestions,
} from "./questionSettings.js";
import { DEFAULT_SURVEY_QUESTIONS } from "./questions.js";
import { getQrImageUrl, getSurveyUrl } from "./qr.js";
import { createBrowserStore } from "./store.js";

const app = document.querySelector("#app");
const store = createBrowserStore();
let surveyQuestions = DEFAULT_SURVEY_QUESTIONS;
let eventSettings = DEFAULT_EVENT_SETTINGS;

window.addEventListener("hashchange", () => {
  void render();
});
void initialize();

async function initialize() {
  surveyQuestions = await store.loadQuestions();
  eventSettings = await store.loadEventSettings();
  await render();
}

async function render() {
  const route = window.location.hash || "#/";
  const [path, code] = route.replace("#", "").split("/").filter(Boolean);

  if (!path) {
    renderHome();
    return;
  }

  if (path === "survey") {
    renderSurvey();
    return;
  }

  if (path === "complete") {
    await renderComplete(code);
    return;
  }

  if (path === "staff") {
    if (!requireRole("operator")) return;
    renderStaff();
    return;
  }

  if (path === "qr-display") {
    renderQrDisplay();
    return;
  }

  if (path === "admin") {
    if (!requireRole("operator")) return;
    await renderAdmin();
    return;
  }

  renderHome();
}

function renderHome() {
  const surveyUrl = getSurveyUrl(window.location.href);
  const qrUrl = getQrImageUrl(surveyUrl);

  app.innerHTML = `
    <section class="hero">
      <div>
        <h1>${escapeHtml(eventSettings.eventTitle)}</h1>
        <p class="lead">
          ${escapeHtml(eventSettings.surveyIntro)}
          스태프는 코드를 확인한 뒤 지급 완료 처리를 할 수 있습니다.
        </p>
        <div class="actions">
          <a class="button" href="#/survey">설문 시작</a>
          <a class="button secondary" href="#/qr-display">패드 QR 화면</a>
          <a class="button secondary" href="#/staff">스태프 조회</a>
        </div>
      </div>
      <div class="qr-card" aria-label="Survey QR code">
        <img src="${qrUrl}" alt="RTBIO survey QR code" />
        <span>설문 QR</span>
      </div>
    </section>
  `;
}

function renderSurvey() {
  app.innerHTML = `
    <section class="panel">
      <h1 class="page-title">방문자 설문</h1>
      <p class="lead">
        ${escapeHtml(eventSettings.surveyIntro)}
      </p>
      <form id="survey-form" class="grid" novalidate>
        <div class="section">
          <h2>개인정보 동의</h2>
          <div class="notice panel">
            ${escapeHtml(eventSettings.privacyNotice)}
          </div>
          <label class="checkline">
            <input type="checkbox" name="privacyAgreed" required />
            <span>개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </div>

        <div class="section">
          <h2>방문자 정보</h2>
          <div class="grid two">
            ${inputField("name", "이름", "text", "홍길동")}
            ${inputField("company", "회사명", "text", "회사명")}
            ${inputField("title", "직책", "text", "팀장")}
            ${inputField("phone", "휴대폰 번호", "tel", "010-0000-0000")}
            ${inputField("email", "이메일", "email", "name@company.com")}
          </div>
        </div>

        <div class="section">
          <h2>10문항 설문</h2>
          ${surveyQuestions.map(questionTemplate).join("")}
        </div>

        <div id="form-message"></div>
        <div class="actions">
          <button type="submit">제출하고 완료 코드 받기</button>
          <a class="button secondary" href="#/">취소</a>
        </div>
      </form>
    </section>
  `;

  document.querySelector("#survey-form").addEventListener("submit", handleSurveySubmit);
}

async function renderComplete(code) {
  const record = await store.findByCode(code);

  if (!record) {
    app.innerHTML = `
      <section class="panel">
        <h1 class="page-title">완료 코드를 찾을 수 없습니다</h1>
        <p class="lead">설문을 다시 제출하거나 스태프에게 문의해 주세요.</p>
        <a class="button" href="#/survey">설문으로 이동</a>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <section class="panel">
      <h1 class="page-title">설문 완료</h1>
      <p class="lead">${escapeHtml(record.name)}님, ${escapeHtml(eventSettings.completionGuide)}</p>
      <div class="code">${record.completionCode}</div>
      <div class="section">
        <div class="message ok">현재 지급 상태: ${statusLabel(record.redemptionStatus)}</div>
        <div class="actions">
          <a class="button" href="#/staff">스태프 확인으로 이동</a>
          <a class="button secondary" href="#/">처음으로</a>
        </div>
      </div>
    </section>
  `;
}

function renderStaff() {
  app.innerHTML = `
    <section class="panel">
      ${authBarTemplate()}
      <h1 class="page-title">스태프 지급 확인</h1>
      <form id="staff-form" class="grid two">
        <div class="field">
          <label for="completionCode">완료 코드</label>
          <input id="completionCode" name="completionCode" placeholder="RTB-ABC123" required />
        </div>
        <div class="field">
          <label for="redeemedBy">처리자</label>
          <input id="redeemedBy" name="redeemedBy" placeholder="스태프 이름" value="Staff" required />
        </div>
        <div class="actions">
          <button type="submit">코드 조회</button>
        </div>
      </form>
      <div id="staff-result" class="section"></div>
    </section>
  `;

  document.querySelector("#staff-form").addEventListener("submit", handleStaffLookup);
  document.querySelector("#sign-out").addEventListener("click", handleSignOut);
}

async function renderAdmin() {
  const records = await store.list();
  const redeemed = records.filter((record) => record.redemptionStatus === "redeemed").length;
  const surveyUrl = getSurveyUrl(window.location.href);
  const qrUrl = getQrImageUrl(surveyUrl);

  app.innerHTML = `
    <section>
      ${authBarTemplate()}
      <h1 class="page-title">관리자 대시보드</h1>
      <div class="stats">
        <div class="stat">전체 응답<strong>${records.length}</strong></div>
        <div class="stat">지급 완료<strong>${redeemed}</strong></div>
        <div class="stat">미지급<strong>${records.length - redeemed}</strong></div>
      </div>

      <div class="admin-grid">
        <div class="panel">
          <h2>QR 발급</h2>
          <p class="muted">배포 URL이 확정되면 아래 주소를 실제 설문 주소로 바꿔 QR 이미지를 다운로드하세요.</p>
          <div class="field">
            <label for="survey-url">설문 URL</label>
            <input id="survey-url" value="${escapeHtml(surveyUrl)}" />
          </div>
          <div class="qr-preview">
            <img id="qr-image" src="${qrUrl}" alt="Survey QR code" />
          </div>
          <div class="actions">
            <button id="refresh-qr" type="button">QR 새로고침</button>
            <a id="download-qr" class="button secondary" href="${qrUrl}" download="rtbio-survey-qr.png">QR 다운로드</a>
          </div>
        </div>

        <div class="panel">
          <h2>설문 문항 수정</h2>
          <p class="muted">각 문항의 질문과 답변 방식을 입력하세요. 선택형 문항은 선택지를 한 칸씩 수정할 수 있습니다.</p>
          <form id="question-form" class="question-editor-list">
            ${surveyQuestions.map(adminQuestionEditorTemplate).join("")}
          </form>
          <div id="question-message"></div>
          <div class="actions">
            <button id="save-questions" type="button">문항 저장</button>
          <button id="reset-questions" class="secondary" type="button">기본 문항 복원</button>
          </div>
        </div>

        <div class="panel">
          <h2>행사 문구 수정</h2>
          <p class="muted">패드 QR, 방문자 설문, 완료 화면에 표시되는 문구입니다.</p>
          <form id="event-settings-form" class="grid">
            ${eventSettingsTemplate()}
          </form>
          <div id="event-settings-message"></div>
          <div class="actions">
            <button id="save-event-settings" type="button">행사 문구 저장</button>
          </div>
        </div>
      </div>

      <div class="panel section">
        <div class="actions">
          <button id="download-csv" type="button">CSV 다운로드</button>
          <button id="refresh-admin" class="secondary" type="button">새로고침</button>
        </div>
        <div class="table-wrap section">
          <table>
            <thead>
              <tr>
                <th>제출일</th>
                <th>완료 코드</th>
                <th>이름</th>
                <th>회사</th>
                <th>직책</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>지급</th>
                <th>관심 제품</th>
                <th>상담</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(adminRowTemplate).join("") || `<tr><td colspan="10">아직 응답이 없습니다.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#refresh-qr").addEventListener("click", refreshQr);
  document.querySelectorAll("[data-question-type]").forEach((select) => {
    select.addEventListener("change", handleQuestionTypeChange);
  });
  document.querySelector("#save-questions").addEventListener("click", handleSaveQuestions);
  document.querySelector("#reset-questions").addEventListener("click", handleResetQuestions);
  document.querySelector("#save-event-settings").addEventListener("click", handleSaveEventSettings);
  document.querySelector("#download-csv").addEventListener("click", downloadCsv);
  document.querySelector("#refresh-admin").addEventListener("click", () => {
    void renderAdmin();
  });
  document.querySelector("#sign-out").addEventListener("click", handleSignOut);
}

function renderQrDisplay() {
  const surveyUrl = getSurveyUrl(window.location.href);
  const qrUrl = getQrImageUrl(surveyUrl);

  app.innerHTML = `
    <section class="pad-qr-screen">
      <div class="pad-qr-copy">
        <div class="pad-kicker">RTBIO EVENT SURVEY</div>
        <h1>${escapeHtml(eventSettings.eventTitle)}</h1>
        <p>휴대폰 카메라로 QR을 스캔해 설문을 시작하세요. 완료 후 ${escapeHtml(eventSettings.productName)} 수령 코드가 발급됩니다.</p>
        <div class="pad-url">${escapeHtml(surveyUrl)}</div>
      </div>
      <div class="pad-qr-frame">
        <img src="${qrUrl}" alt="RTBIO survey QR code" />
      </div>
      <div class="pad-actions">
        <a class="button secondary" href="#/">홈</a>
        <a class="button secondary" href="#/staff">스태프 조회</a>
      </div>
    </section>
  `;
}

function requireRole(requiredRole) {
  const currentRole = getCurrentRole();

  if (canAccessRole(currentRole, requiredRole)) {
    return true;
  }

  renderLogin(requiredRole);
  return false;
}

function renderLogin(requiredRole) {
  app.innerHTML = `
    <section class="panel login-panel">
      <h1 class="page-title">운영자 로그인</h1>
      <p class="lead">현장 운영 기능을 사용하려면 비밀번호를 입력해 주세요.</p>
      <form id="login-form" class="grid" novalidate>
        <input type="hidden" name="role" value="${requiredRole}" />
        <div class="field">
          <label for="password">비밀번호</label>
          <input id="password" name="password" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password" required />
        </div>
        <div id="login-message"></div>
        <div class="actions">
          <button type="submit">로그인</button>
          <a class="button secondary" href="#/">홈</a>
        </div>
      </form>
      <p class="muted demo-passwords">현장 비밀번호: 1111</p>
    </section>
  `;

  document.querySelector("#login-form").addEventListener("submit", handleLogin);
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");
  const message = document.querySelector("#login-message");

  if (!signIn(role, password)) {
    message.innerHTML = `<div class="message error">비밀번호가 올바르지 않습니다.</div>`;
    return;
  }

  void render();
}

function handleSignOut() {
  signOut();
  void render();
}

function authBarTemplate() {
  return `
    <div class="auth-bar">
      <span>현장 운영 화면 · 현재 권한: <strong>운영자</strong></span>
      <button id="sign-out" class="secondary" type="button">로그아웃</button>
    </div>
  `;
}

async function handleSurveySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const message = document.querySelector("#form-message");
  const lead = {
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    title: String(formData.get("title") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    privacyAgreed: formData.get("privacyAgreed") === "on",
  };
  const answers = Object.fromEntries(
    surveyQuestions.map((question) => [question.id, String(formData.get(question.id) ?? "")]),
  );

  const missing = validateSubmission(lead, answers);
  if (missing.length > 0) {
    message.innerHTML = `<div class="message error">${missing[0]}</div>`;
    return;
  }

  const participant = await store.createSubmission(lead, answers);

  window.location.hash = `#/complete/${participant.completionCode}`;
}

async function handleStaffLookup(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const code = String(formData.get("completionCode") ?? "");
  const redeemedBy = String(formData.get("redeemedBy") ?? "Staff");
  const record = await store.findByCode(code);
  const result = document.querySelector("#staff-result");

  if (!record) {
    result.innerHTML = `<div class="message error">완료 코드를 찾을 수 없습니다.</div>`;
    return;
  }

  result.innerHTML = staffResultTemplate(record, redeemedBy);
  const redeemButton = document.querySelector("#redeem-button");
  if (redeemButton) {
    redeemButton.addEventListener("click", async () => {
      const redemption = await store.redeem(record.completionCode, redeemedBy);
      if (redemption.ok) {
        result.innerHTML = staffResultTemplate(redemption.record, redeemedBy);
      } else if (redemption.reason === "already_redeemed") {
        result.innerHTML = staffResultTemplate(redemption.record, redeemedBy);
      }
    });
  }
}

function inputField(name, label, type, placeholder) {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" required />
    </div>
  `;
}

function questionTemplate(question) {
  if (question.type === "text") {
    return `
      <div class="field question">
        <label for="${question.id}">${question.label}</label>
        <textarea id="${question.id}" name="${question.id}" placeholder="${question.placeholder}" required></textarea>
      </div>
    `;
  }

  return `
    <fieldset class="question">
      <legend>${question.label}</legend>
      <div class="options">
        ${question.options
          .map(
            (option) => `
              <label class="option">
                <input type="radio" name="${question.id}" value="${option}" required />
                <span>${option}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </fieldset>
  `;
}

function validateSubmission(lead, answers) {
  const errors = [];

  if (!lead.privacyAgreed) errors.push("개인정보 수집 및 이용 동의가 필요합니다.");
  if (!lead.name.trim()) errors.push("이름을 입력해 주세요.");
  if (!lead.company.trim()) errors.push("회사명을 입력해 주세요.");
  if (!lead.title.trim()) errors.push("직책을 입력해 주세요.");
  if (!lead.phone.trim()) errors.push("휴대폰 번호를 입력해 주세요.");
  if (!lead.email.trim()) errors.push("이메일을 입력해 주세요.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) {
    errors.push("올바른 이메일을 입력해 주세요.");
  }

  const unanswered = surveyQuestions.find((question) => !String(answers[question.id] ?? "").trim());
  if (unanswered) errors.push(`설문 문항에 응답해 주세요: ${unanswered.label}`);

  return errors;
}

function staffResultTemplate(record, redeemedBy) {
  const isRedeemed = record.redemptionStatus === "redeemed";
  return `
    <div class="panel">
      <h2>${escapeHtml(record.name)} / ${escapeHtml(record.company)}</h2>
      <p>${escapeHtml(record.title)} · ${escapeHtml(record.phone)} · ${escapeHtml(record.email)}</p>
      <p>완료 코드: <strong>${record.completionCode}</strong></p>
      <p>상태: <span class="badge ${record.redemptionStatus}">${statusLabel(record.redemptionStatus)}</span></p>
      ${
        isRedeemed
          ? `<div class="message warn">이미 지급 완료된 코드입니다. 처리자: ${escapeHtml(record.redeemedBy)} / ${escapeHtml(record.redeemedAt)}</div>`
          : `<button id="redeem-button" type="button">RTBIO 제품 지급 완료</button><input type="hidden" value="${escapeHtml(redeemedBy)}" />`
      }
    </div>
  `;
}

function adminRowTemplate(record) {
  return `
    <tr>
      <td>${formatDate(record.createdAt)}</td>
      <td>${record.completionCode}</td>
      <td>${escapeHtml(record.name)}</td>
      <td>${escapeHtml(record.company)}</td>
      <td>${escapeHtml(record.title)}</td>
      <td>${escapeHtml(record.phone)}</td>
      <td>${escapeHtml(record.email)}</td>
      <td><span class="badge ${record.redemptionStatus}">${statusLabel(record.redemptionStatus)}</span></td>
      <td>${escapeHtml(record.answers.q2 ?? "")}</td>
      <td>${escapeHtml(record.answers.q8 ?? "")}</td>
    </tr>
  `;
}

async function downloadCsv() {
  const blob = new Blob([await store.exportCsv()], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `rtbio-survey-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function refreshQr() {
  const urlInput = document.querySelector("#survey-url");
  const qrImage = document.querySelector("#qr-image");
  const download = document.querySelector("#download-qr");
  const qrUrl = getQrImageUrl(urlInput.value);

  qrImage.src = qrUrl;
  download.href = qrUrl;
}

function handleSaveQuestions() {
  const form = document.querySelector("#question-form");
  const message = document.querySelector("#question-message");
  const nextQuestions = readQuestionEditorForm(form);
  const errors = validateQuestions(nextQuestions);

  if (errors.length > 0) {
    message.innerHTML = `<div class="message error">${escapeHtml(errors[0])}</div>`;
    return;
  }

  void saveQuestionsFromAdmin(nextQuestions, message);
}

async function saveQuestionsFromAdmin(nextQuestions, message) {
  surveyQuestions = await store.saveQuestions(nextQuestions);
  message.innerHTML = `<div class="message ok">설문 문항을 저장했습니다. 방문자 설문에 바로 반영됩니다.</div>`;
}

function handleResetQuestions() {
  void resetQuestionsFromAdmin();
}

async function resetQuestionsFromAdmin() {
  surveyQuestions = await store.resetQuestions();
  await renderAdmin();
}

function handleSaveEventSettings() {
  const form = document.querySelector("#event-settings-form");
  const message = document.querySelector("#event-settings-message");
  const formData = new FormData(form);
  const nextSettings = {
    eventTitle: String(formData.get("eventTitle") ?? ""),
    productName: String(formData.get("productName") ?? ""),
    surveyIntro: String(formData.get("surveyIntro") ?? ""),
    completionGuide: String(formData.get("completionGuide") ?? ""),
    privacyNotice: String(formData.get("privacyNotice") ?? ""),
  };
  const errors = validateEventSettings(nextSettings);

  if (errors.length > 0) {
    message.innerHTML = `<div class="message error">${escapeHtml(errors[0])}</div>`;
    return;
  }

  void saveEventSettingsFromAdmin(nextSettings, message);
}

async function saveEventSettingsFromAdmin(nextSettings, message) {
  eventSettings = await store.saveEventSettings(nextSettings);
  message.innerHTML = `<div class="message ok">행사 문구를 저장했습니다.</div>`;
}

function eventSettingsTemplate() {
  return `
    <div class="grid two">
      <div class="field">
        <label for="eventTitle">행사명</label>
        <input id="eventTitle" name="eventTitle" value="${escapeHtml(eventSettings.eventTitle)}" required />
      </div>
      <div class="field">
        <label for="productName">지급 제품명</label>
        <input id="productName" name="productName" value="${escapeHtml(eventSettings.productName)}" required />
      </div>
    </div>
    <div class="field">
      <label for="surveyIntro">설문 안내 문구</label>
      <textarea id="surveyIntro" name="surveyIntro" required>${escapeHtml(eventSettings.surveyIntro)}</textarea>
    </div>
    <div class="field">
      <label for="completionGuide">완료 화면 안내 문구</label>
      <textarea id="completionGuide" name="completionGuide" required>${escapeHtml(eventSettings.completionGuide)}</textarea>
    </div>
    <div class="field">
      <label for="privacyNotice">개인정보 안내 문구</label>
      <textarea id="privacyNotice" name="privacyNotice" required>${escapeHtml(eventSettings.privacyNotice)}</textarea>
    </div>
  `;
}

function handleQuestionTypeChange(event) {
  const index = event.currentTarget.dataset.questionType;
  const optionEditor = document.querySelector(`[data-option-editor="${index}"]`);
  optionEditor.hidden = event.currentTarget.value === "text";
}

function adminQuestionEditorTemplate(question, index) {
  const isText = question.type === "text";
  const options = isText ? ["", "", "", ""] : [...question.options, "", "", "", ""].slice(0, 4);

  return `
    <fieldset class="admin-question-card" data-question-index="${index}">
      <legend>문항 ${index + 1}</legend>
      <div class="field">
        <label for="admin-q${index}-label">질문 내용</label>
        <input id="admin-q${index}-label" name="label-${index}" value="${escapeHtml(question.label)}" required />
      </div>
      <div class="field">
        <label for="admin-q${index}-type">답변 방식</label>
        <select id="admin-q${index}-type" name="type-${index}" data-question-type="${index}">
          <option value="choice"${question.type === "choice" ? " selected" : ""}>선택형</option>
          <option value="text"${question.type === "text" ? " selected" : ""}>주관식</option>
        </select>
      </div>
      <div class="field option-editor" data-option-editor="${index}" ${isText ? "hidden" : ""}>
        <label>선택지</label>
        <div class="option-inputs">
          ${options
            .map(
              (option, optionIndex) => `
                <input name="option-${index}-${optionIndex}" value="${escapeHtml(option)}" placeholder="선택지 ${optionIndex + 1}" />
              `,
            )
            .join("")}
        </div>
      </div>
    </fieldset>
  `;
}

function readQuestionEditorForm(form) {
  const formData = new FormData(form);

  return Array.from({ length: 10 }, (_, index) => {
    const type = String(formData.get(`type-${index}`) ?? "choice");
    const label = String(formData.get(`label-${index}`) ?? "");

    if (type === "text") {
      return {
        id: `q${index + 1}`,
        label,
        type: "text",
        placeholder: "답변을 입력해 주세요.",
      };
    }

    return {
      id: `q${index + 1}`,
      label,
      type: "choice",
      options: Array.from({ length: 4 }, (_, optionIndex) =>
        String(formData.get(`option-${index}-${optionIndex}`) ?? "").trim(),
      ).filter(Boolean),
    };
  });
}

function statusLabel(status) {
  return status === "redeemed" ? "지급완료" : "미지급";
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
