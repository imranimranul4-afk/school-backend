// ═══════════════════════════════════════════════════════════
//  api.js  —  Frontend ↔ Backend connector
//  Replaces db.js (LocalStorage) with real API calls
//  Mostafa Pre Cadet School
// ═══════════════════════════════════════════════════════════

// 👇 Change this to your Render.com URL after deployment
const API_BASE = 'https://mostafa-school-api.onrender.com';

// ── Token management ─────────────────────────────────────
function getToken() { return localStorage.getItem('mpcs_token'); }
function setToken(t) { localStorage.setItem('mpcs_token', t); }
function clearToken() { localStorage.removeItem('mpcs_token'); }

// ── Core fetch wrapper ────────────────────────────────────
async function apiCall(method, path, body = null, showError = true) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok && showError) {
      showToast(data.message || 'Server error.', 'error');
    }
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    if (showError) showToast('Network error. Please check your connection.', 'error');
    return { ok: false, message: 'Network error.' };
  }
}

const GET    = (path)        => apiCall('GET', path);
const POST   = (path, body)  => apiCall('POST', path, body);
const PUT    = (path, body)  => apiCall('PUT', path, body);
const DELETE = (path)        => apiCall('DELETE', path);

// ═══════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════
async function loginSuperAdmin(username, password) {
  const r = await POST('/api/auth/superadmin/login', { username, password });
  if (r.ok) { setToken(r.token); setSession('superAdminSess', { ok: true, user: r.user }); }
  return r;
}
async function loginAdmin(username, password) {
  const r = await POST('/api/auth/admin/login', { username, password });
  if (r.ok) { setToken(r.token); setSession('adminSess', { ok: true, user: r.user }); }
  return r;
}
async function loginTeacher(username, password) {
  const r = await POST('/api/auth/teacher/login', { username, password });
  if (r.ok) { setToken(r.token); setSession('teacherSess', { ok: true, user: r.user, id: r.user.id }); }
  return r;
}
async function loginStudent(username, password) {
  const r = await POST('/api/auth/student/login', { username, password });
  if (r.ok) { setToken(r.token); setSession('studentSess', { ok: true, user: r.user, id: r.user.id }); }
  return r;
}
async function signupSuperAdmin(data) {
  const r = await POST('/api/auth/superadmin/signup', data);
  if (r.ok) { setToken(r.token); setSession('superAdminSess', { ok: true, user: r.user }); }
  return r;
}
async function changePassword(currentPassword, newPassword) {
  return PUT('/api/auth/change-password', { currentPassword, newPassword });
}

// ═══════════════════════════════════════════════════════════
//  STUDENTS
// ═══════════════════════════════════════════════════════════
async function getStudents(filter = {}) {
  const params = new URLSearchParams(filter).toString();
  const r = await GET(`/api/students${params ? '?' + params : ''}`);
  return r.ok ? r.data : [];
}
async function getStudentById(id) {
  const r = await GET(`/api/students/${id}`);
  return r.ok ? r.data : null;
}
async function getMyStudentProfile() {
  const r = await GET('/api/students/me');
  return r.ok ? r.data : null;
}
async function getStudentsByClassSection(cls, section) {
  return getStudents({ class: cls, section });
}
async function addStudent(data) {
  const r = await POST('/api/students', data);
  return r;
}
async function updateStudent(id, data) {
  return PUT(`/api/students/${id}`, data);
}
async function deleteStudent(id) {
  return DELETE(`/api/students/${id}`);
}
async function updateStudentPayment(id, data) {
  return PUT(`/api/students/${id}/payment`, data);
}
async function updateStudentPhoto(id, photo) {
  return PUT(`/api/students/${id}/photo`, { photo });
}
async function promoteStudent(id, toClass, toSection, toRoll) {
  return POST(`/api/students/${id}/promote`, { toClass, toSection, toRoll });
}
async function getGraduatedStudents() {
  const r = await GET('/api/students/graduated');
  return r.ok ? r.data : [];
}

