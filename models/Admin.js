const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  name:      { type: String, required: true },
  email:     { type: String, default: '' },
  phone:     { type: String, default: '' },
  photo:     { type: String, default: '' },
  role:      { type: String, default: 'admin' },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  approved:  { type: Boolean, default: false },
}, { timestamps: true });

AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

AdminSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
