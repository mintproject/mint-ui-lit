import * as firebase from 'firebase/app';
import 'firebase/firestore';

export const toTimeStamp = (dateString: string) : firebase.firestore.Timestamp => {
    return firebase.firestore.Timestamp.fromDate(new Date(dateString));
}

export const fromTimeStamp = (timestamp: firebase.firestore.Timestamp) : Date => {
    return timestamp.toDate();
}

export const fromTimeStampToString = (timestamp: firebase.firestore.Timestamp) : string => {
    console.log(timestamp);
    if(timestamp instanceof firebase.firestore.Timestamp) {
        return timestamp.toDate().toISOString();
    }
    else {
        return timestamp;
    }
}

export const fromTimeStampToDateString = (timestamp: firebase.firestore.Timestamp) : string => {
    return fromTimeStampToString(timestamp).replace(/T.*$/,'');
}