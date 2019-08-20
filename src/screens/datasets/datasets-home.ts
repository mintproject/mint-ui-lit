
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
import '../../components/nav-title';

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
        let nav = [{label:'Explore Data', url:'datasets'}] 
        switch (this._subpage) {
            case 'browse':
                nav.push({label: 'Browse Datasets', url: 'datasets/browse'});
                break;
            case 'register':
                nav.push({label: 'Add Datasets', url: 'datasets/register'});
                break;
            case 'quality-workflows':
                nav.push({label: 'Improve Quality of Datasets', url: 'datasets/quality-workflows'});
                break;
            case 'rs-workflows':
                nav.push({label: 'Remote Sensing', url: 'datasets/rs-workflows'});
                break;
            default:
                break;
        }

        return html`
            <nav-title .nav="${nav}"></nav-title>

            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="${this._regionid}/datasets/browse">
                    <wl-icon>search</wl-icon>
                    <div>Browse Datasets</div>
                </a>
                <a href="${this._regionid}/datasets/register">
                    <wl-icon>library_add</wl-icon>
                    <div>Add Datasets</div>
                </a>
                <a href="${this._regionid}/datasets/quality-workflows">
                    <wl-icon>high_quality</wl-icon>
                    <div>Improve Quality</div>
                </a>
                <a href="${this._regionid}/datasets/rs-workflows">
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
        super.setRegionId(state);
    }
}
