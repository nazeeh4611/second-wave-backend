import express from 'express';
import {
  getCareers,
  getCareerById,
  getAdminCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  applyToCareer,
} from '../controllers/Careercontroller.js';
import { protect } from '../middleware/authMiddleware.js';

const careerrouter = express.Router();

careerrouter.get('/admin/all', protect, getAdminCareers);

careerrouter.get('/', getCareers);
careerrouter.post('/', protect, createCareer);

careerrouter.get('/:id', getCareerById);
careerrouter.put('/:id', protect, updateCareer);
careerrouter.delete('/:id', protect, deleteCareer);
careerrouter.post('/:id/apply', applyToCareer);

careerrouter.use((error, req, res, next) => {
  res.status(500).json({ message: error.message });
});

export default careerrouter;