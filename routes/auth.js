const router  = require('express').Router();
const SuperAdmin = require('../models/SuperAdmin');
const Admin      = require('../models/Admin');
const Teacher    = require('../models/Teacher');
const Student    = require('../models/Student');
const { signToken, protect } = require('../middleware/auth');

// ── POST /api/auth/superadmin/signup ─────────────
router.post('/superadmin/signup', async (req, res) => {
  try {
    const existing = await SuperAdmin.findOne();
    if (existing) return res.status(400).json({ success: false, message: 'Super Admin already exists.' });

    const { username, password, email, phone } = req.body;
    if (!username || !password || !email || !phone)
      return res.status(400).json({ success: false, message: 'All fields required.' });

    const sa = await SuperAdmin.create({ username, password, email, phone, name: 'Super Admin' });
    const token = signToken({ id: sa._id, role: 'superadmin', username: sa.username });
    res.json({ success: true, token, user: { id: sa._id, username: sa.username, role: 'superadmin', name: sa.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/superadmin/login ──────────────
router.post('/superadmin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const sa = await SuperAdmin.findOne({ username });
    if (!sa || !(await sa.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const token = signToken({ id: sa._id, role: 'superadmin', username: sa.username });
    res.json({ success: true, token, user: { id: sa._id, username: sa.username, role: 'superadmin', name: sa.name, email: sa.email, phone: sa.phone, photo: sa.photo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/admin/login ───────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    if (!admin.approved)
      return res.status(403).json({ success: false, message: 'Your account is pending Super Admin approval.' });

    const token = signToken({ id: admin._id, role: 'admin', username: admin.username });
    res.json({ success: true, token, user: { id: admin._id, username: admin.username, role: 'admin', name: admin.name, email: admin.email, phone: admin.phone, photo: admin.photo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/teacher/login ─────────────────
router.post('/teacher/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const teacher = await Teacher.findOne({ username });
    if (!teacher || !(await teacher.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    if (!teacher.approved)
      return res.status(403).json({ success: false, message: 'Your account is pending approval.' });

    const token = signToken({ id: teacher._id, role: 'teacher', username: teacher.username });
    res.json({ success: true, token, user: { id: teacher._id, username: teacher.username, role: 'teacher', name: teacher.name, email: teacher.email, phone: teacher.phone, photo: teacher.photo, assignments: teacher.assignments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/student/login ─────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const student = await Student.findOne({ username });
    if (!student || !(await student.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const token = signToken({ id: student._id, role: 'student', username: student.username, studentId: student.studentId });
    res.json({ success: true, token, user: {
      id: student._id, studentId: student.studentId, username: student.username,
      role: 'student', name: student.name, class: student.class, section: student.section,
      roll: student.roll, photo: student.photo, guardianName: student.guardianName,
      guardianNumber: student.guardianNumber, payments: student.payments,
      paymentYear: student.paymentYear,
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────
// Verify token and return current user
router.get('/me', protect(['superadmin','admin','teacher','student']), async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;
    if (role === 'superadmin') user = await SuperAdmin.findById(id).select('-password');
    else if (role === 'admin')  user = await Admin.findById(id).select('-password');
    else if (role === 'teacher') user = await Teacher.findById(id).select('-password');
    else user = await Student.findById(id).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: { ...user.toObject(), role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/auth/change-password ────────────────
router.put('/change-password', protect(['superadmin','admin','teacher','student']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;
    let Model;
    if (role === 'superadmin') Model = SuperAdmin;
    else if (role === 'admin') Model = Admin;
    else if (role === 'teacher') Model = Teacher;
    else Model = Student;

    const user = await Model.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is wrong.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
