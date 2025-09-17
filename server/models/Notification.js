import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  reportId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  }
}, { timestamps: true });

// 👇 Use 'export default' here to make it the default export
export default mongoose.model('Notification', notificationSchema);