import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { IdMap, IdNameObject } from "app/reducers";
import { THREAD_SUBSCRIPTION, POST_LIST, THREAD_LIST } from "./actions";

export interface MessagesState {
    threads?: ThreadList
    thread?: Thread
    posts?: PostList
}

export interface ThreadList {
    threadids: string[]
    threads: IdMap<Thread>
}

export interface Thread extends IdNameObject {
    text: string,
    reference: ThreadReference,
    timestamp: firebase.firestore.Timestamp,
    unsubscribe: Function,
    userid: string,
    username: string,
    posts: PostList
}

export interface ThreadReference {
    scenarioid: string,
    subgoalid? : string,
    pathwayid? : string
}

export interface PostList {
    postids: string[]
    posts: IdMap<Post>
}

export interface Post extends IdNameObject {
    text: string,
    userid: string,
    username: string,
    reference: ThreadReference,
    timestamp: firebase.firestore.Timestamp
}


const INITIAL_STATE: MessagesState = {};
const messages: Reducer<MessagesState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case THREAD_LIST:
            return {
                ...state,
                threads: action.list
            }        
        case POST_LIST:
            return {
                ...state,
                posts: action.list
            }
        case THREAD_SUBSCRIPTION: 
            let thread_sub = {
                ...state.thread,
                unsubscribe: action.unsubscribe
            } as Thread
            return {
                ...state,
                thread: thread_sub
            }
        default:
            return state;    
    }
    return state;
}

export default messages;