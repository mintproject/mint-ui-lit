import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
//import dotenv from "dotenv";
//import { FIREBASE_GOOGLE_API_KEY } from "./google-api-key";
import { FIREBASE_PROD_CONF, FIREBASE_DEV_CONF } from "./google-api-key";

/*if (process.env.NODE_ENV === "production") {
    dotenv.config({ path: '../../.env' })
} else {
    dotenv.config({ path: '../../.env.dev' })
};*/

console.log("Initializing", process.env.NODE_ENV, "database");

let firebaseConfig;

if (process.env.NODE_ENV === "production") {
    firebaseConfig = FIREBASE_PROD_CONF;
} else {
    firebaseConfig = FIREBASE_DEV_CONF;
}

/*const firebaseConfig = {
    apiKey: FIREBASE_GOOGLE_API_KEY,
    authDomain: "mint-full.firebaseapp.com",
    databaseURL: "https://mint-full.firebaseio.com",
    projectId: "mint-full",
    storageBucket: "mint-full.appspot.com",
    messagingSenderId: "128464392367",
    appId: "1:128464392367:web:97eaa44bc1fcb5296c445a"
};

/*const firebaseConfig = {
    apiKey: process.env.FIREBASE_GOOGLE_API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId:  process.env.PROJECT_ID,
    storageBucket:  process.env.STORAGE_BUCKET,
    messagingSenderId:  process.env.MESSAGING_SENDER_ID,
    appId:  process.env.APP_ID,
};*/


export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