// ═══════════════════════════════════════════════════════════
//  TEACHERS
// ═══════════════════════════════════════════════════════════
async function getTeachers(filter = {}) {
  const params = new URLSearchParams(filter).toString();
  const r = await GET(`/api/teachers${params ? '?' + params : ''}`);
  return r.ok ? r.data : [];
}
async function getPendingTeachers() {
  return getTeachers({ approved: false });
}
async function addTeacher(data) { return POST('/api/teachers', data); }
async function updateTeacher(id, data) { return PUT(`/api/teachers/${id}`, data); }
async function approveTeacher(id) { return PUT(`/api/teachers/${id}/approve`); }
async function updateTeacherAssignments(id, assignments) {
  return PUT(`/api/teachers/${id}/assignments`, { assignments });
}
async function deleteTeacher(id) { return DELETE(`/api/teachers/${id}`); }

// ═══════════════════════════════════════════════════════════
//  NOTICES
// ═══════════════════════════════════════════════════════════
async function getNotices() {
  const r = await GET('/api/notices');
  return r.ok ? r.data : [];
}
async function saveNotice(data) {
  if (data._id || data.id) return PUT(`/api/notices/${data._id || data.id}`, data);
  return POST('/api/notices', data);
}
async function deleteNotice(id) { return DELETE(`/api/notices/${id}`); }

// ═══════════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════════
async function saveAttendance(cls, section, subject, date, records) {
  return POST('/api/attendance', { class: cls, section, subject, date, records });
}
async function getAttendance(filter = {}) {
  const params = new URLSearchParams(filter).toString();
  const r = await GET(`/api/attendance${params ? '?' + params : ''}`);
  return r.ok ? r.data : [];
}
async function getStudentAttendanceSummary(studentId) {
  const r = await GET(`/api/attendance/student/${studentId}`);
  return r.ok ? r.data : [];
}
// Returns { present, absent } for a student in class/section/subject
async function getStudentSubjectAttendance(studentId, cls, section, subject = null) {
  const records = await getAttendance({ class: cls, section, ...(subject ? { subject } : {}) });
  let present = 0, absent = 0;
  records.forEach(rec => {
    const r = (rec.records || []).find(r => r.studentId === studentId);
    if (r) r.present ? present++ : absent++;
  });
  return { present, absent };
}

// ═══════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════
async function getResults(filter = {}) {
  const params = new URLSearchParams(filter).toString();
  const r = await GET(`/api/results${params ? '?' + params : ''}`);
  return r.ok ? r.data : [];
}
async function saveResult(data) {
  return POST('/api/results', data);
}
async function saveResultsBulk(results) {
  return POST('/api/results/bulk', { results });
}
async function getStudentExamResult(studentId, examName, cls) {
  return getResults({ studentId, examName, class: cls });
}
async function deleteResult(id) { return DELETE(`/api/results/${id}`); }

// ═══════════════════════════════════════════════════════════
//  APPLICATIONS
// ═══════════════════════════════════════════════════════════
async function getApplications(filter = {}) {
  const params = new URLSearchParams(filter).toString();
  const r = await GET(`/api/applications${params ? '?' + params : ''}`);
  return r.ok ? r.data : [];
}
async function submitApplication(data) { return POST('/api/applications', data); }
async function approveApplication(id) { return PUT(`/api/applications/${id}/approve`); }
async function rejectApplication(id) { return PUT(`/api/applications/${id}/reject`); }
async function deleteApplication(id) { return DELETE(`/api/applications/${id}`); }

// ═══════════════════════════════════════════════════════════
//  HOLIDAYS / CALENDAR
// ═══════════════════════════════════════════════════════════
async function getCalendar() {
  const r = await GET('/api/holidays');
  return r.ok ? { holidays: r.data } : { holidays: [] };
}
async function addHoliday(data) { return POST('/api/holidays', data); }
async function deleteHoliday(date) { return DELETE(`/api/holidays/${encodeURIComponent(date)}`); }

// ═══════════════════════════════════════════════════════════
//  EXAM NAMES
// ═══════════════════════════════════════════════════════════
async function getAdminExamNames() {
  const r = await GET('/api/exam-names');
  return r.ok ? r.data : ['Half Yearly Examination', 'Annual Examination'];
}
async function addAdminExamName(name) { return POST('/api/exam-names', { name }); }
async function deleteAdminExamName(name) { return DELETE(`/api/exam-names/${encodeURIComponent(name)}`); }
async function renameAdminExamName(oldName, newName) {
  await deleteAdminExamName(oldName);
  return addAdminExamName(newName);
}

