
import { html, property, customElement, css } from 'lit-element';

import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';

import { FetchedModel } from "./reducers";
import { explorerFetchDetails } from './actions';

import { goToPage } from '../../../app/actions';

@customElement('model-facet-big')
export class ModelFacetBig extends connect(store)(PageViewElement) {
    @property({type: String})
        uri : string = "";

    @property({type: Object})
    private _model! : FetchedModel;

    constructor () {
        super();
        this.active = true;
    }

    static get styles() {
        return [
            css `
                :host {
                }

                .clickable {
                    cursor: pointer;
                }

                table {
                  border: 1px solid black;
                  width: 100%;
                  min-width: 600px;
                  border-spacing: 0;
                  border-collapse: collapse;
                  height: 100px;
                  overflow: hidden;
                }

                td {
                  padding: 0px;
                  padding-top: 3px;
                  vertical-align: top;
                }

                td.left {
                  width: 35%;
                }

                td.right {
                  width: 65%;
                }

                td div {
                  overflow: hidden;
                }

                img {
                  background: #3A6F9A;
                  vertical-align: middle;
                  max-width: calc(100% - 8px);
                  border: 1px solid black;
                }

                .helper {
                  display: inline-block;
                  height: 100%;
                  vertical-align: middle;
                }

                .text-centered {
                  text-align: center;
                }

                .header {
                  font-size: 1.3em;
                  line-height: 1.4em;
                  height: 1.4em;
                }

                .title {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .icon {
                  display: inline-block;
                  background-color: red;
                  width: 1.3em;
                  overflow: hidden;
                  float: right;
                  cursor: pointer;
                }

                .content {
                  padding: 0px 10px;
                  text-align: justify;
                }

                td.header div {
                  display: inline-block;
                }

                td.header div:nth-child(1) { width: 150px; }
                td.header div:nth-child(2) { width: calc(100% - 300px); min-width: 100px; }
                td.header div:nth-child(3) { width: 150px; }

                .details-button {
                    display: inline-block;
                    color: rgb(15, 122, 207);
                    cursor: pointer;
                    font-weight: bold;
                }
            `
        ];
    }

    protected render() {
        return html`
            <table>
              <tr>
                <td class="header" colspan="2">
                  <div @click="${()=>{goToPage('models/explorer')}}"
                        class="details-button">/models/</div><!--
                  --><div class="title text-centered">${this._model.label}</div><!--
                  --><div class="links"><span class="icon">1</span> <span class="icon">2</span></div>
                </td>
              </tr>
              <tr>
                <td class="left">
                  <span class="helper"></span>
                  <!--<img src="http://jsfiddle.net/img/logo.png"/>-->
                  <img src="https://research.ifas.ufl.edu/media/researchifasufledu/images/sliders/GUA_DSSAT2.jpg"/>
                </td>
                <td class="right content">
                  Cycles is an agroecosystem simulation model. It is a multi-year, multi-crop, multi-soil-layered, one-dimensional, daily or sub-daily time step platform that simulates water, carbon and nitrogen balance of the soil-crop system subject to climate conditions and a large array of management forcings. It belongs to the family of mechanistic or process-based models.
Cycles needs inputs of initial soil properties, climate forcings at a daily time step, and the management practices or forcings imposed by the farm operator such as crop sequence, fertilization rates and timing, irrigation and tillage. Based on these inputs, Cycles simulates crop growth and nutrient cycling and predicts agricultural performance metrics for annual and perennial crops (grain and forage yield, nutrient and water use efficiency), and environmental performance metrics such as nutrient losses through different pathways to the environment.
                </td>
              </tr>
              <tr>
                <td class="content" colspan="2">
                  <b>Author:</b> Armen Kemanian <br/>
                  <b>Contact:</b> Armen Kemanian <br/>
                  <b>Email:</b> <a href="mailto:armen@psu.edu">armen@psu.edu</a> <br/>
                  <b>Phone:</b> 321321312 <br/>
                  <b>Institution:</b> Penn State University <br/>
                  <b>Address:</b> 321 Street, USA <br/>
                  <b>Website:</b> 
                    <a href="https://plantscience.psu.edu/research/labs/kemanian/models-and-tools/cycles"
                       target="_blank">
                        https://plantscience.psu.edu/research/labs/kemanian/models-and-tools/cycles 
                    </a><br/>
                  <b>Preferred citation: </b> Kemanian, A. In Journal of ….. <br/>
                  <b>Code:</b> <a href="https://github.com/cycles" target="_blank">https://github.com/cycles</a>
                                (License: CC-BY-2.0)
                </td>
              </tr>
            </table>
            <hr/>
            ${this._model.io ? this._model.io.map( io => { return html`${io.label}`; }) : html``}
        `;
    }

    firstUpdated() {
        store.dispatch(explorerFetchDetails(this.uri));
        /*let sp = this.uri.split('/');
        if (sp.length > 1) {
            this._id = sp[sp.length - 1];
        }*/
    }

    stateChanged(state: RootState) {
        if (state.explorer && state.explorer.models) {
            this._model = state.explorer.models[this.uri];
        }
    }
}
