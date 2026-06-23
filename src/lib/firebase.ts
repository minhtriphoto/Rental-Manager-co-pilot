import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure Firebase is initialized correctly
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestore database ID from config if defined
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
