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

const multiUpload = uploadImage.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// ── Public routes ──────────────────────────────────────────────
router.get('/', getWorks);

// slug route MUST come before any /:param admin routes
router.get('/slug/:slug', getWorkBySlug);

// ── Admin / protected routes ───────────────────────────────────
router.get('/admin/all', protect, getAdminWorks);
router.get('/admin/:id', protect, getWorkById);

router.post('/', protect, multiUpload, createWork);
router.put('/:id', protect, multiUpload, updateWork);
router.delete('/:id', protect, deleteWork);

// ── Error handler ──────────────────────────────────────────────
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 5MB' });
  }
  next(error);
});

export default router;