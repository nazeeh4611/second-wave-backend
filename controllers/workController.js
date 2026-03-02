import Work from '../models/Work.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all works (public)
// @route   GET /api/works
// @access  Public
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

// @desc    Get single work by slug
// @route   GET /api/works/:slug
// @access  Public
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



// @desc    Get all works (admin)
// @route   GET /api/works/admin/all
// @access  Private/Admin
export const getAdminWorks = async (req, res) => {
  try {
    const works = await Work.find().sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create work
// @route   POST /api/works
// @access  Private/Admin
export const createWork = async (req, res) => {
  try {
    console.log('Create work request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Admin:', req.admin?._id);

    const workData = { ...req.body };
    
    // Handle featured image
    if (req.file) {
      console.log('Featured image received:', req.file.originalname);
      workData.featuredImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    } else if (req.files && req.files.featuredImage) {
      console.log('Featured image received in files object');
      workData.featuredImage = {
        url: req.files.featuredImage[0].path,
        publicId: req.files.featuredImage[0].filename
      };
    }

    // Handle Instagram reel
    const hasReel = req.body.hasReel === 'true' || req.body.hasReel === true;
    console.log('Has reel:', hasReel);
    
    if (hasReel) {
      workData.instagramReel = {
        type: req.body.reelType || 'reel',
        url: req.body.reelUrl || '',
        embedUrl: req.body.reelUrl?.includes('instagram.com') 
          ? `https://www.instagram.com/p/${req.body.reelUrl.split('/p/')[1]?.split('/')[0]}/embed` 
          : req.body.reelUrl
      };
      
      // Handle reel thumbnail
      if (req.files && req.files.thumbnail) {
        console.log('Thumbnail received');
        workData.instagramReel.thumbnail = {
          url: req.files.thumbnail[0].path,
          publicId: req.files.thumbnail[0].filename
        };
      }
    }

    // Parse arrays
    ['results', 'tags'].forEach(field => {
      if (workData[field]) {
        try {
          if (Array.isArray(workData[field])) {
            workData[field] = workData[field];
          } else if (typeof workData[field] === 'string') {
            if (workData[field].startsWith('[')) {
              workData[field] = JSON.parse(workData[field]);
            } else {
              workData[field] = workData[field].split(',').map(item => item.trim()).filter(item => item);
            }
          }
        } catch (e) {
          console.log(`Error parsing ${field}:`, e);
          workData[field] = [];
        }
      } else {
        workData[field] = [];
      }
    });

    // Create work
    const work = await Work.create(workData);
    console.log('Work created with ID:', work._id);
    
    res.status(201).json(work);
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update work
// @route   PUT /api/works/:id
// @access  Private/Admin
// In workController.js — updateWork fix
export const updateWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    const workData = { ...req.body };

    // ✅ FIXED: handle req.files.featuredImage (from .fields())
    const featuredImageFile = req.file || req.files?.featuredImage?.[0];
    
    if (featuredImageFile) {
      if (work.featuredImage?.publicId) {
        try {
          await cloudinary.uploader.destroy(work.featuredImage.publicId);
        } catch (e) {
          console.error('Error deleting old image:', e);
        }
      }
      workData.featuredImage = {
        url: featuredImageFile.path,
        publicId: featuredImageFile.filename
      };
    }

    // ✅ Handle reel thumbnail on update too
    const hasReel = req.body.hasReel === 'true' || req.body.hasReel === true;
    if (hasReel) {
      workData.instagramReel = {
        type: req.body.reelType || 'reel',
        url: req.body.reelUrl || '',
        embedUrl: req.body.reelUrl?.includes('instagram.com')
          ? `https://www.instagram.com/p/${req.body.reelUrl.split('/p/')[1]?.split('/')[0]}/embed`
          : req.body.reelUrl
      };

      const thumbnailFile = req.files?.thumbnail?.[0];
      if (thumbnailFile) {
        if (work.instagramReel?.thumbnail?.publicId) {
          try { await cloudinary.uploader.destroy(work.instagramReel.thumbnail.publicId); } catch(e) {}
        }
        workData.instagramReel.thumbnail = {
          url: thumbnailFile.path,
          publicId: thumbnailFile.filename
        };
      } else if (work.instagramReel?.thumbnail) {
        // Keep existing thumbnail
        workData.instagramReel.thumbnail = work.instagramReel.thumbnail;
      }
    }

    // Parse arrays
    ['results', 'tags'].forEach(field => {
      if (workData[field]) {
        if (typeof workData[field] === 'string') {
          try {
            workData[field] = workData[field].startsWith('[')
              ? JSON.parse(workData[field])
              : workData[field].split(',').map(i => i.trim()).filter(Boolean);
          } catch (e) {
            workData[field] = [];
          }
        }
      }
    });

    const updatedWork = await Work.findByIdAndUpdate(
      req.params.id,
      workData,
      { new: true, runValidators: true }
    );

    res.json(updatedWork);
  } catch (error) {
    console.error('Error updating work:', error);
    if (error.response?.status === 401 || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete work
// @route   DELETE /api/works/:id
// @access  Private/Admin
export const deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    // Delete images from cloudinary
    if (work.featuredImage?.publicId) {
      await cloudinary.uploader.destroy(work.featuredImage.publicId);
    }
    
    if (work.instagramReel?.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(work.instagramReel.thumbnail.publicId);
    }

    // Delete gallery images
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


export const getWorkById = async (req, res) => {
  try {
    console.log('Fetching work by ID:', req.params.id);
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json(work);
  } catch (error) {
    console.error('Error fetching work by ID:', error);
    res.status(500).json({ message: error.message });
  }
};