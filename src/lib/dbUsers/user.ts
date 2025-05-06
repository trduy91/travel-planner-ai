import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db }  from "@/lib/firebase"
// Types
export interface UserProfile {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt?: any;
    updatedAt?: any;
  }
  export const getUserData = async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as UserProfile : null;
  };
  
  export const createUserProfile = async (userId: string, userData: UserProfile): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };
  
  export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };
  