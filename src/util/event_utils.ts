import { MintEvent } from "screens/modeling/reducers";

export const getAllEventsOfType = (types: string[], events: MintEvent[]) : MintEvent[] => {
    let typeEvents = [];
    events.forEach((event) => {
        if(types.indexOf(event.event) >= 0) {
            typeEvents.push(event);
        }
    })
    return typeEvents;
}

export const getLatestEventOfType = (types: string[], events: MintEvent[]) : MintEvent => {
    let latestEvent : MintEvent = null;
    events.forEach((event) => {
        if(types.indexOf(event.event) >= 0) {
            if(!latestEvent || event.timestamp > latestEvent.timestamp)
                latestEvent = event;
        }
    })
    return latestEvent;
}

export const getLatestEvent = (events: MintEvent[]) : MintEvent => {
    let latestEvent : MintEvent = null;
    events.forEach((event) => {
        if(!latestEvent || event.timestamp > latestEvent.timestamp)
            latestEvent = event;
    })
    return latestEvent;
}

export const getCreator = (events: MintEvent[]) : String => {
    let creator = null;
    events.forEach((event) => {
        if(event.event == "CREATE")
            creator = event.userid
    })
    return creator;
}