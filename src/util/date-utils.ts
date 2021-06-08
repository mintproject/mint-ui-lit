export const fromTimestampIntegerToString = (timestamp: number) : string => {
    return new Date(timestamp).toISOString().replace(/\.000Z$/, '');
}

export const fromTimestampIntegerToReadableString = (timestamp: number) : string => {
    return fromTimestampIntegerToString(timestamp).replace(/T/,' at ').replace(/\..+$/,'');
}

export const fromTimestampIntegerToDateString = (timestamp: number) : string => {
    return fromTimestampIntegerToString(timestamp).replace(/T.*$/,'');
}

export const toDateString = (date: Date) : string => {
    if(!date)
        return null;
    return date.toISOString().split('T')[0]
}

export const toDateTimeString = (date: Date) : string => {
    if(!date)
        return null;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}