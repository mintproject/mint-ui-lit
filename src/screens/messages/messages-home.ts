import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import messages from './reducers';
import { Thread } from './reducers';

import { listThreads } from './actions';

import "weightless/icon";
import "weightless/textfield";
import '../../components/nav-title'
import './messages-thread';
import './messages-list';

store.addReducers({
    messages
});

@customElement('messages-home')
export class MessagesHome extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _selectedThread! : Thread;

    static get styles() {
        return [
            css `
        nav-title {
          display: inline-block;
        }

        .nav-search {
          display: inline-block;
          float: right;
        }
        
        wl-icon {
          margin-right: 4px;
        }

        .nav-search > wl-textfield {
          display: inline-block;
          --input-padding-top-bottom: 0px;
          margin-right: 16px;
          width: 320px;
        }
            `,
            SharedStyles
        ];
    }

    protected render() {
        let nav = [{label:'Message Board', url:'messages'}]; 
        switch (this._subpage) {
            case 'thread':
                if (this._selectedThread) {
                    nav.push({
                        label: this._selectedThread.name,
                        url:'messages/thread/' + this._selectedThread.id
                    });
                }
            default:
                break;
        }

        return html`
        <div style="display: grid;">
            <div style="grid-row: 1;">
                <nav-title .nav="${nav}"></nav-title>
                <div class="nav-search" style="${this._subpage === 'home' ? '' : 'display:none;'}">
                    <!--wl-textfield type="text" placeholder="Search thread" label="Search thread">
                        <wl-icon slot="before">search</wl-icon>
                    </wl-textfield-->
                    <wl-button @click="${this._newThread}"><wl-icon>note_add</wl-icon>New thread</wl-button>
                </div>
            </div>

            <div style="grid-row: 2;">
                <messages-list id="message-list" class="page fullpage" ?active="${this._subpage == 'home'}"></messages-list>
                <messages-thread class="page fullpage" ?active="${this._subpage == 'thread'}"></messages-thread>
            </div>
        </div>
        `
    }

    _newThread () {
        let messageList : HTMLInputElement = <HTMLInputElement> this.shadowRoot.getElementById('message-list');
        if (messageList) {
            (messageList as any)._addThreadDialog()
        }
    }

    protected firstUpdated() {    
        store.dispatch(listThreads());
    }

    stateChanged(state: RootState) {
        //super.setRegionId(state);
        super.setSubPage(state);
        if (state.ui && state.ui.selected_threadid && state.messages && state.messages.threads &&
            state.messages.threads.threads && state.messages.threads.threads[state.ui.selected_threadid]) {
            this._selectedThread = state.messages.threads.threads[state.ui.selected_threadid];
        }
    }
}
