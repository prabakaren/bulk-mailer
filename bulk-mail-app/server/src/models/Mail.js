import mongoose from 'mongoose';

const mailSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    recipients: { type: [String], required: true },
    status: { type: String, enum: ['sent', 'partial', 'failed'], required: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    failures: [
      {
        email: String,
        error: String,
        _id: false,
      },
    ],
    sentBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Mail || mongoose.model('Mail', mailSchema);
