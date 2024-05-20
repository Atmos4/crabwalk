import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp({
	apiKey: 'AIzaSyCJkOqtDhwPYjRonHTKdMrWVWJFAOdjcXc',
	authDomain: 'crabwalk-64ecb.firebaseapp.com',
	projectId: 'crabwalk-64ecb',
	storageBucket: 'crabwalk-64ecb.appspot.com',
	messagingSenderId: '943485216193',
	appId: '1:943485216193:web:2134d9beda5b79689b7b40'
});
export const firestore = getFirestore(app);
export const auth = getAuth(app);
