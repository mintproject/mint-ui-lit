import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { FIREBASE_PROD_CONF, FIREBASE_DEV_CONF } from "./google-api-key";

console.log("Initializing", process.env.NODE_ENV, "database");

let firebaseConfig;

console.log("> Using " + process.env.NODE_ENV + " server");
if (process.env.NODE_ENV === "production") {
    firebaseConfig = FIREBASE_PROD_CONF;
} else {
    firebaseConfig = FIREBASE_DEV_CONF;
}

export const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth(app);
export const db = firebase.firestore(app);
export const fieldValue = firebase.firestore.FieldValue;
