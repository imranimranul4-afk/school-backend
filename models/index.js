const mongoose = require('mongoose');

// ── Notice ───────────────────────────────────────
const NoticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  category:  { type: String, default: 'General' },
  date:      { type: String, default: () => new Date().toISOString().split('T')[0] },
  important: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// ── Attendance ───────────────────────────────────
const AttendanceRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  present:   { type: Boolean, default: true },
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  class:    { type: String, required: true },
  section:  { type: String, required: true },
  subject:  { type: String, required: true },
  date:     { type: String, required: true },   // YYYY-MM-DD
  records:  [AttendanceRecordSchema],
  takenBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: true });

// Unique attendance per class+section+subject+date
AttendanceSchema.index({ class: 1, section: 1, subject: 1, date: 1 }, { unique: true });

// ── Exam Result ──────────────────────────────────
const SubjectMarkSchema = new mongoose.Schema({
  subject:    { type: String, required: true },
  obtained:   { type: Number, default: 0 },
  fullMarks:  { type: Number, default: 100 },
}, { _id: false });

const ResultSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  examName:  { type: String, required: true },
  class:     { type: String, required: true },
  section:   { type: String, required: true },
  subjects:  [SubjectMarkSchema],
  enteredBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

ResultSchema.index({ studentId: 1, examName: 1, class: 1 }, { unique: true });

// ── Application ──────────────────────────────────
const ApplicationSchema = new mongoose.Schema({
  appId:          { type: String, unique: true },
  guardianName:   { type: String, required: true },
  guardianPhone:  { type: String, required: true },
  guardianEmail:  { type: String, default: '' },
  studentName:    { type: String, required: true },
  studentEmail:   { type: String, default: '' },
  dob:            { type: String, default: '' },
  gender:         { type: String, default: '' },
  bloodGroup:     { type: String, default: '' },
  applyClass:     { type: String, required: true },
  startDate:      { type: String, default: '' },
  hearAbout:      { type: String, default: '' },
  whyApply:       { type: String, default: '' },
  prevSchool:     { type: String, default: '' },
  specialNote:    { type: String, default: '' },
  photo:          { type: String, default: '' },
  paymentMethod:  { type: String, default: '' },
  txnId:          { type: String, default: '' },
  status:         { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  date:           { type: String, default: () => new Date().toISOString().split('T')[0] },
}, { timestamps: true });

ApplicationSchema.pre('save', function(next) {
  if (!this.appId) this.appId = 'APP' + Date.now().toString().slice(-7);
  next();
});

// ── Holiday / Calendar ───────────────────────────
const HolidaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['government','school'], default: 'government' },
}, { timestamps: true });

// ── Exam Names ───────────────────────────────────
const ExamNameSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

// ── Email Log ─────────────────────────────────────
const EmailLogSchema = new mongoose.Schema({
  to:        String,
  subject:   String,
  body:      String,
  sentBy:    String,
  sentAt:    { type: Date, default: Date.now },
  status:    { type: String, enum: ['sent','failed'], default: 'sent' },
});

// ── Class Config ─────────────────────────────────
const ClassConfigSchema = new mongoose.Schema({
  class:    { type: String, required: true, unique: true },
  sections: [String],
  subjects: [String],
});

// ── Admission Info ───────────────────────────────
const AdmissionInfoSchema = new mongoose.Schema({
  key:   { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = {
  Notice:        mongoose.model('Notice',        NoticeSchema),
  Attendance:    mongoose.model('Attendance',     AttendanceSchema),
  Result:        mongoose.model('Result',         ResultSchema),
  Application:   mongoose.model('Application',   ApplicationSchema),
  Holiday:       mongoose.model('Holiday',        HolidaySchema),
  ExamName:      mongoose.model('ExamName',       ExamNameSchema),
  EmailLog:      mongoose.model('EmailLog',       EmailLogSchema),
  ClassConfig:   mongoose.model('ClassConfig',    ClassConfigSchema),
  AdmissionInfo: mongoose.model('AdmissionInfo',  AdmissionInfoSchema),
};
