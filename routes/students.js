const router  = require('express').Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const SA    = ['superadmin'];
const ADMIN = ['superadmin','admin'];
const ALL   = ['superadmin','admin','teacher','student'];

// ── GET /api/students  (admin/superadmin) ────────
router.get('/', protect(ADMIN), async (req, res) => {
  try {
    const { class: cls, section, search } = req.query;
    const filter = { graduated: { $ne: true } };
    if (cls)     filter.class   = cls;
    if (section) filter.section = section;
    if (search)  filter.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
    const students = await Student.find(filter)
      .select('-password')
      .sort({ class: 1, roll: 1 });
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/graduated ──────────────────
router.get('/graduated', protect(ADMIN), async (req, res) => {
  try {
    const students = await Student.find({ graduated: true }).select('-password');
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/me  (student sees own data) ─
router.get('/me', protect(['student']), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/:id ────────────────────────
router.get('/:id', protect(ADMIN), async (req, res) => {
  try {
    const student = await Student.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/students  (create) ─────────────────
router.post('/', protect(ADMIN), async (req, res) => {
  try {
    const { username, password, name, class: cls, section, roll, gender, dob, bloodGroup,
            guardianName, guardianNumber, studentEmail, monthlyFeeAmount } = req.body;

    if (!username || !password || !name || !cls || !section)
      return res.status(400).json({ success: false, message: 'username, password, name, class, section are required.' });

    const exists = await Student.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken.' });

    const student = await Student.create({
      username, password, name, class: cls, section,
      roll: roll || 0, gender, dob, bloodGroup,
      guardianName, guardianNumber, studentEmail,
      'payments.monthlyFeeAmount': monthlyFeeAmount || 0,
    });

    const plain = student.toObject();
    delete plain.password;
    res.status(201).json({ success: true, data: plain, message: 'Student created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/students/:id  (update) ──────────────
router.put('/:id', protect(ADMIN), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const student = await Student.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    Object.assign(student, rest);
    if (password) student.password = password;
    await student.save();

    const plain = student.toObject();
    delete plain.password;
    res.json({ success: true, data: plain, message: 'Student updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/students/:id/photo ───────────────────
router.put('/:id/photo', protect(ALL), async (req, res) => {
  try {
    const { photo } = req.body; // base64 string
    const student = await Student.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    student.photo = photo;
    await student.save();
    res.json({ success: true, message: 'Photo updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/students/:id/payment ─────────────────
router.put('/:id/payment', protect(ADMIN), async (req, res) => {
  try {
    const { month, paid, registrationFee, admissionFee, monthlyFeeAmount, txnId, method, amount, type } = req.body;
    const student = await Student.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (month !== undefined)           student.payments.monthly[month] = paid;
    if (registrationFee !== undefined) student.payments.registrationFee = registrationFee;
    if (admissionFee !== undefined)    student.payments.admissionFee    = admissionFee;
    if (monthlyFeeAmount !== undefined)student.payments.monthlyFeeAmount = monthlyFeeAmount;

    // Add to payment history
    if (txnId) {
      student.paymentHistory.push({
        date: new Date().toISOString().split('T')[0],
        type: type || 'Monthly Fee',
        method: method || 'Cash',
        txnId,
        amount: amount || 0,
        status: 'success',
      });
    }
    await student.save();
    res.json({ success: true, message: 'Payment updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/students/:id/promote ───────────────
router.post('/:id/promote', protect(ADMIN), async (req, res) => {
  try {
    const { toClass, toSection, toRoll } = req.body;
    const student = await Student.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (toClass === 'graduate') {
      student.graduated   = true;
      student.graduatedAt = new Date().toISOString().split('T')[0];
      student.originalClass = student.class;
    } else {
      student.class   = toClass;
      student.section = toSection || student.section;
      student.roll    = toRoll    || student.roll;
    }
    await student.save();
    res.json({ success: true, message: student.graduated ? 'Student graduated.' : 'Student promoted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/students/:id ─────────────────────
router.delete('/:id', protect(ADMIN), async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
