import mongoose from 'mongoose';

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    enum: ['branding', 'seo', 'web', 'performance', 'social', 'creative', 'production', 'pr']
  },
  client: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  results: [{
    type: String
  }],
  tags: [{
    type: String
  }],

  // Live website link (for web projects or any external URL)
  liveUrl: {
    type: String,
    default: ''
  },

  // Media
  featuredImage: {
    url: String,
    publicId: String
  },

  // Instagram Reel support
  instagramReel: {
    type: {
      type: String,
      enum: ['reel', 'post'],
      default: 'reel'
    },
    url: String,
    thumbnail: {
      url: String,
      publicId: String
    },
    embedUrl: String
  },

  // Gallery images
  gallery: [{
    url: String,
    publicId: String,
    caption: String
  }],

  // Case study details
  caseStudy: {
    overview: String,
    challenge: String,
    solution: String,
    results: String,
    testimonial: {
      quote: String,
      author: String,
      position: String
    }
  },

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  // Status
  isPublished: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

workSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

workSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

export default mongoose.model('Work', workSchema);