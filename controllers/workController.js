import Work from '../models/Work.js';
import { v2 as cloudinary } from 'cloudinary';

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

// GET /api/works
export const getWorks = async (req, res) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;

    const query = { isPublished: true };
    if (category && category !== 'all') {
      query.category = category;
    }

    const works = await Work.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Work.countDocuments(query);

    res.json({
      works,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/works/slug/:slug
export const getWorkBySlug = async (req, res) => {
  try {
    const work = await Work.findOne({
      slug: req.params.slug,
      isPublished: true
    });

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    res.json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

// GET /api/works/admin/all
export const getAdminWorks = async (req, res) => {
  try {
    const works = await Work.find().sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/works/admin/:id
export const getWorkById = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function parseArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    if (typeof value === 'string' && value.startsWith('[')) {
      return JSON.parse(value);
    }
    return value.split(',').map(i => i.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function buildInstagramReel(body, files, existing = null) {
  const hasReel = body.hasReel === 'true' || body.hasReel === true;
  if (!hasReel) return undefined;

  const url = body.reelUrl || '';
  let embedUrl = url;
  if (url.includes('instagram.com/p/')) {
    const code = url.split('/p/')[1]?.split('/')[0];
    if (code) embedUrl = `https://www.instagram.com/p/${code}/embed`;
  } else if (url.includes('instagram.com/reel/')) {
    const code = url.split('/reel/')[1]?.split('/')[0];
    if (code) embedUrl = `https://www.instagram.com/reel/${code}/embed`;
  }

  const reel = {
    type: body.reelType || 'reel',
    url,
    embedUrl
  };

  const thumbnailFile = files?.thumbnail?.[0];
  if (thumbnailFile) {
    reel.thumbnail = {
      url: thumbnailFile.path,
      publicId: thumbnailFile.filename
    };
  } else if (existing?.thumbnail) {
    reel.thumbnail = existing.thumbnail;
  }

  return reel;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

// POST /api/works
export const createWork = async (req, res) => {
  try {
    const workData = { ...req.body };

    // Featured image
    const featuredFile = req.files?.featuredImage?.[0];
    if (featuredFile) {
      workData.featuredImage = {
        url: featuredFile.path,
        publicId: featuredFile.filename
      };
    }

    // Instagram reel
    const reel = buildInstagramReel(req.body, req.files);
    if (reel) workData.instagramReel = reel;

    // Arrays
    workData.results = parseArrayField(workData.results);
    workData.tags = parseArrayField(workData.tags);

    // Case study (JSON string from form)
    if (workData.caseStudy && typeof workData.caseStudy === 'string') {
      try { workData.caseStudy = JSON.parse(workData.caseStudy); } catch { delete workData.caseStudy; }
    }

    // SEO (JSON string from form)
    if (workData.seo && typeof workData.seo === 'string') {
      try { workData.seo = JSON.parse(workData.seo); } catch { delete workData.seo; }
    }

    const work = await Work.create(workData);
    res.status(201).json(work);
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

// PUT /api/works/:id
export const updateWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    const workData = { ...req.body };

    // Featured image
    const featuredFile = req.files?.featuredImage?.[0];
    if (featuredFile) {
      if (work.featuredImage?.publicId) {
        try { await cloudinary.uploader.destroy(work.featuredImage.publicId); } catch (e) {
          console.error('Error deleting old featured image:', e);
        }
      }
      workData.featuredImage = {
        url: featuredFile.path,
        publicId: featuredFile.filename
      };
    }

    // Instagram reel — delete old thumbnail if replaced
    const reel = buildInstagramReel(req.body, req.files, work.instagramReel);
    if (reel) {
      const newThumbnailFile = req.files?.thumbnail?.[0];
      if (newThumbnailFile && work.instagramReel?.thumbnail?.publicId) {
        try { await cloudinary.uploader.destroy(work.instagramReel.thumbnail.publicId); } catch {}
      }
      workData.instagramReel = reel;
    } else {
      // User removed the reel — clean up thumbnail from cloudinary
      if (work.instagramReel?.thumbnail?.publicId) {
        try { await cloudinary.uploader.destroy(work.instagramReel.thumbnail.publicId); } catch {}
      }
      workData.instagramReel = undefined;
    }

    // Arrays
    if (req.body.results !== undefined) workData.results = parseArrayField(workData.results);
    if (req.body.tags !== undefined) workData.tags = parseArrayField(workData.tags);

    // Case study
    if (workData.caseStudy && typeof workData.caseStudy === 'string') {
      try { workData.caseStudy = JSON.parse(workData.caseStudy); } catch { delete workData.caseStudy; }
    }

    // SEO
    if (workData.seo && typeof workData.seo === 'string') {
      try { workData.seo = JSON.parse(workData.seo); } catch { delete workData.seo; }
    }

    const updatedWork = await Work.findByIdAndUpdate(
      req.params.id,
      workData,
      { new: true, runValidators: true }
    );

    res.json(updatedWork);
  } catch (error) {
    console.error('Error updating work:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

// DELETE /api/works/:id
export const deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    if (work.featuredImage?.publicId) {
      await cloudinary.uploader.destroy(work.featuredImage.publicId);
    }

    if (work.instagramReel?.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(work.instagramReel.thumbnail.publicId);
    }

    if (work.gallery?.length) {
      for (const image of work.gallery) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await work.deleteOne();
    res.json({ message: 'Work removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};