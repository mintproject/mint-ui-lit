import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { FIREBASE_GOOGLE_API_KEY } from "./google-api-key";

const firebaseConfig = {
    apiKey: FIREBASE_GOOGLE_API_KEY,
    authDomain: "mint-1523532371081.firebaseapp.com",
    databaseURL: "https://mint-1523532371081.firebaseio.com",
    projectId: "mint-1523532371081",
    storageBucket: "mint-1523532371081.appspot.com",
    messagingSenderId: "132628915232",
    appId: "1:132628915232:web:c139f772cdfebc47"
};
export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
