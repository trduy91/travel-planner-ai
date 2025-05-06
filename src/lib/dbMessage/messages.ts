import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: any; // Firestore timestamp
}

export const sendMessage = async (userId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<void> => {
    const messagesRef = collection(db, 'users', userId, 'messages');
    await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp(),
    });
};

export const subscribeToMessages = (
    userId: string,
    callback: (messages: Message[]) => void
): (() => void) => {
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Message[];
        callback(messages);
    });
};