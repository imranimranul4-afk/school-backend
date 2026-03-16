// ═══════════════════════════════════════════
// models/SuperAdmin.js
// ═══════════════════════════════════════════
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SuperAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name:     { type: String, default: 'Super Admin' },
  email:    { type: String, default: '' },
  phone:    { type: String, default: '' },
  photo:    { type: String, default: '' },
}, { timestamps: true });

SuperAdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

SuperAdminSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('SuperAdmin', SuperAdminSchema);
