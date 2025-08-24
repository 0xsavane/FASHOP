import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Interface pour les erreurs personnalisées
export interface CustomError extends Error {
  statusCode?: number;
  code?: string | number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

// Middleware pour les routes non trouvées
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`) as CustomError;
  error.statusCode = 404;
  next(error);
};

// Gestionnaire d'erreurs principal
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Erreur interne du serveur';

  // Erreur de validation Mongoose
  if (error.name === 'ValidationError' && error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const errors = Object.values(error.errors).map(err => err.message);
    message = `Erreurs de validation: ${errors.join(', ')}`;
  }

  // Erreur de duplication MongoDB (code 11000)
  if (error.code === 11000 && error.keyValue) {
    statusCode = 400;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} existe déjà`;
  }

  // Erreur ObjectId invalide
  if (error.name === 'CastError' && error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'ID invalide';
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Log de l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Erreur:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Réponse d'erreur
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        originalError: error.message 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Wrapper pour les fonctions async
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
