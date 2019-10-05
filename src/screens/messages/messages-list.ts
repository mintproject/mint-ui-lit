import { html, customElement, property, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from '../../styles/shared-styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../app/store';

// Actions needed by this element
import { listThreads, addThread } from './actions';
import { ThreadList, Thread } from './reducers';

import "weightless/list-item";
import "weightless/icon";
import EasyMDE from 'easymde';

import { navigate, BASE_HREF, goToPage } from '../../app/actions';
import { PageViewElement } from '../../components/page-view-element';
import { renderNotifications } from '../../util/ui_renders';
import { formElementsComplete, showDialog, hideDialog, showNotification, resetForm } from '../../util/ui_functions';
import { fromTimeStampToReadableString } from 'util/date-utils';

@customElement('messages-list')
export class MessagesList extends connect(store)(PageViewElement) {

  @property({type: Object})
  private _list!: ThreadList;

  private _userid: string;
  private _username: string;
  private _editor: any;

  static get styles() {
    return [
      SharedStyles,
      css``
    ];
  }

  protected render() {
    return html`
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/easymde@2.8.0/dist/easymde.min.css">
    <!-- Show Thread List -->
    ${this._list && this._list.threadids.map((threadid) => {
        let thread = this._list.threads[threadid];
        return html`
        <wl-list-item class="active"
            @click="${this._onSelectThread}"
            data-index="${thread.id}">
            <wl-icon slot="before">note</wl-icon>
            <span slot="after">
                ${thread.username}<br/>
                ${fromTimeStampToReadableString(thread.timestamp)}
            </span>
            <wl-title level="4" style="margin: 0">${thread.name}</wl-title>
            <div>
               ${thread.text.substr(0, 100) + "..."}
            </div>
        </wl-list-item>
        `
    })}
    
    ${renderNotifications()}
    ${this._renderDialogs()}
    `
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="threadDialog" fixed backdrop blockscrolling>
      <h3 slot="header">New Thread</h3>
      <div slot="content">
        <form id="threadForm">
          <p>
            Thread title
          </p>
          <div class="input_full">
            <input name="thread_name"></input>
          </div>        
          <p>
            Please enter thread details below
          </p>
          <div class="input_full">
            <textarea name="thread_text" id="new_thread_text"></textarea>
          </div>
        </form>
      </div>
      <div slot="footer">
          <wl-button @click="${this._onAddThreadCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onAddThreadSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
  }

  _addThreadDialog() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
    resetForm(form);
    this._editor.value('');

    showDialog("threadDialog", this.shadowRoot!);
  }

  _onAddThreadSubmit() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
    if(formElementsComplete(form, ["thread_name"]) && this._editor.value()) {
        let thread_name = (form.elements["thread_name"] as HTMLInputElement).value;

        let thread = {
          name: thread_name,
          text: this._editor.value()
        } as Thread;        

        let threadid = addThread(thread, this._userid, this._username);

        hideDialog("threadDialog", this.shadowRoot!);
        showNotification("saveNotification", this.shadowRoot!);
    
        /*let path = BASE_HREF+"/"+this._regionid+"/messages/thread"+threadid;
        window.history.pushState({}, "MINT", path);
        store.dispatch(navigate(decodeURIComponent(path)));*/
    }
    else {
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }    
  }

  _onAddThreadCancel() {
    hideDialog("threadDialog", this.shadowRoot!);
  }


  _onSelectThread(e: Event) {
    let selectedThreadId = (e.currentTarget as HTMLButtonElement).dataset['index']+"";    
    this._selectThread(selectedThreadId);
  }

  _selectThread(threadid: string) {
    goToPage("messages/thread/" + threadid);
  }

  protected firstUpdated() {    
      //this should happen here but im not getting the threads one at time
    //store.dispatch(listThreads());
    let textArea = this.shadowRoot.getElementById('new_thread_text')
    if (textArea) {
        this._editor = new EasyMDE({ element: textArea });
    }
  }

  // This is called every time something is updated in the store.
  stateChanged(state: RootState) {
    //this.setRegionId(state);
    if(state.messages) {
      if(state.messages.threads) {
        this._list = state.messages.threads;
      }
    }
    if(state.app.user) {
        this._username = state.app.user.email;
        this._userid = state.app.user.uid;
    }
  }
}
