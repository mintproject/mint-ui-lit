
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import datasets from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import './datasets-browse';
import './datasets-register';
import './datasets-quality-workflows';
import './datasets-rs-workflows';

store.addReducers({
    datasets
});

@customElement('datasets-home')
export class DatasetsHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
            <wl-title level="3">Explore Data</wl-title>
            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="datasets/browse">
                    <wl-icon>search</wl-icon>
                    <div>Browse Datasets</div>
                </a>
                <a href="datasets/register">
                    <wl-icon>library_add</wl-icon>
                    <div>Add Datasets</div>
                </a>
                <a href="datasets/quality-workflows">
                    <wl-icon>high_quality</wl-icon>
                    <div>Improve Quality</div>
                </a>
                <a href="datasets/rs-workflows">
                    <wl-icon>satellite</wl-icon>
                    <div>Remote Sensing</div>
                </a>
            </div>

            <datasets-browse class="page fullpage" ?active="${this._subpage == 'browse'}"></datasets-browse>
            <datasets-register class="page fullpage" ?active="${this._subpage == 'register'}"></datasets-register>
            <datasets-quality-workflows class="page fullpage" ?active="${this._subpage == 'quality-workflows'}"></datasets-quality-workflows>
            <datasets-rs-workflows class="page fullpage" ?active="${this._subpage == 'rs-workflows'}"></datasets-rs-workflows>
        `
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
    }
}
