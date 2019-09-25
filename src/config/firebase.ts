import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { FIREBASE_GOOGLE_API_KEY } from "./google-api-key";

const firebaseConfig = {
    apiKey: FIREBASE_GOOGLE_API_KEY,
    authDomain: "mint-full.firebaseapp.com",
    databaseURL: "https://mint-full.firebaseio.com",
    projectId: "mint-full",
    storageBucket: "mint-full.appspot.com",
    messagingSenderId: "128464392367",
    appId: "1:128464392367:web:97eaa44bc1fcb5296c445a"   
    
};
export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
