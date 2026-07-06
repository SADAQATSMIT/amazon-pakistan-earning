import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ActivityLog } from '../types';

export const logActivity = async (
  userId: string, 
  userName: string | undefined, 
  action: ActivityLog['action'], 
  details: string
) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      userName,
      action,
      details,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
