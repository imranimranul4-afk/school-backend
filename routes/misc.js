const router = require('express').Router();
const { Holiday, ExamName, ClassConfig, AdmissionInfo, EmailLog } = require('../models/index');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const SA    = ['superadmin'];
const ADMIN = ['superadmin','admin'];
const ALL   = ['superadmin','admin','teacher','student'];

// ══════════════════════════════════════════════
// HOLIDAYS
// ══════════════════════════════════════════════
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/holidays', protect(ADMIN), async (req, res) => {
  try {
    const { date, name, type } = req.body;
    if (!date || !name) return res.status(400).json({ success: false, message: 'date and name required.' });
    const h = await Holiday.findOneAndUpdate({ date }, { name, type }, { upsert: true, new: true });
    res.status(201).json({ success: true, data: h });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/holidays/:date', protect(ADMIN), async (req, res) => {
  try {
    await Holiday.findOneAndDelete({ date: req.params.date });
    res.json({ success: true, message: 'Holiday removed.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════
// EXAM NAMES
// ══════════════════════════════════════════════
router.get('/exam-names', protect(ALL), async (req, res) => {
  try {
    const names = await ExamName.find().sort({ createdAt: 1 });
    res.json({ success: true, data: names.map(n => n.name) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/exam-names', protect(ADMIN), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required.' });
    const en = await ExamName.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
    res.status(201).json({ success: true, data: en });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/exam-names/:name', protect(ADMIN), async (req, res) => {
  try {
    await ExamName.findOneAndDelete({ name: decodeURIComponent(req.params.name) });
    res.json({ success: true, message: 'Exam name deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════
// CLASS CONFIG
// ══════════════════════════════════════════════
router.get('/class-config', protect(ALL), async (req, res) => {
  try {
    const configs = await ClassConfig.find();
    // Return as { Play: {sections:[...], subjects:[...]}, ... }
    const result = {};
    configs.forEach(c => { result[c.class] = { sections: c.sections, subjects: c.subjects }; });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/class-config/:class', protect(ADMIN), async (req, res) => {
  try {
    const { sections, subjects } = req.body;
    const cfg = await ClassConfig.findOneAndUpdate(
      { class: req.params.class },
      { sections, subjects },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: cfg });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════
// ADMISSION INFO
// ══════════════════════════════════════════════
router.get('/admission-info', async (req, res) => {
  try {
    const items = await AdmissionInfo.find();
    const result = {};
    items.forEach(i => { result[i.key] = i.value; });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/admission-info', protect(ADMIN), async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: { filter: { key }, update: { $set: { value } }, upsert: true }
    }));
    await AdmissionInfo.bulkWrite(ops);
    res.json({ success: true, message: 'Admission info updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════
// ADMINS (Super Admin manages admins)
// ══════════════════════════════════════════════
router.get('/admins', protect(SA), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/admins', protect(SA), async (req, res) => {
  try {
    const { username, password, name, email, phone } = req.body;
    if (!username || !password || !name)
      return res.status(400).json({ success: false, message: 'username, password, name required.' });
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username taken.' });
    const admin = await Admin.create({ username, password, name, email, phone, approved: true, addedBy: req.user.id });
    const plain = admin.toObject(); delete plain.password;
    res.status(201).json({ success: true, data: plain });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/admins/:id', protect(SA), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    Object.assign(admin, rest);
    if (password) admin.password = password;
    await admin.save();
    const plain = admin.toObject(); delete plain.password;
    res.json({ success: true, data: plain });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/admins/:id', protect(SA), async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════
// EMAIL LOG
// ══════════════════════════════════════════════
router.get('/email-log', protect(ADMIN), async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ sentAt: -1 }).limit(200);
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