// ═══════════════════════════════════════════════════════════
//  CLASS CONFIG
// ═══════════════════════════════════════════════════════════
async function getClassConfig() {
  const r = await GET('/api/class-config');
  if (r.ok && Object.keys(r.data).length) return r.data;
  // Default config fallback
  const defaults = ['Play','Nursery','One','Two','Three','Four','Five'];
  const cfg = {};
  defaults.forEach(c => { cfg[c] = { sections: ['A'], subjects: ['Bangla','English','Math'] }; });
  return cfg;
}
async function saveClassConfig(cls, sections, subjects) {
  return PUT(`/api/class-config/${cls}`, { sections, subjects });
}

// ═══════════════════════════════════════════════════════════
//  ADMISSION INFO
// ═══════════════════════════════════════════════════════════
async function getAdmissionInfo() {
  const r = await GET('/api/admission-info');
  return r.ok ? r.data : {};
}
async function saveAdmissionInfo(data) { return PUT('/api/admission-info', data); }

// ═══════════════════════════════════════════════════════════
//  ADMINS (Super Admin only)
// ═══════════════════════════════════════════════════════════
async function getSAAdmins() {
  const r = await GET('/api/admins');
  return r.ok ? r.data : [];
}
async function addSAAdmin(data) { return POST('/api/admins', data); }
async function updateSAAdmin(id, data) { return PUT(`/api/admins/${id}`, data); }
async function deleteSAAdmin(id) { return DELETE(`/api/admins/${id}`); }

// ═══════════════════════════════════════════════════════════
//  EMAIL LOG
// ═══════════════════════════════════════════════════════════
async function getEmailLog() {
  const r = await GET('/api/email-log');
  return r.ok ? r.data : [];
}

// ═══════════════════════════════════════════════════════════
//  SESSION helpers (keep same interface as db.js)
// ═══════════════════════════════════════════════════════════
function setSession(key, value) {
  localStorage.setItem('sess_' + key, JSON.stringify(value));
}
function getSession(key) {
  try {
    const raw = localStorage.getItem('sess_' + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession(key) {
  localStorage.removeItem('sess_' + key);
  clearToken();
}

// ═══════════════════════════════════════════════════════════
//  Super Admin profile helpers
// ═══════════════════════════════════════════════════════════
async function getSuperAdminProfile() {
  const r = await GET('/api/auth/me');
  return r.ok ? r.user : null;
}
async function updateSuperAdminProfile(data) {
  // Uses change-password endpoint for credentials, misc for profile
  const r = await PUT('/api/admins/me', data); // extend if needed
  return r;
}

// ═══════════════════════════════════════════════════════════
//  LOADING OVERLAY helper (show while API calls run)
// ═══════════════════════════════════════════════════════════
function showLoading(msg = 'Loading...') {
  let el = document.getElementById('api-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'api-loading';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(11,29,81,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
    el.innerHTML = `<div style="background:#fff;border-radius:12px;padding:28px 36px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);">
      <div style="width:40px;height:40px;border:4px solid #eef2fa;border-top-color:#0B1D51;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>
      <div style="font-family:'Nunito',sans-serif;font-weight:700;color:#0B1D51;" id="api-loading-msg">${msg}</div>
    </div>`;
    document.body.appendChild(el);
  } else {
    document.getElementById('api-loading-msg').textContent = msg;
    el.style.display = 'flex';
  }
}
function hideLoading() {
  const el = document.getElementById('api-loading');
  if (el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
//  Date formatter (same as db.js)
// ═══════════════════════════════════════════════════════════
function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
}

// ═══════════════════════════════════════════════════════════
//  Backward-compat shim: getDB() returns empty structure
//  (so any old code that calls getDB() doesn't crash)
// ═══════════════════════════════════════════════════════════
function getDB() {
  console.warn('getDB() called — migrate this call to async API functions.');
  return { students:[], teachers:[], notices:[], attendance:{}, results:[], applications:[], superAdmin:{} };
}
