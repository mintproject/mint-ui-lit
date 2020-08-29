import { html, css, customElement, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'

import "weightless/tab-group";
import "weightless/tab";

import 'components/loading-dots';

import emulators from './reducers';
import { goToPage } from 'app/actions';
import { listEmulatorModelTypes, searchEmulatorsForModel } from './actions';

store.addReducers({
    emulators
});

@customElement("emulators-home")
export class EmulatorsHome extends connect(store)(PageViewElement) {
    @property({type: Array})
    private _modelTypes : string[];

    @property({type: String})
    private _emulatorRegion : string;

    @property({type: Boolean})
    private _typesLoading : boolean = true;

    @property({type: String})
    private _selectedModel : string = '';
    
    @property({type: Array})
    private _emulators : any[];

    @property({type: Boolean})
    private _emulatorsLoading : boolean = true;

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

            ul {
                margin:2px;
                padding: 1px;
                padding-left: 5px;
                margin-left: 5px;
            }
            ul li {
                padding: 1px;
                white-space: nowrap;
                margin-left: 5px;
            }
            .hideContent {
                overflow: hidden;
                /*line-height: 1em;*/
                height: 8em;
            }
            .showContent {
                /*line-height: 1em;*/
                height: auto;
            }
            .show-more {
                padding: 10px 0;
            }
            .bold {
                font-weight: bold;
            }
            td {
                min-width:100px;
                border: solid 1px;
                white-space: nowrap;
            }
            `,
            SharedStyles
        ];
    }

    private _showEmulators(model) {
        this._selectedModel = model;
        this._emulators = null;
        store.dispatch(searchEmulatorsForModel(model, this._regionid));
        goToPage("emulators/" + model);
    }

    private getParameters(model: any, nodes: any[]) {
        let parameters = {};
        model["parameters"].forEach((param: any) => {
            let name = param["name"];
            if(!parameters[name] && param["value"] != null) {
                parameters[name] = {
                    from_model: true,
                    value: []
                }
            }
            if(param["value"] != null)
                parameters[name]["value"].push(param["value"]);
        });
        nodes.forEach((node) => {
            let name = node["model_parameter"]["name"];
            if(!parameters[name])
                parameters[name] = {
                    from_model: false,
                    value: []
                }
            if(node["parameter_value"])
                parameters[name]["value"].push(node["parameter_value"]);
        });
        return parameters;
    }

    private getInputs(model: any, nodes: any[]) {
        let inputs = {};
        model["inputs"].forEach((input: any) => {
            let io = input["model_io"];
            let name = io["name"];
            if(!inputs[name] && io["fixed_bindings"].length > 0)
                inputs[name] = {
                    from_model: true,
                    value: []
                }
            io["fixed_bindings"].forEach((res: any) => {
                inputs[name]["value"].push(res["resource"]);
            });
        });
        nodes.forEach((node) => {
            let name = node["model_io"]["name"];
            if(!inputs[name])
                inputs[name] = {
                    from_model: false,
                    value: []
                }
            let resources = node["dataslice"]["resources"] as any[];
            resources.forEach((res: any) => {
                inputs[name]["value"].push(res["resource"]);
            });
        });
        return inputs;
    }

    private showHidden(event: any) {
        let content = event.currentTarget.parentNode.previousSibling;
        let linkText = event.currentTarget.text.toUpperCase();
        if(linkText === "SHOW MORE"){
            event.currentTarget.text = "Show less";
            content.className = "showContent";
        } else {
            event.currentTarget.text = "Show more";
            content.className = "hideContent";
        };
    }

    private getParamsHTML(params: object) {
        let pnames = Object.keys(params).sort((a, b) => {
            if(params[a]["from_model"] != params[b]["from_model"]) {
                return params[a]["from_model"] ? 1 : -1;
            }
            else {
                return params[a]["name"] < params[b]["name"] ? -1 : 1;
            }
        });
        let largeContent = Object.keys(params).length > 7;
        return html`
            <div class="${largeContent ? "largeContent hideContent" : ""}">
            <ul>
            ${pnames.map((pname) => {
                let param = params[pname];
                let className = param["from_model"] ? 'normal': 'bold';
                let pvalues = param["value"];
                return html`<li class="${className}">${pname}: ${pvalues.join(", ")}</li>`;
            })}
            </ul>
            </div>
            ${largeContent ? 
                html`
                <div class="show-more">
                    <a @click="${this.showHidden}">Show more</a>
                </div>` : ""
            }
        `;
    }

    private getInputsHTML(inputs: object) {
        let inames = Object.keys(inputs).sort((a, b) => inputs[a]["from_model"] ? 1 : -1);
        let sizes = inames.map((iname) => inputs[iname]["value"].length);
        let totalSize = inames.length*2;
        sizes.forEach((size) => totalSize += size);

        let largeContent = totalSize > 7;
        return html`
            <div class="${largeContent ? "largeContent hideContent" : ""}">
            ${inames.map((iname) => {
                let ivalues = inputs[iname]["value"].filter((input:any, index:number, self:any) =>
                    index === self.findIndex((t:any) => (
                        t["url"].toLowerCase() === input["url"].toLowerCase()
                    )));
                ivalues.sort((a:any, b:any) => (a["name"] > b["name"]) ? 1 : -1);
                let className = inputs[iname]["from_model"] ? 'normal': 'bold';
                return html`
                <div class="${className}">${iname}</div>
                <ul>
                ${ivalues.map((res:any) => {
                    let resname = res["name"];
                    if(resname.match(/^http/)) {
                        resname = resname.replace(/^.*\//, '');
                    }
                    return html`<li><a href="${res["url"]}">${resname}</a></li>`;
                })}
                </ul>
                </li>
                `;
            })}
            </div>
            ${largeContent ? 
                html`
                <div class="show-more">
                    <a @click="${this.showHidden}">Show more</a>
                </div>` : ""
            }
        `;
    }

    protected render() {
        let nav = [{label:'Model Products / Emulators', url:'emulators'}] 
        return html`
        <nav-title .nav="${nav}"></nav-title>

        <wl-tab-group align="center" style="width: 100%;">
        ${this._typesLoading ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>` :
            (!this._modelTypes ? 
                html`<wl-tab>Error: Could not load tabs</wl-tab>` 
                : this._modelTypes.map((mtype) => {
                    return html`
                    <wl-tab @click="${() => this._showEmulators(mtype)}" 
                        ?checked="${this._selectedModel==mtype}">${mtype}</wl-tab>`;
                })
            )
        }
        </wl-tab-group>

        <div class="emulators">
            <!-- Emulators Heading -->
            ${this._typesLoading ? "" :
                (this._selectedModel ? 
                    html`
                    <!-- Emulator Executions -->
                    <h2>${this._selectedModel} Emulators</h2>
                    <table class="pure-table pure-table-bordered">
                        <thead>
                            <tr><th>Area</th><th>Region</th><th>Time period</th><th>Input</th><th>Model Setup</th><th>Ensemble description (range of parameters)</th><th>Output summary (Ensemble)</th><th>JSON-Summary</th><th>URL to be shared</th><th>Results reviewed by modeler</th><th>Quality</th><th>Status</th><th>Validated?</th><th>Usage Notes</th><th>Comments</th></tr>
                        </thead>
                        <tbody>
                        ${this._emulatorsLoading ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`:
                            (!this._emulators) ? 
                                html`<tr><td colspan="10">Error: Could not load emulators</td></tr>` 
                                : this._emulators.map((em) => {
                                    let model_region = em.calibrated_region;
                                    let modelid = em.id;
                                    let modelname = em.name;
                                    let tms = em["thread_models"] as any[];
                                    if (tms && tms.length > 0) {
                                        return tms.map((tm) => {
                                            let thread = tm["thread"];
                                            let task = thread["task"];
                                            let problem = task["problem_statement"];
                                            let numexecutions = tm["executions_aggregate"]["aggregate"]["count"];
                                            if(numexecutions > 0) {
                                                let thread_uri = `/${this._regionid}/modeling/problem_statement/${problem["id"]}/${task["id"]}/${thread["id"]}`;
                                                let params = this.getParameters(
                                                    tm["model"], 
                                                    tm["parameter_bindings_aggregate"]["nodes"]);
                                                let inputs = this.getInputs(
                                                    tm["model"], 
                                                    tm["data_bindings_aggregate"]["nodes"]);
                                                let paramsHTML = this.getParamsHTML(params);
                                                let inputsHTML = this.getInputsHTML(inputs);                                        
                                                return html`
                                                <tr>
                                                    <td>${model_region}</td>
                                                    <td>${task["region"]["name"]}</td>
                                                    <td>${thread["start_date"]} - ${thread["end_date"]}</td>
                                                    <td>${inputsHTML}</td>
                                                    <td><a href="${modelid}">${modelid}</a></td>
                                                    <td>${paramsHTML}</td>
                                                    <td>
                                                        <a href="${thread_uri}">${numexecutions} Executions</a>
                                                    </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                    <td> - </td>
                                                </tr>`;
                                            }
                                        });
                                    }
                                }
                            )
                        }
                        </tbody>
                    </table>`
            : html`<center><br />Please select a model</center>`
            )}
        </div>`;
    }

    protected firstUpdated() {
        /*
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
            })*/
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if(this._emulatorRegion != this._regionid && this._regionid) {
            this._emulatorRegion = this._regionid;
            this._selectedModel = null;            
            state.emulators.selected_model = null;

            this._modelTypes = null;
            state.emulators.models = null;
            store.dispatch(listEmulatorModelTypes(this._emulatorRegion));

            if(this._selectedModel) {
                this._emulators = null;
                state.emulators.emulators = null;                
                store.dispatch(searchEmulatorsForModel(this._selectedModel, this._emulatorRegion));
            }
        }
        if(state.emulators && state.emulators.models && !this._modelTypes) {
            this._typesLoading = state.models.loading;
            if(!this._typesLoading) {
                this._modelTypes = state.emulators.models;
            }
        }

        if(state.emulators && state.emulators.selected_model) {
            this._selectedModel = state.emulators.selected_model;
        }

        if(state.emulators && state.emulators.emulators) {
            this._emulatorsLoading = state.emulators.loading;
            if(!this._emulatorsLoading && state.emulators.emulators[this._selectedModel]) {
                this._emulators = state.emulators.emulators[this._selectedModel];
            }
        }
    }
}

