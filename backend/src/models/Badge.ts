import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String }, // Lucide icon name or URL
  category: { type: String, enum: ['academic', 'participation', 'skill', 'milestone', 'Achievement', 'Performance', 'Speed', 'Skill'], default: 'skill' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export const Badge = mongoose.model('Badge', badgeSchema);
