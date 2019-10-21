
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
import '../../components/nav-title'

store.addReducers({
    regions
});

@customElement('regions-home')
export class RegionsHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            SharedStyles,
            css `
            .card {
                height: 100%;
                margin: 0px;
                padding: 0px;
            }

            regions-administrative, regions-hydrology {
                height: calc(100% - 40px);
            }
            `,
        ];
    }

    protected render() {
        let nav = [{label:'Define Regions', url:'regions'}] 
        switch (this._subpage) {
            case 'manual':
                nav.push({label: 'Manual Outline', url: 'regions/manual'});
                break;
            case 'administrative':
                nav.push({label: 'Administrative Regions', url: 'regions/administrative'});
                break;
            case 'hydrology':
                nav.push({label: 'Hydrology Regions', url: 'regions/hydrology'});
                break;
            case 'agriculture':
                nav.push({label: 'Agriculture Regions', url: 'regions/agriculture'});
                break;
            default:
                break;
        }

        return html`
            <nav-title .nav="${nav}"></nav-title>

            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="${this._regionid}/regions/agriculture">
                    <div class="svgicon">
                        ${cropsIcon}
                    </div>
                    <div>Agriculture</div>
                </a>                
                <a href="${this._regionid}/regions/hydrology">
                    <div class="svgicon">
                        ${mountainRiverIcon}
                    </div>                
                    <div>Hydrology</div>
                </a>
                <a href="${this._regionid}/regions/administrative">
                    <div class="svgicon">
                        ${adminIcon}
                    </div> 
                    <div>Administrative</div>
                </a>
                <a href="${this._regionid}/regions/manual">
                    <wl-icon>edit</wl-icon>
                    <div>Manual Outline</div>
                </a>                                
            </div>

            <regions-manual class="page" ?active="${this._subpage == 'manual'}"></regions-manual>
            <regions-administrative class="page" ?active="${this._subpage == 'administrative'}"></regions-administrative>
            <regions-hydrology class="page" ?active="${this._subpage == 'hydrology'}"></regions-hydrology>
            <regions-agriculture class="page" ?active="${this._subpage == 'agriculture'}"></regions-agriculture>
        `
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
        super.setRegionId(state);
    }
}
