import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyADW7cQC6jrmLcqFxm6XjlJhjcwSNihI90",
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
