import { MintPreferences } from "app/reducers";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import * as mintConfig from './config.json';

let prefs = mintConfig["default"] as MintPreferences;

let firebaseConfig = {
    "apiKey": process.env.FIREBASE_API_KEY,
    "authDomain": process.env.FIREBASE_AUTH_DOMAIN,
    "databaseURL": process.env.FIREBASE_DATABASE_URL,
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "storageBucket": process.env.FIREBASE_STORAGE_BUCKET,
    "messagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
    "appId": process.env.FIREBASE_APP_ID,
}

export const GOOGLE_API_KEY = prefs.google_maps_key;
export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
