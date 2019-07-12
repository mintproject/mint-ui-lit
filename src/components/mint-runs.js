var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { SharedStyles } from "./shared-styles";
import { BASE_HREF } from "../actions/app";
import { MintPathwayPage } from "./mint-pathway-page";
import "weightless/progress-bar";
import { runPathwayExecutableEnsembles } from "../util/state_functions";
import { selectPathwaySection } from "../actions/ui";
let MintRuns = class MintRuns extends connect(store)(MintPathwayPage) {
    static get styles() {
        return [
            SharedStyles,
            css `
          `
        ];
    }
    render() {
        // If no models selected
        if (!this.pathway.executable_ensembles || !this.pathway.executable_ensembles.length) {
            return html `
                Please select some models and datasets first
            `;
        }
        let running_ensembles = {};
        let not_running_ensembles = {};
        for (let i = 0; i < this.pathway.executable_ensembles.length; i++) {
            let ensemble = this.pathway.executable_ensembles[i];
            if (ensemble.runid) {
                running_ensembles["" + i] = ensemble;
            }
            else {
                not_running_ensembles["" + i] = ensemble;
            }
        }
        // Show executable ensembles
        // TODO: Show separate tables 
        // - one for ensembles already run -- Show run status, Allow stopping runs
        // - one for ensembles not yet run -- Allow starting runs
        // TODO: Make sure the call to create executable ensembels doesn't remove 
        //      ensembles with existing runs
        // TODO (Later): Store executable ensembles in a separate collection ? 
        //      Would be easier to refresh than refreshing the whole scenario
        // Store in /runs/(docid) 
        // - (runid, progress, status, provenanceid)
        // An execution will only update that run doc
        // - option a) Add code to Wings to directly update runstatus 
        // - option b) Add some external code to check Wings run and update runstatus
        // The run status client will use the "onSnapshot" on each run to track run progress
        // - When run is finished/stopped, unsubscribe to onSnapshot 
        // Separate run state
        return html `
        <p>
            This step is for monitoring model runs. You can view results of these runs in the next step
        </p>
        <wl-title level="3">Runs</wl-title>
        <div class="clt">
            <ul>
                <li>
                    <wl-title level="4">Model Runs executed</wl-title>
                    <table class="pure-table pure-table-striped">
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Inputs</th>
                                <th>Run Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(running_ensembles).map((index) => {
            let ensemble = running_ensembles[index];
            let model = this.pathway.models[ensemble.modelid];
            return html `
                                <tr>
                                    <td><a href="${BASE_HREF}models/${model.id}">${model.name}</a></td>
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
                                    <td><wl-progress-bar mode="determinate" value="${ensemble.run_progress || 0}"></wl-progress-bar></td>
                                </tr>
                                `;
        })}
                        </tbody>
                    </table>
                    <div class="footer">
                        <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("results"))}">Continue</wl-button>
                    </div>
                </li>
                ${(Object.keys(not_running_ensembles).length > 0) ?
            html `
                    <li>
                        <wl-title level="4">Model Runs not executed</wl-title>
                        <p>
                            These model runs have not yet been executed. To run, please select the configurations and click the RUN button.
                        </p>                
                        <table class="pure-table pure-table-striped" id="notrun">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Model</th>
                                    <th>Inputs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(not_running_ensembles).map((index) => {
                let ensemble = not_running_ensembles[index];
                let model = this.pathway.models[ensemble.modelid];
                return html `
                                    <tr>
                                        <td><input class="checkbox" type="checkbox" data-index="${index}"></input></td>                    
                                        <td><a href="${BASE_HREF}models/${model.id}">${model.name}</a></td>
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
                                    </tr>
                                    `;
            })}
                            </tbody>
                        </table>
                        <div class="footer">
                            <wl-button type="button" class="submit" @click="${this._runSelectedEnsembles}">Run Selected</wl-button>
                        </div>
                    </li>`
            :
                html ``}
            </ul>
        </div>
        `;
    }
    _runSelectedEnsembles() {
        let selected_indices = [];
        this.shadowRoot.querySelectorAll("#notrun input.checkbox").forEach((cbox) => {
            let cboxinput = cbox;
            if (cboxinput.checked) {
                let index = parseInt(cboxinput.dataset["index"]);
                selected_indices.push(index);
            }
        });
        runPathwayExecutableEnsembles(this.scenario, this.pathway, selected_indices);
        // FIXME: Should use ensemble ids instead of indices
    }
    stateChanged(state) {
        super.setUser(state);
        super.setPathway(state);
    }
};
MintRuns = __decorate([
    customElement('mint-runs')
], MintRuns);
export { MintRuns };
