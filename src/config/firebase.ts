import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { GOOGLE_API_KEY } from "./google-api-key";

const firebaseConfig = {
    apiKey: GOOGLE_API_KEY,
    authDomain: "mint-demo-9bf45.firebaseapp.com",
    databaseURL: "https://mint-demo-9bf45.firebaseio.com",
    projectId: "mint-demo-9bf45",
    storageBucket: "mint-demo-9bf45.appspot.com",
    messagingSenderId: "506125229598",
    appId: "1:506125229598:web:6c6ce25b2521d883"
};
export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
