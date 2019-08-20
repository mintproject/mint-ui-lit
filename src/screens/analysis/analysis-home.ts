import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import analysis from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import './analysis-compare';
import './analysis-visualize';
import './analysis-aggregate';
import './analysis-report';
import '../../components/nav-title'

store.addReducers({
    analysis
});

@customElement('analysis-home')
export class AnalysisHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            `,
            SharedStyles
        ];
    }

    protected render() {
        let nav = [{label:'Prepare Reports', url:'analysis'}] 
        switch (this._subpage) {
            case 'compare':
                nav.push({label: 'Sensitivity Analysis', url: 'analysis/compare'});
                break;
            case 'visualize':
                nav.push({label: 'Aggregate Questions', url: 'analysis/visualize'});
                break;
            case 'aggregate':
                nav.push({label: 'Compose Visualizations', url: 'analysis/aggregate'});
                break;
            case 'report':
                nav.push({label: 'Prepare Reports', url: 'analysis/report'});
                break;
            default:
                break;
        }

        return html`
            <nav-title .nav="${nav}"></nav-title>
            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="${this._regionid}/analysis/compare">
                    <wl-icon style="--icon-size: 81px;">compare</wl-icon>
                    <div>Sensitivity analysis</div>
                </a>
                <a href="${this._regionid}/analysis/visualize">
                    <wl-icon style="--icon-size: 81px;">collections_bookmark</wl-icon>
                    <div>Aggregate questions</div>
                </a>
                <a href="${this._regionid}/analysis/aggregate">
                    <wl-icon style="--icon-size: 81px;">insert_chart</wl-icon>
                    <div>Compose visualizations</div>
                </a>
                <a href="${this._regionid}/analysis/report">
                    <wl-icon>attachment</wl-icon>
                    <div>Prepare reports</div>
                </a>
            </div>

            <!--TODO: Change the name of the files too -->
            <analysis-compare class="page fullpage" ?active="${this._subpage == 'compare'}"></analysis-compare>
            <analysis-visualize class="page fullpage" ?active="${this._subpage == 'visualize'}"></analysis-visualize>
            <analysis-aggregate class="page fullpage" ?active="${this._subpage == 'aggregate'}"></analysis-aggregate>
            <analysis-report class="page fullpage" ?active="${this._subpage == 'report'}"></analysis-report>
        `
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        super.setSubPage(state);
    }
}

