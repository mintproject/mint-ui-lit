import * as firebase from 'firebase/app';
import 'firebase/firestore';

export const toTimeStamp = (dateString: string) : firebase.firestore.Timestamp => {
    return firebase.firestore.Timestamp.fromDate(new Date(dateString));
}

export const toTimeStampFromDate = (date: Date) : firebase.firestore.Timestamp => {
    return firebase.firestore.Timestamp.fromDate(date);
}

export const fromTimestampIntegerToString = (timestamp: number) : string => {
    return new Date(timestamp).toISOString().replace(/\.000Z$/, '');
}

export const fromTimestampIntegerToReadableString = (timestamp: number) : string => {
    return fromTimestampIntegerToString(timestamp).replace(/T/,' at ').replace(/\..+$/,'');
}

export const fromTimestampIntegerToDateString = (timestamp: number) : string => {
    return fromTimestampIntegerToString(timestamp).replace(/T.*$/,'');
}

export const fromTimeStamp = (timestamp: firebase.firestore.Timestamp) : Date => {
    return timestamp.toDate();
}

export const fromTimeStampToString = (timestamp: firebase.firestore.Timestamp) : string => {
    if(timestamp instanceof firebase.firestore.Timestamp) {
        return timestamp.toDate().toISOString();
    }
    else {
        return timestamp;
    }
}

export const fromTimeStampToString2 = (timestamp: firebase.firestore.Timestamp) : string => {
    if(timestamp instanceof firebase.firestore.Timestamp) {
        return timestamp.toDate().toISOString().replace(/\.000Z$/, '');
    }
    else {
        return timestamp;
    }
}

export const fromTimeStampToDateString = (timestamp: firebase.firestore.Timestamp) : string => {
    return fromTimeStampToString(timestamp).replace(/T.*$/,'');
}

export const fromTimeStampToReadableString = (timestamp: firebase.firestore.Timestamp) : string => {
    return fromTimeStampToString(timestamp).replace(/T/,' at ').replace(/\..+$/,'');
}