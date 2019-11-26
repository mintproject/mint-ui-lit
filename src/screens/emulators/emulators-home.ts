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
                    The PIHM hydrologic model was run for the following basins in Ethiopia with weather data from GLDAS for a year. 
                    <ul>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/1L4JMmK1MTmJJFquGFXB/results">Muger (9 runs)</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/PvjIvVMa4ELIQQcDYgIM/results">Beko-Tippi (9 runs)</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/VggqferoeUnXQB93yeBM/results">Jamma (9 runs)</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/WX6w5WG9syCkp6JhXyAL/results">Baro (9 runs)</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/etZK2mpavnnjJRyfe5mm/results">Guder (9 runs)</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/l3EAhLLCUv2NtFbYVLkp/results">Bashilo (9 runs)</a>
                        </li>                                                                                                                                                                    
                    </ul>
                </li>
                <li>
                    The HAND hydrologic model was run for the following basins in Ethiopia. 
                    <ul>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/b6zPCLiBjfpUTAe9sJUY/results">Muger</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/Xpq55sPcGaAi87uwcCVD/results">Beko-Tippi</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/kfwzGsPzx6jCNrWGQzTs/results">Awash</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/KusL4gRuGp17Ejsy3unO/results">Baro</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/p3H7OUjfmGw9OPXRxFLn/results">Guder</a>
                        </li>
                        <li>
                            <a href="/ethiopia/modeling/scenario/EnaNTF1qst06U4STDl78/dAkQZmVskdPUcCkk7gAg/1SbM5SJQaYMN7oVm80SV/results">Ganale</a>
                        </li>                                                                                                                                                                    
                    </ul>
                </li>
                <li>
                    The Flood Severity Index hydrologic model was run for the whole of Ethiopia and South Sudan for 2017
                    <ul>
                        <li>
                            <a href="/ethiopia/modeling/scenario/cFut6KW7huKmLMqTLGEw/rzkcVNqnSGWKMttVWjCM/MXmvP11v8renb5ONqYPz/visualize">Ethiopia & South Sudan</a>
                        </li>                                                                                                                                                                 
                    </ul>
                </li>
                <li>
                    The TopoFlow hydrologic model was run on the following basins to generate overbank flood depth time series or the month of April in 2014 
                    (There was a fairly big rainfall event in the beginning of that month). 
                    <ul>
                        <li>
                            <p>The following image shows the flood depths as a color image with hillshading, 
                            which helps to see how the grid aligns with the topography. The reddest grid cells are "hot spots" or 
                            flood-prone areas, and this is how grid cells were selected for monitoring (i.e. "virtual gauges" were 
                            placed at those locations for the model run to create a time series for each location).</p>
                            <img src="https://data.mint.isi.edu/files/topoflow/Baro_Gam_1min_2014-04_flood-prone_grid_cells.png"></img>
                        </li>
                        <li>
                            <p>The following image is just the shaded relief for the same area, 
                            the Baro River basin, as it drains toward the west and flows past the town of Gambella.  
                            These are low-resolution images that match the fairly low spatial resolution we used for this 
                            TopoFlow model setup (to make it run faster).</p>
                            <img src="https://data.mint.isi.edu/files/topoflow/Baro_Gam_1min_shaded_relief.png"></img>
                        </li>
                    </ul>
                </li>     
                <li>
                    The Cycles agricultural model was run for Oromia for 2000 to 2017
                    <ul>
                        <li>
                            <a href="/ethiopia/modeling/scenario/vCwen8MUT3jgza4A8vq4/ywYH9PGRKJZoQLpqp3RH/ZoluO9Idrkile3f6SZ31/results">Cycles for Oromia (90720 runs)</a>
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

