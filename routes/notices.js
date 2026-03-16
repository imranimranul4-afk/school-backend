// ═══════════════════════════════════════════════════
// routes/notices.js
// ═══════════════════════════════════════════════════
const router = require('express').Router();
const { Notice } = require('../models/index');
const { protect } = require('../middleware/auth');
const ADMIN = ['superadmin','admin'];

router.get('/', async (req, res) => {
  try {
    const { important } = req.query;
    const filter = {};
    if (important === 'true') filter.important = true;
    const notices = await Notice.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: notices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect(ADMIN), async (req, res) => {
  try {
    const { title, content, category, date, important } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'title and content required.' });
    const notice = await Notice.create({ title, content, category, date, important, createdBy: req.user.id });
    res.status(201).json({ success: true, data: notice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect(ADMIN), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.json({ success: true, data: notice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect(ADMIN), async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
