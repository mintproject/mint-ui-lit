import { html, css, customElement, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'

import "weightless/tab-group";
import "weightless/tab";
import "weightless/button";

import 'components/loading-dots';

import emulators, { EmulatorModelIO, EmulatorSearchConstraint, EmulatorsList, EmulatorsListWithStatus } from './reducers';
import { goToPage } from 'app/actions';
import { listEmulatorModelTypes, listModelTypeInputDataValues, listModelTypeInputParamValues, listModelTypeIO, getNumEmulatorsForFilter, searchEmulatorsForModel, searchEmulatorsForFilter } from './actions';
import { getPathFromModel } from 'screens/models/reducers';
import { Emulator } from '@mintproject/modelcatalog_client';
import { Execution } from 'screens/modeling/reducers';
import { DataResource } from 'screens/datasets/reducers';

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
    private _typesLoading : boolean = false;

    @property({type: String})
    private _selectedModel : string = '';

    @property({type: String})
    private _tableType : string = 'filter';
    
    @property({type: Array})
    private _emulators : EmulatorsListWithStatus;

    @property({type: Array})
    private _filtered_emulators : EmulatorsListWithStatus;

    @property({type: Boolean})
    private _emulatorsLoading : boolean = false;

    @property({type: Boolean})
    private _filteredEmulatorsLoading : boolean = false;

    @property({type: Array})
    private _modelIO : EmulatorModelIO[];

    @property({type: Boolean})
    private _modelInputsLoading : boolean = false;

    @property({type: Object})
    private _selectedModelInput : EmulatorModelIO;

    @property({type: Array})
    private _searchConstraints : EmulatorSearchConstraint[] = [];

    private _dispatched: boolean = false;

    private currentPage: number = 1;
    private pageSize: number = 100;
    
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
                min-width:150px;
                border: solid 1px;
            }
            td.nowrap {
                white-space: nowrap;
            }
            table.halfnhalf {
                width: 50%
            }
            table.halfnhalf td,
            table.halfnhalf th {
                width: 50%;
                vertical-align: top;
            }
            table.halfnhalf td select {
                width: 100%
            }
            `,
            SharedStyles
        ];
    }

    private _showEmulators(model) {
        this._selectedModel = model;
        this._searchConstraints = [];
        this._filtered_emulators = null;
        this._emulators = null;
        this._selectedModelInput = null;
        store.dispatch(searchEmulatorsForModel(model, this._regionid));
        store.dispatch(listModelTypeIO(this._selectedModel, this._emulatorRegion));
        store.dispatch(getNumEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));        
        store.dispatch(searchEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));         
        goToPage("emulators/" + model);
    }

    private getParameters(model: any, nodes: any[]) {
        let parameters = {};
        model["parameters"].forEach((param: any) => {
            let name = param["name"];
            if(!parameters[name] && param["fixed_value"] != null) {
                parameters[name] = {
                    from_model: true,
                    value: []
                }
            }
            if(param["fixed_value"] != null)
                parameters[name]["value"].push(param["fixed_value"]);
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

    private _selectConstraintInput(e) {
        let iname = e.target.value;

        let input = null;
        this._modelIO.forEach((ip) => {
            if(ip.name == iname)
                input = ip;
        });
        if(input) {
            this._selectedModelInput = input;

            if(!input.values) {
                if(input.type != "parameter") {
                    console.log(input.name + ": Dispatching input data values for " + this._emulatorRegion);
                    store.dispatch(listModelTypeInputDataValues(
                        this._selectedModel, input, this._emulatorRegion));
                } else {
                    store.dispatch(listModelTypeInputParamValues(
                        this._selectedModel, input, this._emulatorRegion));
                }
            }
        }
    }

    private _addSearchConstraint() {
        let inputname = this.shadowRoot.querySelector<HTMLSelectElement>("#model_input").value;
        let input = this._modelIO.find((input) => input.name==inputname);
                
        let options = this.shadowRoot.querySelector<HTMLSelectElement>("#model_input_values").selectedOptions;
        let inputvalues = [];
        for(let i=0; i<options.length; i++) {
            let itemval = options.item(i).value;
            if(input.type != "parameter")
                inputvalues.push(input.values.find((val) => val.id == itemval));
            else
                inputvalues.push(itemval);
        }
        this._searchConstraints.push({
            input: inputname,
            inputtype: input.type,
            model: this._selectedModel,
            values: inputvalues
        });
        this._selectedModelInput = null;
        store.dispatch(getNumEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));
        store.dispatch(searchEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));
    }

    _nextPage(offset:  number) {
        this.currentPage += offset;
        this._fetchRuns()
    }


    async _fetchRuns () {
        if(!this.currentPage)
            this.currentPage = 1;        
        let start = (this.currentPage - 1)*this.pageSize;
        let limit = this.pageSize;
        let orderBy = null;
        //orderBy[this.orderBy] = this.orderByDesc ? "desc" : "asc";
        store.dispatch(getNumEmulatorsForFilter(
            this._selectedModel, this._emulatorRegion, this._searchConstraints,
            start, limit, orderBy));
        store.dispatch(searchEmulatorsForFilter(
            this._selectedModel, this._emulatorRegion, this._searchConstraints,
            start, limit, orderBy));
    }

    private _deleteConstraint(e) {
        let index = e.target.dataset['index'];
        this._searchConstraints.splice(index, 1);
        store.dispatch(getNumEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));        
        store.dispatch(searchEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));
    }

    private _scrollInto (id:string) {
        let el = this.shadowRoot!.getElementById(id);
        if (el) el.scrollIntoView({block: "start", behavior: "smooth"});
    }

    protected render() {
        let nav = [{label:'Model Products / Emulators', url:'emulators'}] 
        let inputs = (this._modelIO || []).filter((io)=>io.type == "input");
        let params = (this._modelIO || []).filter((io)=>io.type == "parameter");
        let outputs = (this._modelIO || []).filter((io)=>io.type == "output");

        let totalPages = Math.ceil((this._filtered_emulators?.total ?? 0) / this.pageSize);

        return html`
        <nav-title .nav="${nav}"></nav-title>

        <wl-tab-group align="center" style="width: 100%;">
        ${this._typesLoading ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>` :
            (!this._modelTypes ? 
                ""
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
            ${this._typesLoading ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>` :
                (!this._selectedModel ? 
                    (this._modelIO ? html`<center><br />Please select a model</center>` : "") :
                    html`
                    <!-- Emulator Executions -->
                    <div style="display: flex; align-items: center;">
                        <h2 style="padding: 0px 10px;">${this._selectedModel} Emulators</h2>
                        <wl-tab-group align="left">
                            <wl-tab @click="${() => this._tableType = 'filter'}" ?checked="${this._tableType==='filter'}">
                                Filter executions
                            </wl-tab>
                            <wl-tab @click="${() => this._tableType = 'grouped'}" ?checked="${this._tableType==='grouped'}">
                                Executions Grouped by Thread
                            </wl-tab>
                        </wl-tab-group>
                    </div>

                    ${this._tableType == 'filter' ? 
                    (this._modelInputsLoading ? 
                        html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`:
                        (!this._modelIO ? 
                            "" : 
                            html`
                            <table class="pure-table halfnhalf" style="width: 100%">
                                <tbody>
                                <tr>
                                <td>
                                    <table class="pure-table pure-table-bordered" style="width: 100%">
                                        <thead>
                                            <tr>
                                                <th>Input</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this._searchConstraints.map((constraint, index) => {
                                                return html`
                                                <tr>
                                                    <td>${constraint.input}</td>
                                                    <td>
                                                    ${constraint.inputtype != "parameter" ? 
                                                        constraint.values.map((v) => v.name).join(", ") :
                                                        constraint.values.join(", ")
                                                    }
                                                    <div style="float:right;width:20px">
                                                        <wl-icon @click="${this._deleteConstraint}" 
                                                            data-index="${index}" class="actionIcon deleteIcon">delete</wl-icon>
                                                    </div>
                                                    </td>
                                                    
                                                </tr>
                                                `;
                                            })}
                                            <tr>
                                                <td colspan="3">Filter model runs based on input parameter ranges and datasets</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <select id="model_input" @change="${this._selectConstraintInput}">
                                                        <option value="">Select an input</option>
                                                    ${this._modelIO.filter((input) => {
                                                        if(input.type == "output") 
                                                            return false;
                                                        let alreadyUsed = this._searchConstraints.find((cons) => 
                                                            cons.input == input.name);
                                                        if(alreadyUsed)
                                                            return false;
                                                        return true;
                                                    }).map((input) => {
                                                        if(input.name == this._selectedModelInput?.name) {
                                                            return html`<option value="${input.name}" selected="true"
                                                            >${input.name}</option>`;
                                                        }
                                                        else {
                                                            return html`<option value="${input.name}">${input.name}</option>`;
                                                        }
                                                    })}
                                                    </select>
                                                    ${this._selectedModelInput && this._selectedModelInput.values ? 
                                                    html`
                                                        <div>
                                                            <br />
                                                            <wl-button class="submit"
                                                                @click="${this._addSearchConstraint}"
                                                                >Add Filter</wl-button>
                                                        </div>
                                                    `
                                                    : ""
                                                    }
                                                </td>
                                                <td>
                                                ${!this._selectedModelInput ? "" : 
                                                    (!this._selectedModelInput.values ?
                                                        html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>` :
                                                        html`
                                                        <select id="model_input_values" multiple="true">
                                                        ${(this._selectedModelInput.values || []).map((value) => {
                                                            if(this._selectedModelInput.type == "parameter") {
                                                                return html`
                                                                <option value="${value}">${value}</option>
                                                                `;
                                                            } else {
                                                                return html`
                                                                <option value="${value.id}">${value.name}</option>
                                                                `;
                                                            }
                                                        })}
                                                        </select>`
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td>
                                </td>
                                </tr>
                                </tbody>
                            </table>

                        <div style="width:100%; border:1px solid #EEE;border-bottom:0px;">
                        ${this._filtered_emulators && this._filtered_emulators.total && !this._filtered_emulators.loading ? 
                        html`
                        ${this.currentPage > 1 ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(-1)}>Back</wl-button>` :
                            html `<wl-button flat inverted disabled>Back</wl-button>`
                        }
                        Page ${this.currentPage} of ${totalPages}
                        ${this.currentPage < totalPages ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(1)}>Next</wl-button>` :
                            html `<wl-button flat inverted disabled>Next</wl-button>`
                        }
                        <span style="float:right">
                            <span>Scroll to:</span>
                            <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;" @click="${() => this._scrollInto('in')}">inputs</wl-button>
                            <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;" @click="${() => this._scrollInto('param')}">parameters</wl-button>
                            <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;" @click="${() => this._scrollInto('out')}">outputs</wl-button>
                            |
                            <wl-button type="button" flat inverted  @click="${() =>(this.currentPage = 1) && this._fetchRuns()}">
                                Reload
                            </wl-button>
                        </span>
                        ` : ""
                        }
                        </div>
                        <div style="height:400px;overflow:auto;width:100%;border:1px solid #EEE">                        
                        <!-- Filter Executions -->
                        ${!this._filtered_emulators?.list ? "" :
                        (this._filteredEmulatorsLoading ? 
                            html`<wl-progress-spinner class="loading"></wl-progress-spinner>` :
                            html`
                            <table class="pure-table pure-table-striped results_table">
                                    <!-- Heading -->
                                    ${inputs.length > 0 ? 
                                        html `<colgroup span="${inputs.length}"></colgroup>` : ""} <!-- Inputs -->
                                    ${params.length > 0 ? 
                                        html `<colgroup span="${params.length}"></colgroup>` : ""} <!-- Parameters -->
                                    ${outputs.length > 0 ? 
                                        html `<colgroup span="${outputs.length}"></colgroup>` : ""} <!-- Outputs -->
                                    <thead>
                                        <tr>
                                            ${inputs.length > 0 ? 
                                                html `<th colspan="${inputs.length}" id="in">Inputs</th>` : ""} <!-- Inputs -->
                                            ${params.length > 0 ? 
                                                html `<th colspan="${params.length}" id="param">Parameters</th>` : ""} <!-- Parameters -->
                                            ${outputs.length > 0 ? 
                                                html `<th colspan="${outputs.length}" id="out">Outputs</th>` : ""} <!-- Outputs -->
                                        </tr>
                                        <tr>
                                            ${inputs.map((inf) => html`<th scope="col">${inf.name.replace(/(-|_)/g, ' ')}</th>` )}
                                            ${params.map((param) => html`<th scope="col">${param.name.replace(/(-|_)/g, ' ')}</th>` )}
                                            ${outputs.map((outf) => html`<th scope="col">${outf.name.replace(/(-|_)/g, ' ')}</th>` )}                                                        
                                        </tr>
                                    </thead>
                                    <!-- Body -->
                                    <tbody>
                                    ${Object.keys(this._filtered_emulators?.list || []).length == 0 ? 
                                        html`
                                        <tr><td colspan="${inputs.length + 
                                                params.length + outputs.length + 1}">
                                            - No results available -
                                        </td></tr>` : ""
                                    }
                                    ${Object.keys(this._filtered_emulators?.list || []).map((index) => {
                                        let ensemble: Execution = this._filtered_emulators.list[index];
                                        return html`
                                            <tr>
                                                ${inputs.map((input) => {
                                                    let res = ensemble.bindings[input.name] as DataResource;
                                                    if(res) {
                                                        // FIXME: This could be resolved to a collection of resources
                                                        return html`
                                                            <td><a href="${res.url}">${res.name}</a></td>
                                                        `;
                                                    }
                                                    else {
                                                        return html`<td></td>`;
                                                    }
                                                })}
                                                ${params.map((param) => html`<td>
                                                    ${ensemble.bindings[param.name]}
                                                </td>`
                                                )}
                                                ${outputs.map((output:any) => {
                                                    let result = ensemble.results[output.name];
                                                    if(result) {
                                                        let furl = result?.url;
                                                        let fname = result?.name;
                                                        return html`<td><a href="${furl}">${fname}</a></td>`;
                                                    }
                                                    else {
                                                        return html`<td></td>`;
                                                    }
                                                })}                                                            
                                            </tr>
                                        `;
                                    })}
                                    </tbody>
                            </table>`
                        )}                            
                        </div>`
                    ) ) : (
                    this._emulatorsLoading ? 
                        html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`:
                        (!this._emulators ? 
                            html`<div>Error: Could not load executions by thread</div>` 
                            : 
                            html`
                            <table class="pure-table pure-table-bordered">
                                <thead>
                                    <tr><th>Model Calibrated for Region</th><th>Executed for Region</th><th>Time period</th><th>Input</th><th>Model Setup</th><th>Ensemble description (range of parameters)</th><th>Output summary (Ensemble)</th></tr>
                                </thead>
                                <tbody>
                                ${this._emulators.list.map((em) => {
                                    let model_region = em.region_name;
                                    let modelname = em.name;
                                    let model_uri =  this._regionid + '/models/explore' + getPathFromModel(em);
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
                                                    <td class='nowrap'>${model_region}</td>
                                                    <td class='nowrap'>${task["region"]["name"]}</td>
                                                    <td class='nowrap'>${thread["start_date"]} - ${thread["end_date"]}</td>
                                                    <td class='nowrap'>${inputsHTML}</td>
                                                    <td><a href="${model_uri}">${modelname}</a></td>
                                                    <td class='nowrap'>${paramsHTML}</td>
                                                    <td class='nowrap'>
                                                        <a href="${thread_uri}">${numexecutions} Executions</a>
                                                    </td>
                                                </tr>`;
                                            }
                                        });
                                    }
                                })}
                                </tbody>
                            </table>`)
                    )}`
            )}
        </div>`;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        super.setSubPage(state);
        if(this._emulatorRegion != this._regionid && this._regionid && this._subpage == "emulators") {
            if(this._emulatorRegion) {
                this._selectedModel = null;            
                state.emulators.selected_model = null;
            }
            this._emulatorRegion = this._regionid;

            this._modelTypes = null;
            this._emulators = null;
            this._filtered_emulators = null;
            this._modelIO = null;
            state.emulators.models = null;            
            state.emulators.emulators = null;
            state.emulators.filtered_emulators = null;
            state.emulators.model_io = null; 
            console.log("Dispatching model types for region: "+this._emulatorRegion);
            store.dispatch(listEmulatorModelTypes(this._emulatorRegion));
        }

        if(state.emulators) {
            // Get model types
            if(state.emulators.models && !this._modelTypes) {
                this._typesLoading = state.emulators.models.loading;
                if(!this._typesLoading)
                    this._modelTypes = state.emulators.models.list;
            }
            // Get executions by thread
            if(state.emulators.emulators && state.emulators.emulators[this._selectedModel]) {
                this._emulatorsLoading = state.emulators.emulators[this._selectedModel].loading;
                if(!this._emulatorsLoading) {
                    this._emulators = state.emulators.emulators[this._selectedModel];
                    this._dispatched = false;
                }
            }
            // Get executions by filter
            if(state.emulators.filtered_emulators && state.emulators.filtered_emulators[this._selectedModel]) {
                this._filteredEmulatorsLoading = state.emulators.filtered_emulators[this._selectedModel].loading;
                if(!this._filteredEmulatorsLoading) {
                    let _filtered_emulators = state.emulators.filtered_emulators[this._selectedModel];
                    if(_filtered_emulators?.total) {
                        this._filtered_emulators = {
                            loading: false,
                            total: _filtered_emulators.total,
                            list: this._filtered_emulators?.list
                        }
                    }
                    else if(_filtered_emulators?.list) {
                        this._filtered_emulators = {
                            loading: false,
                            total: this._filtered_emulators?.total,
                            list: _filtered_emulators.list
                        }
                    }
                }
            }
            // If the selected model has changed
            if(state.emulators.selected_model && this._modelTypes && !this._dispatched &&
                    (!this._selectedModel || this._selectedModel != state.emulators.selected_model)) {
                this._selectedModel = state.emulators.selected_model;

                // Fetch model inputs and executions by thread
                this._emulators = null;
                this._modelIO = null;
                this._filtered_emulators = null;
                state.emulators.emulators = null;
                state.emulators.filtered_emulators = null;
                state.emulators.model_io = null;
                this._dispatched = true;
                store.dispatch(searchEmulatorsForModel(this._selectedModel, this._emulatorRegion));
                store.dispatch(listModelTypeIO(this._selectedModel, this._emulatorRegion));
                store.dispatch(getNumEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));        
                store.dispatch(searchEmulatorsForFilter(this._selectedModel, this._emulatorRegion, this._searchConstraints));                
            }
            
            if(this._selectedModel) {
                // Get model inputs (and possible values) for selected model
                if(state.emulators.model_io && state.emulators.model_io[this._selectedModel]) {
                    this._modelInputsLoading = state.emulators.model_io[this._selectedModel].loading;
                    if(!this._modelInputsLoading) {
                        this._modelIO = state.emulators.model_io[this._selectedModel].list;
                        this._dispatched = false;
                    }
                    
                    if(this._modelIO) {
                        // Check if any input has been changed (i.e. values filled up)
                        // - If so, request update of UI
                        let ip = this._modelIO.find((input) => input.changed)
                        if(ip) {
                            ip.changed = false;
                            this.requestUpdate();
                        };
                    }
                }
            }
        }
    }
}

