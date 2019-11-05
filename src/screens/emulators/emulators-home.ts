import { html, css, customElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'

@customElement("emulators-home")
export class EmulatorsHome extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            @media (min-width: 1025px) {
                .content {
                    width: 75%;
                }
            }
            @media (max-width: 1024) {
                .content {
                    width: 100%;
                }
            }
            .content {
                margin: 0 auto;
            }
            ul li {
                padding: 10px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        let nav = [{label:'Model Products / Emulators', url:'emulators'}] 
        if(this._regionid == "ethiopia") {
            return html`
            <nav-title .nav="${nav}"></nav-title>
            <ul>
                <li>
                    An example output product of the PIHM Model for the Baro basin in Ethiopia can be browsed by viewing 
                    <a href="https://data.mint.isi.edu/files/uploads/PIHM_Baro-Gambella.pdf">this PDF</a>.
                </li>
                <li>
                    The PIHM model was run with weather data from GLDAS for a year and used the following raw input data
                    and produced the following raw output data:
                    <ul>
                        <li>PIHM Input: 
                            <a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-ethiopia-1b5bd7a4b4c6b8ac8f4617661e775ef7.tgz">
                                https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-ethiopia-1b5bd7a4b4c6b8ac8f4617661e775ef7.tgz</a>
                        </li>
                        <li>PIHM Output: 
                            <a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-output-ethiopia-8884b6867b19b9e9079c5af01ef47dca.tgz">
                                https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-output-ethiopia-8884b6867b19b9e9079c5af01ef47dca.tgz</a>
                        </li>
                    </ul>
                </li>
            </ul>
            `;
        }
        if(this._regionid == "south_sudan") {
            return html`
            <nav-title .nav="${nav}"></nav-title>
            <ul>
                <li>An example of the PIHM Model for the Pongo basin in South Sudan can be browsed by using
                    <a href="https://files.mint.isi.edu/s/oLw76x6chUNXOc0/download">this Notebook</a>
                    (Wolfram Mathematica CDF player is needed to visualize and change the results of the notebook)
                </li>

                <li>
                    Alternatively, you may browse <a href="https://files.mint.isi.edu/s/tmn7sRjjPh7BZvK/download">this PDF</a>
                    for a non-interactive version of the example.
                </li>
            </ul>
            `;
        }
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}

