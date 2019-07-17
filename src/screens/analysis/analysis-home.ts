
import { html, customElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

/*
store.addReducers({
    analysis
});
*/

@customElement('analysis-home')
export class AnalysisHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
            <wl-title level="3">Prepare Reports</wl-title>
            <p>
                This section allows you to:
                <ul>
                    <li>Compare model runs</li>
                    <li>Visualize results</li>
                    <li>Aggregate findings</li>
                    <li>Prepare reports</li>
                </ul>
            </p>
        `
    }
}
