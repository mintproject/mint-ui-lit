import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";
import { getPathwayRunsStatus, TASK_DONE } from "../../../util/state_functions";
import { ExecutableEnsemble, StepUpdateInformation } from "../reducers";
import { updatePathway } from "../actions";
import { showNotification } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { renderLastUpdateText } from "../../../util/ui_renders";
import { MintPathwayPage } from "./mint-pathway-page";

@customElement('mint-results')
export class MintResults extends connect(store)(MintPathwayPage) {

    @property({type: Boolean})
    private _editMode: Boolean = false;
    
    static get styles() {
        return [
          SharedStyles,
          css`
          `
        ]
    }
    
    protected render() {
        if(!this.pathway) {
            return html ``;
        }
        
        // If no models selected
        if(getPathwayRunsStatus(this.pathway) != TASK_DONE) {
            return html `
            <p>This step is for browsing the results of the models that you ran earlier.</p>
            Please run some models first
            `
        }

        let running_ensembles = {};
        let not_running_ensembles = {};
        let done = false;

        for(let i=0; i<this.pathway.executable_ensembles!.length; i++) {
            let ensemble = this.pathway.executable_ensembles![i];
            if(ensemble.runid) {
                running_ensembles[""+i] = ensemble;
                if(ensemble.selected)
                    done = true;
            }
            else {
                not_running_ensembles[""+i] = ensemble;
            }
        }
        
        let readmode = (done && !this._editMode);

        // Show executable ensembles
        return html`

        <p>This step is for browsing the results of the models that you ran earlier. 
        You can select the results that you would like to keep, and they will be recorded</p>
        ${readmode ? 
            html`
            <p>
            Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to to see all the runs and 
            select those that you want to save, only saved runs are shown here
            </p>`
            : 
            html``
        }
        
        <wl-title level="3">
            Results
            <wl-icon @click="${() => { this._editMode = true } }" 
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
                        html``
                    }
                    <table class="pure-table pure-table-striped" id="results_table">
                        <thead>
                            <tr>
                                ${!readmode ? html`<th></th>`: html``}
                                <th>Model</th>
                                <th>Inputs</th>
                                <th>Results</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${Object.keys(running_ensembles).map((index) => {
                            let ensemble: ExecutableEnsemble = running_ensembles[index];
                            let model = this.pathway.models![ensemble.modelid];
                            if(readmode && !ensemble.selected) {
                                return html``;
                            }
                            return html`
                                <tr>
                                    ${!readmode ? 
                                        html`
                                        <td><input class="checkbox" type="checkbox" 
                                            ?checked="${ensemble.selected}"
                                            data-index="${index}"></input></td>   
                                        `: 
                                        html ``
                                    }
                                    <td>
                                        <a href="${BASE_HREF}models/${model.id}">${model.name}</a>
                                    </td>
                                    <td>
                                    ${Object.keys(ensemble.bindings).map((inputid) => {
                                        let dsid = ensemble.bindings[inputid];
                                        let dataset = this.pathway.datasets![dsid];
                                        if(dataset) {
                                            return html`
                                                ${inputid} = <a href="${BASE_HREF}datasets/${dataset.id}">${dataset.name}</a> <br />
                                            `;
                                        }
                                        else {
                                            return html `${inputid} = ${dsid} <br />`
                                        }
                                    })}
                                    </td>
                                    <td>
                                    ${ensemble.results.map((result) => {
                                        if(result.match(/^http:/)) {
                                            var fname = result.replace(/.*\//, '');
                                            return html`
                                                <a href="${result}">${fname}</a>
                                            `
                                        }
                                        return html`
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
            html`
            <div class="footer">
                ${this._editMode ? 
                    html `<wl-button flat inverted
                        @click="${() => {this._editMode = false;}}">CANCEL</wl-button>`
                    : html``}
                <wl-button type="button" class="submit" 
                    @click="${this._publishResults}">Select &amp; Continue</wl-button>
            </div>  
            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.results : ""}</textarea>
            </fieldset>
            `: 
            html`
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("visualize"))}">Continue</wl-button>
            </div>   
            
            ${this.pathway.last_update && this.pathway.last_update.results ? 
                html `
                <div class="notepage">${renderLastUpdateText(this.pathway.last_update.results)}</div>
                `: html ``
            }
            ${this.pathway.notes && this.pathway.notes.results ? 
                html`
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${this.pathway.notes.results}</div>
                </fieldset>
                `: html``
            }             
            `
        }   
        `;
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setPathway(state);
    }

    _publishResults() {

        let executable_ensembles = this.pathway.executable_ensembles || [];
        this.shadowRoot!.querySelectorAll("#results_table input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            let index = parseInt(cboxinput.dataset["index"]!);
            executable_ensembles![index].selected = cboxinput.checked;
        });

        // Update notes
        this.pathway = {
            ...this.pathway,
            executable_ensembles: executable_ensembles
        }

        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        this.pathway.notes = {
            ...this.pathway.notes!,
            results: notes
        };
        this.pathway.last_update = {
            ...this.pathway.last_update!,
            results: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };

        // Update pathway itself
        updatePathway(this.scenario, this.pathway);
        
        this._editMode = false;
        showNotification("saveNotification", this.shadowRoot!);

    }
}
