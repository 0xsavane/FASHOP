import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashop';
    
    await mongoose.connect(mongoUri, {
      // Options de connexion modernes
      maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    });

    console.log(`📊 MongoDB connecté: ${mongoUri}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (error) => {
      console.error('❌ Erreur MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnecté');
    });

  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB déconnecté');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion MongoDB:', error);
    throw error;
  }
}
