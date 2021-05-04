import { MintPreferences } from "app/reducers";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import * as mintConfig from './config.json';

let prefs = mintConfig["default"] as MintPreferences;
let firebaseConfig = prefs.firebasePreferences;
export const GOOGLE_API_KEY = prefs.google_maps_key;
export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
