
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { queryRegions } from './actions';
import { RegionsEditor } from './regions-editor';
import { RegionList } from './reducers';

import { db } from 'config/firebase';
import { fromTimeStampToDateString } from "util/date-utils";
import { getVariableLongName } from "offline_data/variable_list";

import 'weightless/divider';
import './regions-editor';
import '../../components/image-gallery'

@customElement('regions-hydrology')
export class RegionsHydrology extends connect(store)(PageViewElement)  {
    @property({type: String})
    private _selectedSubRegionId : string = '';

    @property({type: String})
    private _selectedSubRegionName : string = '';

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _tasks : any = [];

    @property({type: Object})
    private _scenarios : any = {};

    @property({type: Object})
    private _models : any = {
        'Pongo': [
            /*{'name': 'Cycles calibrated model (v0.9.4) for the Pongo region-no file selection',
             'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-simple-pongo'},
            {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates',
             'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo'},
            {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates. Weather file can be chosen',
             'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather'},*/
            {'name': 'PIHM++ v4 configuration (v4) calibrated for South Sudan (Pongo Region) with aggregated outputs',
             'url': 'models/explore/PIHM/4/pihm-v4/pihm-v4-southSudan'},
            {'name': 'PIHM++ v4 configuration (v4) calibrated for South Sudan (Pongo Region) with aggregated outputs and customizable weather',
             'url': 'models/explore/PIHM/4/pihm-v4/pihm-v4-southSudan-weather'},
            /*{'name': 'Basic configuration of the economic model calibrated for South Sudan (v5) exposing no parameters',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/5/economic-v5/economic-v5_simple_pongo'},
            {'name': 'Advanced configuration of the economic model calibrated for South Sudan (v5) exposing 3 parameters',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/5/economic-v5/economic-v5_advanced_pongo'},
            {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6) exposing no parameters',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6/economic-v6/economic-v6_simple_pongo'},
            {'name': 'Advanced configuration of the economic model calibrated for South Sudan (v6) and exposing 15 parameters-3 per crop',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6/economic-v6/economic-v6_advanced_pongo'},
            {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6.1) exposing parameters to adjust maize',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1_single_crop/economic-v6.1_single_crop_pongo'},
            {'name': 'Advanced configuration of the economic model calibrated for the Pongo region of South Sudan (v6.1) and exposing 15 parameters-3 per crop',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1/economic-v6.1_advanced_pongo'},
            {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6.1) exposing parameters to adjust maize',
             'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1_single_crop/economic-v6.1_single_crop_pongo'}*/
        ]
    }

    static get styles() {
        return [
            SharedStyles,
            css `
            .cltrow wl-button {
                padding: 2px;
            }
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
            `
        ];
    }

    protected render() {
        let items : Array<any>;
        if (this._regionid === 'south_sudan') {
            items = [
            {   label: "South Sudan River Basins (PIHM)",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/2017.png",
                desc: "The three river basins that were our focus in 2018."},
            {   label: "South Sudan River Basins - POI",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/POI.png",
                desc: "The three river basins that were our focus in 2018 (overlayed with points of interest)."}
            ]
        } else if (this._regionid === 'ethiopia') {
            items = [
            {   label: "Ethiopia relief boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png"},
            {   label: "Ethiopia relief subbasins (94MB)",
                src: "images/thumbnails/Ethiopia_relief_subbasins_med.png",
                thumbnail: "images/thumbnails/Ethiopia_relief_subbasins_small.png",
                external: "http://mint.isi.edu/data/Ethiopia_relief_subbasins_big.png"},
            {   label: "Blue Nile Tributaries relief and boundaries (76MB)",
                src: "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_med.png",
                thumbnail: "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_small.png",
                external: "http://mint.isi.edu/data/Blue_Nile_Tribs_relief_and_boundaries_big.png"},
            {   label: "Guder relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png"},
            {   label: "Jamma relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png"},
            {   label: "Muger relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png"},
            {   label: "Dashilo relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png"},
            ]
        } else {
            items = [];
        }

        return html`
        <div class="content">
            <regions-editor active
                style="--map-height: 450px;"
                regionType="Hydrology"
            ></regions-editor>

            <br/>

            ${this._selectedSubRegionName ? html`
            <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedSubRegionName}</wl-title>
            ${!this._models[this._selectedSubRegionName] || this._models[this._selectedSubRegionName].length == 0 ? 'No models for this region' :
            html`<ul>${this._models[this._selectedSubRegionName].map((model) => html`
                <li><a @click="${() => goToPage(model.url)}">${model.name}</a></li>`)
            }</ul>`
            }

            <wl-title level="4" style="font-size: 17px;">Tasks for ${this._selectedSubRegionName}</wl-title>
            ${this._loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` :
            this._tasks.length === 0 ? 'No tasks for this region' : 
            
            Object.keys(this._scenarios).map((sid:string) => html`
            <wl-expansion name="scenarios">
                <span slot="title">${this._scenarios[sid]}</span>
                ${this._tasks.filter((el) => el.scenarioid === sid).map((el) => html`
                <wl-list-item class="active" @click="${() => this._goToTask(el)}">
                    <wl-title level="4" style="margin: 0">
                      ${el.name}
                    </wl-title>
                    ${el.rvar ? getVariableLongName(el.rvar) + ':' : ''}
                    ${this._selectedSubRegionName}
                    <div slot="after" style="display:flex">
                    ${this._renderDates(el.dates)}
                    </div>
                </wl-list-item>
                `)}
            </wl-expansion>
            `)
            }
            ` : '' }

            ${items.length > 0 ? html`
            <wl-divider style="margin: 20px 0px;"></wl-divider>
            <p>
                The following are areas of interest for hydrology modeling in this region
            </p>
            <div style="width: 90%; margin: 0px auto;">
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>
            </div>
            ` : ''}
        </div>
        `;
    }

    firstUpdated() {
        this.addEventListener('map-click', (ev: any) => {
            this._selectedSubRegionId = ev.detail.id;
            this._selectedSubRegionName = ev.detail.name;
            this._getTasks();
        }, false)
    }

    _renderDates (date) {
        let startdate = fromTimeStampToDateString(date!.start_date);
        let enddate = fromTimeStampToDateString(date!.end_date);
        return startdate + " - " + enddate;
    }

    async _getTasks () {
        this._loading = true;
        let tasks = [];
        let scenarios = {};
        let promises = [];

        await db.collection("scenarios").where('regionid', '==', this._regionid).get().then((querySnapshot) => {
          querySnapshot.forEach((scenario) => {
            let sid = scenario.get('id');
            let l = scenario.ref.collection('subgoals').where('subregionid', '==', this._selectedSubRegionId).get().then((qsnap) => {
              qsnap.forEach((task) => {
                  let tname = task.get('name');
                  let tvar  = task.get('response_variables');
                  let pathw = task.get('pathways')
                  let tdate = task.get('dates');
                  if (tname) {
                    if (!scenarios[sid]) {
                        scenarios[sid] = scenario.get('name');
                    }
                    tasks.push({
                        scenarioid: sid,
                        taskid: task.ref.id,
                        pathwayid: Object.keys(pathw)[0],
                        name: tname,
                        rvar: tvar.length > 0 ? tvar[0] : null,
                        dates: tdate
                    })
                  }
              });
            })
            promises.push(l);
          })
        })

        Promise.all(promises).then(() => {
            this._tasks = tasks;
            this._scenarios = scenarios;
            this._loading = false;
        });
    }

    _goToTask (el) {
        goToPage('modeling/scenario/' + el.scenarioid + '/' + el.taskid + '/' + el.pathwayid);
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}
