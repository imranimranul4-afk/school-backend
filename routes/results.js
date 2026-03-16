const router = require('express').Router();
const { Result } = require('../models/index');
const { protect } = require('../middleware/auth');

const TEACHER = ['superadmin','admin','teacher'];

// ── GET /api/results?studentId=&examName=&class= ──
router.get('/', protect(['superadmin','admin','teacher','student']), async (req, res) => {
  try {
    const { studentId, examName, class: cls, section } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (examName)  filter.examName  = examName;
    if (cls)       filter.class     = cls;
    if (section)   filter.section   = section;
    const results = await Result.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/results  (upsert) ───────────────────
router.post('/', protect(TEACHER), async (req, res) => {
  try {
    const { studentId, examName, class: cls, section, subjects } = req.body;
    if (!studentId || !examName || !cls || !subjects)
      return res.status(400).json({ success: false, message: 'studentId, examName, class, subjects required.' });

    const result = await Result.findOneAndUpdate(
      { studentId, examName, class: cls },
      { section, subjects, enteredBy: req.user.id },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, data: result, message: 'Result saved.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/results/bulk  (save many at once) ───
router.post('/bulk', protect(TEACHER), async (req, res) => {
  try {
    const { results } = req.body; // [{studentId, examName, class, section, subjects}]
    if (!Array.isArray(results) || !results.length)
      return res.status(400).json({ success: false, message: 'results array required.' });

    const ops = results.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, examName: r.examName, class: r.class },
        update: { $set: { section: r.section, subjects: r.subjects, enteredBy: req.user.id } },
        upsert: true,
      }
    }));
    await Result.bulkWrite(ops);
    res.json({ success: true, message: `${results.length} results saved.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/results/:id ───────────────────────
router.delete('/:id', protect(TEACHER), async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Result deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
