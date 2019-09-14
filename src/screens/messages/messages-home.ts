import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import messages from './reducers';

import './messages-thread';
import './messages-list';

store.addReducers({
    messages
});

@customElement('messages-home')
export class MessagesHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div>  
            <messages-list class="page fullpage" ?active="${this._subpage == 'home'}"></messages-list>
            <messages-thread class="page fullpage" ?active="${this._subpage == 'thread'}"></messages-thread>
        </div>
        `
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        super.setSubPage(state);
    }
}

