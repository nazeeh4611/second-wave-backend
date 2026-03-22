import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  location: { type: String, trim: true },
  type: { type: String, trim: true },
  experience: { type: String, trim: true },
  salary: { type: String, trim: true },
  overview: { type: String, trim: true },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  niceToHave: [{ type: String }],
  perks: [{ type: String }],
  isPublished: { type: Boolean, default: true },
  isNew: { type: Boolean, default: true },
}, { timestamps: true });

const Career = mongoose.model('Career', careerSchema);
export default Career;