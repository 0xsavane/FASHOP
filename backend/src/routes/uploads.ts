import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// Configuration de stockage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour les types de fichiers
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.'), false);
  }
};

// Configuration multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// @route   POST /api/v1/uploads/image
// @desc    Upload d'une image
// @access  Private (Admin)
router.post('/image', authenticate, adminOnly, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'Aucun fichier fourni' }
    });
  }

  try {
    const { filename, path: filePath } = req.file;
    
    // Optimiser l'image avec Sharp
    const optimizedPath = path.join(path.dirname(filePath), 'opt-' + filename);
    
    await sharp(filePath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Supprimer l'original
    fs.unlinkSync(filePath);

    const imageUrl = `/uploads/opt-${filename}`;

    res.json({
      success: true,
      data: {
        filename: 'opt-' + filename,
        url: imageUrl,
        size: fs.statSync(optimizedPath).size
      },
      message: 'Image uploadée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors du traitement de l\'image' }
    });
  }
}));

// @route   POST /api/v1/uploads/images
// @desc    Upload multiple d'images
// @access  Private (Admin)
router.post('/images', authenticate, adminOnly, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Aucun fichier fourni' }
    });
  }

  try {
    const uploadedImages = [];

    for (const file of req.files) {
      const { filename, path: filePath } = file;
      
      // Optimiser l'image
      const optimizedPath = path.join(path.dirname(filePath), 'opt-' + filename);
      
      await sharp(filePath)
        .resize(800, 800, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);

      // Supprimer l'original
      fs.unlinkSync(filePath);

      uploadedImages.push({
        filename: 'opt-' + filename,
        url: `/uploads/opt-${filename}`,
        size: fs.statSync(optimizedPath).size
      });
    }

    res.json({
      success: true,
      data: { images: uploadedImages },
      message: `${uploadedImages.length} images uploadées avec succès`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors du traitement des images' }
    });
  }
}));

// @route   DELETE /api/v1/uploads/:filename
// @desc    Supprimer une image
// @access  Private (Admin)
router.delete('/:filename', authenticate, adminOnly, asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fichier non trouvé' }
    });
  }

  try {
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la suppression' }
    });
  }
}));

export default router;
