const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AssignmentSchema = new mongoose.Schema({
  class:   String,
  section: String,
  subject: String,
}, { _id: false });

const TeacherSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true },
  name:        { type: String, required: true },
  email:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  bio:         { type: String, default: '' },
  photo:       { type: String, default: '' },
  approved:    { type: Boolean, default: false },
  assignments: [AssignmentSchema],
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

TeacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

TeacherSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Teacher', TeacherSchema);
