import { Action, ActionCreator } from "redux";
import { ThreadList, PostList, Thread, Post } from "./reducers";
import { ThunkAction } from "redux-thunk";
import { RootState } from "app/store";
import { db } from "config/firebase";
import { IdMap } from "app/reducers";
import { toTimeStampFromDate } from "util/date-utils";

export const THREAD_LIST = 'THREAD_LIST';
export const POST_LIST = 'POST_LIST';
export const THREAD_SUBSCRIPTION = 'THREAD_SUBSCRIPTION';

export interface MessagesActionThreadList extends Action<'THREAD_LIST'> { 
    list: ThreadList
};

export interface MessagesActionPostList extends Action<'POST_LIST'> { 
    threadid: string,
    list: PostList
};

export interface MessagesActionThreadSubscription extends Action<'THREAD_SUBSCRIPTION'> { 
    threadid: string,
    unsubscribe: Function
};

// List Scenarios
type ThreadListThunkResult = ThunkAction<void, RootState, undefined, MessagesActionThreadList>;
export const listThreads: ActionCreator<ThreadListThunkResult> = () => (dispatch) => {
    db.collection("message_threads").onSnapshot((querySnapshot) => {
        let threads:IdMap<Thread> = {};
        let threadids:string[] = [];
        querySnapshot.forEach((sdoc) => {
            var data = sdoc.data();
            data.id = sdoc.id;
            threads[sdoc.id] = data as Thread;
            threadids.push(sdoc.id);
        });

        let list = {
            threadids: threadids,
            threads: threads
        } as ThreadList;

        dispatch({
            type: THREAD_LIST,
            list
        })
    });
};

// List Scenarios
type PostListThunkResult = ThunkAction<void, RootState, undefined, MessagesActionPostList | MessagesActionThreadSubscription>;
export const listPosts: ActionCreator<PostListThunkResult> = (threadid: string) => (dispatch) => {
    let unsubscribe = db.collection("message_posts").where("threadid", "==", threadid).onSnapshot((querySnapshot) => {
        let posts:IdMap<Post> = {};
        let postids:string[] = [];
        querySnapshot.forEach((sdoc) => {
            var data = sdoc.data();
            data.id = sdoc.id;
            posts[sdoc.id] = data as Post;
            postids.push(sdoc.id);
        });

        let list = {
            postids: postids,
            posts: posts
        } as PostList;

        dispatch({
            type: POST_LIST,
            threadid: threadid,
            list: list
        })
    });

    dispatch({
        type: THREAD_SUBSCRIPTION,
        threadid: threadid,
        unsubscribe: unsubscribe
    });
};

// Add Thread
export const addThread = (thread:Thread, uid: string, uname: string) =>  {
    let threadRef = db.collection("message_threads").doc();
    thread.timestamp = toTimeStampFromDate(new Date());
    thread.userid = uid;
    thread.username = uname;
    threadRef.set(thread);
    return threadRef.id;
};

// Add Post
export const addPost = (post: Post, uid: string, uname: string) => {
    let postRef = db.collection("message_posts").doc();
    post.timestamp = toTimeStampFromDate(new Date());
    post.userid = uid;
    post.username = uname;
    postRef.set(post);
    return postRef.id;
}

export type MessagesAction =  MessagesActionThreadList | MessagesActionPostList | MessagesActionThreadSubscription;