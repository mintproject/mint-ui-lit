import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from "components/page-view-element";
import { Thread, Post } from "./reducers";
import { store, RootState } from '../../app/store';
import { connect } from "pwa-helpers/connect-mixin";

import { listThreads, listPosts, addPost } from './actions';
import { fromTimeStampToReadableString } from 'util/date-utils';
import { formElementsComplete, showNotification, resetForm } from '../../util/ui_functions';

import '../../components/loading-dots'
import marked from 'marked';
import EasyMDE from 'easymde';

@customElement('messages-thread')
export class MessagesThread extends connect(store)(PageViewElement) {
  @property({type: Object})
  private _thread!: Thread;

  @property({type: Object})
  private _posts: any; //FIXME

  @property({type: String})
  private _threadId : string = '';
  private _prevId: string = '';
  private _editor = null;

  private _userid : string = '';
  private _username : string = '';

  static get styles() {
    return [css`
    #main-grid {
        display: grid;
        margin: 0 auto;
        width: 75%;
    }

    .user {
        color: rgb(15, 122, 207);
        display: block;
        text-align: right;
    }

    .main-thread {
        border: 2px solid #d9d9d9;
        border-radius: 10px;
        padding: 0px 12px;
        display: block;
    }

    .post {
        border: 1px solid #6D6D6D;
        border-radius: 10px;
        padding: 0px 12px;
        margin-bottom: 10px;
        margin-left: 10px;
    }

    #new-response {
        margin-left: 10px;
    }

    .info {
        text-align: center;
        font-size: 13pt;
        height: 32px;
        line-height:32px;
        color: #999;
        margin-bottom: 10px;
    }
    `]
  }

  render () {
    return html`
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/easymde@2.8.0/dist/easymde.min.css">

    <div id="main-grid">
        <div style="grid-row: 1;" class="main-thread">
            ${this._thread ? 
            html`
            <div id="main-post"></div>
            <div>
                <span class="user">
                    ${this._thread.username}<br/>
                    ${fromTimeStampToReadableString(this._thread.timestamp)}
                </span>
            </div>`
            : html`<loading-dots style="--width: 20px"></loading-dots>`}
        </div>
        <div style="grid-row: 2; margin-top: 6px;" class="response">
            <wl-title level="4">Responses:</wl-title>
            ${!this._posts ? html`<loading-dots style="--width: 20px"></loading-dots>` : (
                this._posts.length === 0 ? html`<div class="info">- No responses yet -</div>`
                : this._posts.map(p => html`
                    <div class="post">
                        <div id="${p.id}"></div>
                        <span class="user">
                            ${p.username}<br/>
                            ${fromTimeStampToReadableString(p.timestamp)}
                        </span>
                    </div>`)
            )}
        </div>
        <div style="grid-row: 3;">
            <form id="new-response">
                <textarea id="response-textarea" name="response-text"></textarea>
            </form>
            <wl-button style="float: right; margin-top: 10px;" @click="${this._onPostSubmit}"> Add response </wl-button>
        </div>
    </div>
    `
  }

  updated () {
    let main = this.shadowRoot.getElementById('main-post');
    if (main) main.innerHTML = marked(this._thread.text);
    (this._posts || []).forEach(p => {
        let postDiv = this.shadowRoot.getElementById(p.id);
        if (postDiv) {
            postDiv.innerHTML = marked(p.text);
        }
    });
  }

  _onPostSubmit () {
    let newPost : string = this._editor.value();

    if (newPost) {
        let post = {
          text: newPost,
          threadid: this._threadId,
        } as Post;

        let postId = addPost(post, this._userid, this._username);
        this._editor.value('');
    }
    else {
        console.log('NO MESSAGE');
    }    
  }

  protected firstUpdated() {    
    store.dispatch(listThreads());

    let textArea = this.shadowRoot.getElementById('response-textarea')
    if (textArea) {
        this._editor = new EasyMDE({ element: textArea });
    }
  }

  stateChanged(state: RootState) {
    if (state.ui && state.ui.selected_threadid && state.ui.selected_threadid !== this._threadId) {
        // Selected new Thread
        this._threadId = state.ui.selected_threadid;
        store.dispatch(listPosts(this._threadId));
        this._thread = null;
        this._posts = null;
    }

    if (this._threadId && state.messages && state.messages.threads && state.messages.threads.threads &&
        state.messages.threads.threads[this._threadId]) {
        this._thread = state.messages.threads.threads[this._threadId];
    }

    if(state.app.user) {
        this._username = state.app.user.email;
        this._userid = state.app.user.uid;
    }

    if (state.messages && state.messages.posts && state.messages.posts.posts) {
        this._posts = Object.values(state.messages.posts.posts).filter(p => p.threadid === this._threadId).sort((a, b) => {
            return a.timestamp.seconds - b.timestamp.seconds;
        });
    }
  }
}
