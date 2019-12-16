import { html, css, customElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'
import { db } from 'config/firebase';
import { Pathway, ExecutableEnsembleSummary } from 'screens/modeling/reducers';

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
                    <h3>CYCLES</h3>
                    <ul>
                        <li>Gambela: <a href="https://data.mint.isi.edu/files/simulation-runs/cycles/summary/ethiopia/gambela/"
                            >https://data.mint.isi.edu/files/simulation-runs/cycles/summary/ethiopia/gambela/</a></li>
                        <li>Region/area: All GLDAS grids at 0.5 degree resolution within South Sudan and Gambela, Ethiopia 
                        (about 55 x 55 km grids at these latitudes).</li>
                        <li>Model version: Cycles v0.9.4-alpha</li>
                        <li>Config: Look at CSV File of simulation matrix. Soil data are from ISRIC, and 
                        meteorological forcing data are from GLDAS.</li>
                        <li>Years: 2000-2017</li>
                        <li>Crops South Sudan: Maize, sorghum, sesame, peanuts</li>
                        <li>Crops Ethiopia - Gambella region: Maize, sorghum, sesame (but only applicable to highland). </li>
                        <li># Multiple variables being varied simultaneously</li>
                    </ul>
                    The runs from Cycles report the simulated yield of different crops taking into account soil conditions, 
                    cropping sequence, management practice, weed pressure, and local weather. The simulation results can be 
                    mapped to any cropland that is within the GLDAS grid. 
                    <ul>
                        <li>
                            The Cycles agricultural model was run for Oromia for 2000 to 2017
                            <ul>
                                <li>
                                    <a href="/ethiopia/modeling/scenario/vCwen8MUT3jgza4A8vq4/ywYH9PGRKJZoQLpqp3RH/ZoluO9Idrkile3f6SZ31/results">Cycles for Oromia (90720 runs)</a>
                                </li>
                            </ul>
                        </li>   
                    </ul>
                </li>
            </ul>
            <ul>
                <li>
                    <h3>PIHM</h3>
                    <ul>
                        <li>File names contain region and metadata in uncompressed files for basins  Muger, Beko-Tippi, Jamma, 
                        Baro, Guder, Bashilo. The simulation period is for 2017 only</li>
                        <li>Vary one variable at a time as normal, high, low Look at CSV File of sensitivity matrix included. 
                        The variables included are precipitation and temperature.</li>
                        <li>See CSV File of sensitivity matrix <a href="https://data.mint.isi.edu/files/simulation-runs/pihm/"
                            >https://data.mint.isi.edu/files/simulation-runs/pihm/</li>
                        <li># The atmospheric data uses GLDAS, 2017 daily data, 
                            all other spatial data is specified located in MINT data catalog.</li>
                        <li>Visualization of Surface Flooding Index spatial map  (monthly 2017) and a Streamflow duration Index 
                            are the basic outputs. However streamflow simulations for all points in each watershed are also available.</li>
                        <li><a href="https://dev.mint.isi.edu/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h"
                            >UI link to outputs for configuration of each model run in Ethiopia</a></li>
                        <li>All PIHM test model runs are available here: <a href="https://data.mint.isi.edu/files/simulation-runs/pihm/test-runs/"
                            >https://data.mint.isi.edu/files/simulation-runs/pihm/test-runs/</a>
                            <ul>
                                File Descriptions:
                                <li>GLDAS 2017 Baseline - pihm-output-ethiopia-8884b6867b19b9e9079c5af01ef47dca.tgz</li>
                                <li>GLDAS 2017 TS_PRCP 1.1 - pihm-output-ethiopia-793616808ff9e6de7a1339b82766b72e.tgz</li>
                                <li>GLDAS 2017 TS_PRCP 0.9 - pihm-output-ethiopia-b6995862016115dc8f3e55692adb6b7b.tgz</li>
                                <li>FLDAS 2017 Baseline - pihm-output-ethiopia-25db3224876e0dfbaf11eaa6f5a01efb.tgz</li>
                            </ul>
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

    /*
    protected firstUpdated() {
        db.collectionGroup('pathways')
            .where('last_update.parameters.time', '>', 0)
            .get().then((snapshot) => {
                snapshot.docs.map((doc) => {
                    let pathway = doc.data() as Pathway;
                    Object.values(pathway.executable_ensemble_summary).map((summary: ExecutableEnsembleSummary) => {
                        if(summary.total_runs == summary.successful_runs && summary.total_runs > 400) {
                            console.log(pathway.id);
                        }
                    })
                })
            })
    }
    */

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}

