
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import regions from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import './regions-manual';
import './regions-administrative';
import './regions-agriculture';
import './regions-hydrology';
import '../../styles/mint-icons';
import { cropsIcon, mountainRiverIcon, adminIcon } from '../../styles/mint-icons';

store.addReducers({
    regions
});

@customElement('regions-home')
export class RegionsHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
            <wl-title level="3">Define Regions</wl-title>
            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="regions/manual">
                    <wl-icon>edit</wl-icon>
                    <div>Manual Outline</div>
                </a>
                <a href="regions/administrative">
                    <div class="svgicon">
                        ${adminIcon}
                    </div> 
                    <div>Administrative</div>
                </a>
                <a href="regions/hydrology">
                    <div class="svgicon">
                        ${mountainRiverIcon}
                    </div>                
                    <div>Hydrology</div>
                </a>
                <a href="regions/agriculture">
                    <div class="svgicon">
                        ${cropsIcon}
                    </div>
                    <div>Agriculture</div>
                </a>
            </div>

            <regions-manual class="page fullpage" ?active="${this._subpage == 'manual'}"></regions-manual>
            <regions-administrative class="page fullpage" ?active="${this._subpage == 'administrative'}"></regions-administrative>
            <regions-hydrology class="page fullpage" ?active="${this._subpage == 'hydrology'}"></regions-hydrology>
            <regions-agriculture class="page fullpage" ?active="${this._subpage == 'agriculture'}"></regions-agriculture>
        `
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
    }
}