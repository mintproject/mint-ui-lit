import { html, css, customElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'
import { db } from 'config/firebase';

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
                    The PIHM hydrologic model was run for the Baro basin in Ethiopia with weather data from GLDAS for a year. 
                    An example output product of the PIHM Model can be browsed by viewing 
                    <a href="https://data.mint.isi.edu/files/uploads/PIHM_Baro-Gambella.pdf">this PDF</a>.
                    More details can be seen by viewing the original notebook, 
                    (<a href="https://data.mint.isi.edu/files/uploads/PIHM_Model_1.cdf">Download here</a>), using 
                    the <a href="https://www.wolfram.com/player/">free Mathematica notebook reader</a>.  
                    The simulation used the following raw input data and produced the following raw output data:
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
                <li>
                    The TopoFlow model was run on the Baro River Basin to generate overbank flood depth time series or the month of April in 2014 
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

    protected firstUpdated() {
        /*
        console.log("Checking size of ensembles collection");
        db.collection("/ensembles")
            .where("modelid", "==", "https://w3id.org/okn/i/mint/cycles-0.9.4-alpha-advanced-pongo-weather")
            .where("status", "==", "SUCCESS")
            .limit(10000)
            .get().then((snapshot) => {
                console.log(snapshot.size);
        })
        */
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}

