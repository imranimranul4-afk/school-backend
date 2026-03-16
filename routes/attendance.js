const router = require('express').Router();
const { Attendance, EmailLog } = require('../models/index');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const ADMIN   = ['superadmin','admin'];
const TEACHER = ['superadmin','admin','teacher'];

// ── GET /api/attendance?class=&section=&subject=&date= ──
router.get('/', protect(TEACHER), async (req, res) => {
  try {
    const { class: cls, section, subject, date } = req.query;
    const filter = {};
    if (cls)     filter.class   = cls;
    if (section) filter.section = section;
    if (subject) filter.subject = subject;
    if (date)    filter.date    = date;
    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/attendance/student/:studentId ────────
router.get('/student/:studentId', protect(['superadmin','admin','teacher','student']), async (req, res) => {
  try {
    const records = await Attendance.find({ 'records.studentId': req.params.studentId });
    // Summarize: { subject, present, absent }
    const summary = {};
    records.forEach(rec => {
      const key = rec.subject;
      if (!summary[key]) summary[key] = { subject: key, present: 0, absent: 0 };
      const r = rec.records.find(r => r.studentId === req.params.studentId);
      if (r) r.present ? summary[key].present++ : summary[key].absent++;
    });
    res.json({ success: true, data: Object.values(summary) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/attendance ─────────────────────────
router.post('/', protect(TEACHER), async (req, res) => {
  try {
    const { class: cls, section, subject, date, records } = req.body;
    if (!cls || !section || !subject || !date || !records)
      return res.status(400).json({ success: false, message: 'class, section, subject, date, records are required.' });

    // Upsert — replace if same date/class/section/subject
    const att = await Attendance.findOneAndUpdate(
      { class: cls, section, subject, date },
      { records, takenBy: req.user.id },
      { upsert: true, new: true }
    );

    // Send email to guardians of absent students
    const absentIds = records.filter(r => !r.present).map(r => r.studentId);
    if (absentIds.length > 0) {
      sendAbsenceEmails(absentIds, { cls, section, subject, date });
    }

    res.status(201).json({ success: true, data: att, message: 'Attendance saved.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Helper: send absence notification emails ──────
async function sendAbsenceEmails(studentIds, { cls, section, subject, date }) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    const students = await Student.find({ studentId: { $in: studentIds } });
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const s of students) {
      if (!s.guardianNumber && !s.studentEmail) continue;
      const to = s.studentEmail || null;
      if (!to) continue;

      const subject_line = `Absence Notice — ${s.name} — ${date}`;
      const body = `Dear ${s.guardianName},\n\nThis is to inform you that your child ${s.name} (Class ${cls}/${section}) was marked absent in ${subject} on ${date}.\n\nPlease ensure regular attendance.\n\nMostafa Pre Cadet School`;

      try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject: subject_line, text: body });
        await EmailLog.create({ to, subject: subject_line, body, sentBy: 'system', status: 'sent' });
      } catch (emailErr) {
        await EmailLog.create({ to, subject: subject_line, body, sentBy: 'system', status: 'failed' });
      }
    }
  } catch (e) { console.error('Email send error:', e.message); }
}

module.exports = router;
