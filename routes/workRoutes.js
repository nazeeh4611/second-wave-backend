// routes/workRoutes.js
import express from 'express';
import { 
  getWorks, 
  getWorkBySlug,
  getWorkById,
  getAdminWorks,
  createWork, 
  updateWork, 
  deleteWork 
} from '../controllers/workController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImage } from '../utils/upload.js';

const router = express.Router();

// ✅ SPECIFIC routes FIRST (before any /:param routes)
router.get('/admin/all', protect, getAdminWorks);

// ✅ Public routes
router.get('/', getWorks);

// ✅ Create
router.post(
  '/', 
  protect, 
  uploadImage.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createWork
);

// ✅ Update - also use fields() instead of single() so thumbnail is handled too
router.put(
  '/:id', 
  protect, 
  uploadImage.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  updateWork
);

// ✅ Delete
router.delete('/:id', protect, deleteWork);

// ✅ Dynamic param routes LAST
router.get('/:id', protect, getWorkById);
router.get('/:slug', getWorkBySlug);

// Error handler
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 5MB' });
  }
  next(error);
});

export default router;