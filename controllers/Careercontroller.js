import Career from '../models/Career.js';

export const getCareers = async (req, res) => {
  try {
    const careers = await Career.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCareerById = async (req, res) => {
  try {
    const career = await Career.findOne({ _id: req.params.id, isPublished: true });
    if (!career) return res.status(404).json({ message: 'Job not found' });
    res.json(career);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCareer = async (req, res) => {
  try {
    const career = await Career.create(req.body);
    res.status(201).json(career);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!career) return res.status(404).json({ message: 'Job not found' });
    res.json(career);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ message: 'Job not found' });
    await career.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyToCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ message: 'Job not found' });
    console.log('Application received for:', career.title, req.body);
    res.json({ message: 'Application received' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};