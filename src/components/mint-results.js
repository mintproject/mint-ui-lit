var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { SharedStyles } from "./shared-styles";
import { BASE_HREF } from "../actions/app";
import { MintPathwayPage } from "./mint-pathway-page";
import { getPathwayRunsStatus, TASK_DONE } from "../util/state_functions";
import { updatePathway } from "../actions/mint";
import { showNotification } from "../util/ui_functions";
import { selectPathwaySection } from "../actions/ui";
import { renderLastUpdateText } from "../util/ui_renders";
let MintResults = class MintResults extends connect(store)(MintPathwayPage) {
    constructor() {
        super(...arguments);
        this._editMode = false;
    }
    static get styles() {
        return [
            SharedStyles,
            css `
          `
        ];
    }
    render() {
        // If no models selected
        if (getPathwayRunsStatus(this.pathway) != TASK_DONE) {
            return html `
                Please run some analyses first
            `;
        }
        let running_ensembles = {};
        let not_running_ensembles = {};
        let done = false;
        for (let i = 0; i < this.pathway.executable_ensembles.length; i++) {
            let ensemble = this.pathway.executable_ensembles[i];
            if (ensemble.runid) {
                running_ensembles["" + i] = ensemble;
                if (ensemble.selected)
                    done = true;
            }
            else {
                not_running_ensembles["" + i] = ensemble;
            }
        }
        let readmode = (done && !this._editMode);
        // Show executable ensembles
        return html `

        <p>This step is for selecting and publishing results of the models that you ran earlier.</p>
        ${readmode ? html `<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.</p>` : html ``}
        
        <wl-title level="3">
            Results
            <wl-icon @click="${() => { this._editMode = true; }}" 
                id="editResultsIcon" class="actionIcon editIcon">edit</wl-icon>
        </wl-title>
        <wl-tooltip anchor="#editResultsIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Change Result Selections
        </wl-tooltip>
        <div class="clt">
            <ul>
                <li>
                    ${!readmode ?
            html `
                        <p>
                            These results have been produced by running these models with the inputs. You can select the results that you would like to publish.
                        </p>
                        ` :
            html ``}
                    <table class="pure-table pure-table-striped" id="results_table">
                        <thead>
                            <tr>
                                ${!readmode ? html `<th></th>` : html ``}
                                <th>Model</th>
                                <th>Inputs</th>
                                <th>Results</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${Object.keys(running_ensembles).map((index) => {
            let ensemble = running_ensembles[index];
            let model = this.pathway.models[ensemble.modelid];
            if (readmode && !ensemble.selected) {
                return html ``;
            }
            return html `
                                <tr>
                                    ${!readmode ?
                html `
                                        <td><input class="checkbox" type="checkbox" 
                                            ?checked="${ensemble.selected}"
                                            data-index="${index}"></input></td>   
                                        ` :
                html ``}
                                    <td>
                                        <a href="${BASE_HREF}models/${model.id}">${model.name}</a>
                                    </td>
                                    <td>
                                    ${Object.keys(ensemble.bindings).map((inputid) => {
                let dsid = ensemble.bindings[inputid];
                let dataset = this.pathway.datasets[dsid];
                if (dataset) {
                    return html `
                                                <a href="${BASE_HREF}datasets/${dataset.id}">${dataset.name}</a> <br />
                                            `;
                }
                else {
                    return html `${inputid} = ${dsid} <br />`;
                }
            })}
                                    </td>
                                    <td>
                                    ${ensemble.results.map((result) => {
                if (result.match(/^http:/)) {
                    var fname = result.replace(/.*\//, '');
                    return html `
                                                <a href="${result}">${fname}</a>
                                            `;
                }
                return html `
                                            <a href="${BASE_HREF}datasets/${result}">${result}</a> <br />
                                        `;
            })}
                                    </td>
                                </tr>
                            `;
        })}
                        </tbody>
                    </table> 
                </li>
            </ul>
        </div>
        ${!done || this._editMode ?
            html `
            <div class="footer">
                ${this._editMode ?
                html `<wl-button flat inverted
                        @click="${() => { this._editMode = false; }}">CANCEL</wl-button>`
                : html ``}
                <wl-button type="button" class="submit" 
                    @click="${this._publishResults}">Select &amp; Continue</wl-button>
            </div>  
            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.results : ""}</textarea>
            </fieldset>
            ` :
            html `
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("visualize"))}">Continue</wl-button>
            </div>   
            
            ${this.pathway.last_update && this.pathway.last_update.results ?
                html `
                <div class="notepage">${renderLastUpdateText(this.pathway.last_update.results)}</div>
                ` : html ``}
            ${this.pathway.notes && this.pathway.notes.results ?
                html `
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${this.pathway.notes.results}</div>
                </fieldset>
                ` : html ``}             
            `}   
        `;
    }
    stateChanged(state) {
        super.setUser(state);
        super.setPathway(state);
    }
    _publishResults() {
        let executable_ensembles = this.pathway.executable_ensembles || [];
        this.shadowRoot.querySelectorAll("#results_table input.checkbox").forEach((cbox) => {
            let cboxinput = cbox;
            let index = parseInt(cboxinput.dataset["index"]);
            executable_ensembles[index].selected = cboxinput.checked;
        });
        // Update notes
        this.pathway = Object.assign({}, this.pathway, { executable_ensembles: executable_ensembles });
        let notes = this.shadowRoot.getElementById("notes").value;
        this.pathway.notes = Object.assign({}, this.pathway.notes, { results: notes });
        this.pathway.last_update = Object.assign({}, this.pathway.last_update, { results: {
                time: Date.now(),
                user: this.user.email
            } });
        // Update pathway itself
        updatePathway(this.scenario, this.pathway);
        this._editMode = false;
        showNotification("saveNotification", this.shadowRoot);
    }
};
__decorate([
    property({ type: Boolean })
], MintResults.prototype, "_editMode", void 0);
MintResults = __decorate([
    customElement('mint-results')
], MintResults);
export { MintResults };
