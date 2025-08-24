import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler } from './errorHandler';

// Interface pour les requêtes authentifiées
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware d'authentification
export const authenticate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Récupérer le token depuis l'en-tête Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Accès refusé. Token requis.' }
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token invalide. Utilisateur non trouvé.' }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Compte désactivé.' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token invalide.' }
    });
  }
});

// Middleware d'autorisation par rôle
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Accès refusé. Authentification requise.' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Accès refusé. Permissions insuffisantes.' }
      });
    }

    next();
  };
};

// Middleware pour les admins seulement
export const adminOnly = authorize('admin');

// Middleware optionnel (utilisateur connecté ou non)
export const optionalAuth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Ignorer les erreurs de token pour l'auth optionnelle
    }
  }

  next();
});
