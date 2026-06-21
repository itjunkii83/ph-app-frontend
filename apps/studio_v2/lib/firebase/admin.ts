import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = require('../../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'humanos-8eeb8.firebasestorage.app',
  });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export default admin;
