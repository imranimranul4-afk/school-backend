const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PaymentSchema = new mongoose.Schema({
  monthly: {
    Jan: Boolean, Feb: Boolean, Mar: Boolean, Apr: Boolean,
    May: Boolean, Jun: Boolean, Jul: Boolean, Aug: Boolean,
    Sep: Boolean, Oct: Boolean, Nov: Boolean, Dec: Boolean,
  },
  registrationFee: { type: Boolean, default: false },
  admissionFee:    { type: Boolean, default: false },
  monthlyFeeAmount:{ type: Number, default: 0 },
}, { _id: false });

const PaymentHistorySchema = new mongoose.Schema({
  date:   String,
  type:   String,
  method: String,
  txnId:  String,
  amount: Number,
  status: { type: String, enum: ['success','failed'], default: 'success' },
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  studentId:     { type: String, unique: true },   // e.g. STD123456
  username:      { type: String, unique: true, trim: true },
  password:      { type: String, required: true },
  name:          { type: String, required: true },
  class:         { type: String, required: true },
  section:       { type: String, required: true },
  roll:          { type: Number, default: 0 },
  gender:        { type: String, default: '' },
  dob:           { type: String, default: '' },
  bloodGroup:    { type: String, default: '' },
  photo:         { type: String, default: '' },
  guardianName:  { type: String, default: '' },
  guardianNumber:{ type: String, default: '' },
  studentEmail:  { type: String, default: '' },
  paymentYear:   { type: Number, default: new Date().getFullYear() },
  payments:      { type: PaymentSchema, default: () => ({
    monthly: { Jan:false,Feb:false,Mar:false,Apr:false,May:false,Jun:false,
               Jul:false,Aug:false,Sep:false,Oct:false,Nov:false,Dec:false },
    registrationFee: false,
    admissionFee: false,
    monthlyFeeAmount: 0,
  })},
  paymentHistory: [PaymentHistorySchema],
  graduated:     { type: Boolean, default: false },
  graduatedAt:   { type: String, default: '' },
  originalClass: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate studentId
StudentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    this.studentId = 'STD' + Date.now().toString().slice(-6);
  }
  if (this.isModified('password')) {
    this.password = await require('bcryptjs').hash(this.password, 12);
  }
  next();
});

StudentSchema.methods.comparePassword = async function(plain) {
  return require('bcryptjs').compare(plain, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);
