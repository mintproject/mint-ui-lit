import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { ModelMap, ModelEnsembleMap, ComparisonFeature, StepUpdateInformation, ExecutableEnsembleSummary } from "../reducers";
import models, { VariableModels, Model } from "../../models/reducers";

import { SharedStyles } from "../../../styles/shared-styles";
import { updatePathway, deleteAllPathwayEnsembleIds } from "../actions";
import { removeDatasetFromPathway, matchVariables, getUISelectedSubgoalRegion } from "../../../util/state_functions";

import "weightless/tooltip";
import "weightless/popover-card";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { showNotification, showDialog } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { queryModelsByVariables } from "../../models/actions";
import { getVariableLongName } from "../../../offline_data/variable_list";
import { MintPathwayPage } from "./mint-pathway-page";
import { Region } from "screens/regions/reducers";
import { IdMap } from "app/reducers";

store.addReducers({
    models
});

@customElement('mint-models')
export class MintModels extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _queriedModels: VariableModels = {} as VariableModels;

    @property({type: Object})
    private _editMode: Boolean = false;

    @property({type: Array})
    private _modelsToCompare: Model[] = [];

    @property({type: Object})
    private _subregion: Region;
    
    @property({type:Boolean})
    private _showAllModels: boolean = false;

    private _dispatched: Boolean = false;

    private _responseVariables: string[] = [];
    private _drivingVariables: string[] = [];

    private _comparisonFeatures: Array<ComparisonFeature> = [
        {
            name: "More information",
            fn: () => html `
                <a target="_blank" href="#">Model Profile</a>
                `
        },        
        {
            name: "Original model",
            fn: (model:Model) => html `
                <a target="_blank" href="${this._getModelURL(model)}">${model.original_model}</a>
                `
        },        
        {
            name: "Adjustable variables",
            fn: (model:Model) => {
                if (model.input_parameters.length > 0) {
                    let values = model.input_parameters.filter((ip) => !ip.value);
                    if (values.length > 0) {
                        return values.map((ip) => ip.name).join(', ');
                    }
                }
                return "None";
            }
        },
        {
            name: "Model type",
            fn: (model:Model) => model.model_type
        },
        {
            name: "Modeled processes",
            fn: (model:Model) => model.modeled_processes
        },
        {
            name: "Parameter assignment/estimation",
            fn: (model:Model) => model.parameter_assignment
        },
        {
            name: "Parameter assignment/estimation details",
            fn: (model:Model) => model.parameter_assignment_details
        },
        {
            name: "Target variable for parameter assignment/estimation",
            fn: (model:Model) => model.target_variable_for_parameter_assignment
        },
        {
            name: "Configuration region",
            fn: (model:Model) => model.calibrated_region
        },
        {
            name: "Spatial dimensionality",
            fn: (model:Model) => html`<span style="font-family: system-ui;"> ${model.dimensionality} </span>`
        },
        {
            name: "Spatial grid type",
            fn: (model:Model) => model.spatial_grid_type
        },
        {
            name: "Spatial grid resolution",
            fn: (model:Model) => model.spatial_grid_resolution
        },
        {
            name: "Minimum output time interval",
            fn: (model:Model) => model.minimum_output_time_interval
        }
    ]

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
                
        let modelids = Object.keys((this.pathway.models || {})) || [];
        let done = (this.pathway.models && modelids.length > 0);
        let availableModels = this._queriedModels[this._responseVariables.join(",")] || [];
        let regionModels = availableModels.filter((model: Model) => {
            let model_region_name = model.calibrated_region.toLowerCase();
            let top_region_name = this._region.name.toLowerCase();
            let task_region_name = this._subregion ? this._subregion.name.toLowerCase() : null;
            if(model_region_name.indexOf(top_region_name) >=0) return true;
            if(top_region_name.indexOf(model_region_name) >=0) return true;
            if(task_region_name) {
                if(model_region_name.indexOf(task_region_name) >=0) return true;
                if(task_region_name.indexOf(model_region_name) >=0) return true;
            }
            return false;
        })
        return html`
        <p>
            The models below are appropriate for the indicators of interest. You can select multiple calibrated models and compare them.  
        </p>
        ${done && !this._editMode ? html`<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.</p>`: html``}
        ${(done && !this._editMode) ?
            // Models chosen already
            html`
            <div class="clt">
                <wl-title level="3">
                    Models
                    <wl-icon @click="${() => { this._setEditMode(true) } }" 
                        id="editModelsIcon" class="actionIcon editIcon">edit</wl-icon>
                </wl-title>
                <wl-tooltip anchor="#editModelsIcon" 
                    .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                    anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                    Change Model Selection
                </wl-tooltip>
                <ul>
                    ${modelids.map((modelid) => {
                        let model = this.pathway.models![modelid];
                        return html`
                        <li>
                            <a target="_blank" href="${this._getModelURL(model)}">${model.name}</a>
                        </li>
                        `
                    })}
                </ul>
            </div>
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("datasets"))}">Continue</wl-button>
            </div>
            
            ${this.pathway.last_update && this.pathway.last_update.models ? 
                html `
                <div class="notepage">${renderLastUpdateText(this.pathway.last_update.models)}</div>
                `: html ``
            }            
            ${this.pathway.notes && this.pathway.notes.models ? 
                html`
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${this.pathway.notes.models}</div>
                </fieldset>
                `: html``
            }         
            `
        :
        !(this.pathway.response_variables && this.pathway.response_variables.length > 0) ?
            html `Please select a response variable first`
            :
            // Choose Models
            html`
            <div class="clt">
                <wl-title level="3">
                    Models
                </wl-title>
                <p>
                    The models below generate data that includes the indicator that you selected earlier: 
                    "${this.pathway.response_variables.map((variable) => getVariableLongName(variable)).join(", ")}".
                    Other models that are available in the system do not generate that kind of result.
                    ${this.pathway.driving_variables.length ? 
                        html`
                        These models also allow adjusting the adjustable variable you selected earlier:
                        "${this.pathway.driving_variables.map((variable) => getVariableLongName(variable)).join(", ")}".
                        `
                        : ""
                    }
                    The column "Relevant Output File" shows the output file that contains the response variable.
                </p>
                <ul>
                    <li>
                    ${this._dispatched ? 
                        html`<wl-progress-bar></wl-progress-bar>`
                    :
                        html`
                        <table class="pure-table pure-table-striped">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th><b>Model</b></th>
                                    <th>Category</th>
                                    <th>Calibration Region</th>
                                    <th>Relevant Output File</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${availableModels.length>0 ?
                                    availableModels.map((model: Model) => {
                                        if(!model)
                                            return;
                                        if(this._showAllModels || regionModels.indexOf(model) >=0) {
                                            return html`
                                            <tr>
                                                <td><input class="checkbox" type="checkbox" data-modelid="${model.id}"
                                                    ?checked="${modelids.indexOf(model.id!) >= 0}"></input></td>
                                                <td><a target="_blank" href="${this._getModelURL(model)}">${model.name}</a></td> 
                                                <td>${model.category}</td>
                                                <td>${model.calibrated_region}</td>
                                                <td>
                                                ${Object.keys(model.output_files).filter((ioid) => {
                                                    return matchVariables(this.pathway.response_variables, model.output_files[ioid].variables, false); // Partial match
                                                })
                                                .map((ioid) => { return model.output_files[ioid].name })
                                                .join(", ")}
                                                </td>
                                            </tr>
                                            `;
                                        }
                                    })
                                :
                                    html`
                                    <tr>
                                        <td colspan="5" style="text-align:center; color: rgb(153, 153, 153);">
                                            - No model found -
                                        </td>
                                    </tr>
                                    `
                                }
                                ${(availableModels.length - regionModels.length) > 0 ? 
                                    html`
                                    <tr>
                                        <td colspan="5" style="text-align:left; color: rgb(153, 153, 153);">
                                            <a style="cursor:pointer" @click="${() => {this._showAllModels = !this._showAllModels}}">
                                                ${!this._showAllModels ? "Show" : "Hide"} 
                                                ${availableModels.length - regionModels.length} models
                                                for other regions
                                            </a>
                                        </td>
                                    </tr>
                                    `
                                    : ""
                                }
                            </tbody>
                        </table>

                        <div class="footer">
                            <wl-button type="button" flat inverted outlined @click="${this._compareModels}">Compare Selected Models</wl-button>
                            <div style="flex-grow: 1">&nbsp;</div>
                            ${this._editMode ? html `<wl-button @click="${()=>{this._editMode=false}}" flat inverted>CANCEL</wl-button>`: html``}
                            <wl-button type="button" class="submit" @click="${this._selectPathwayModels}">Select &amp; Continue</wl-button>
                        </div>
                        `
                    }

                    </li>
                </ul>
            </div>

            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.models : ""}</textarea>
            </fieldset>

            `
        }
        
        ${renderNotifications()}
        ${this._renderDialogs()}

        `
    }

    _renderDialogs() {
        return html`
        <wl-dialog class="comparison" fixed backdrop blockscrolling id="comparisonDialog">
            <table class="pure-table pure-table-striped">
                <thead>
                    <th style="border-right:1px solid #EEE"></th>
                    ${this._modelsToCompare.map((model) => {
                        return html`
                        <th .style="width:${100/(this._modelsToCompare.length)}%"><b>${model.name}</b></th>
                        `
                    })}
                </thead>
                <tbody>
                    ${this._comparisonFeatures.map((feature) => {
                        return html`
                        <tr>
                            <td style="border-right:1px solid #EEE"><b>${feature.name}</b></td>
                            ${this._modelsToCompare.map((model) => {
                                return html`
                                    <td>${feature.fn(model)}</td>
                                `
                            })}
                        </tr>
                        `;
                    })}
                </tbody>
            </table>
        </wl-dialog>
        `;
    }

    _getModelURL (model:Model) {
        let url = this._regionid + '/models/explore/' + model.original_model;
        if (model.model_version) {
            url += '/' + model.model_version;
            if (model.model_configuration) {
                url += '/' + model.model_configuration;
                if (model.localname) {
                    url += '/' + model.localname;
                }
            }
        }
        return url;
    }

    _getSelectedModels() {
        let models:ModelMap = {};
        this.shadowRoot!.querySelectorAll("input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            let modelid = cboxinput.dataset["modelid"];
            if(cboxinput.checked) {
                this._queriedModels[this._responseVariables.join(',')].map((model: Model) => {
                    if(model.id == modelid) {
                        models[model.id!] = model;
                        return;
                    }
                });
            }
        });       
        return models; 
    }

    _setEditMode(mode: Boolean) {
        this._editMode = mode;
        if(mode) {
            this._queryModelCatalog();
        }
    }

    _compareModels() {
        let models = this._getSelectedModels();
        if (Object.keys(models).length < 2) {
            showNotification("selectTwoModelsNotification", this.shadowRoot!);
            return;
        }
        this._modelsToCompare = Object.values(models);
        showDialog("comparisonDialog", this.shadowRoot!);
    }

    _selectPathwayModels() {
        let models = this._getSelectedModels();
        let model_ensembles:ModelEnsembleMap = this.pathway.model_ensembles || {};
        let executable_ensemble_summary:IdMap<ExecutableEnsembleSummary> = this.pathway.executable_ensemble_summary || {};

        if (Object.keys(models).length < 1) {
            showNotification("selectOneModelNotification", this.shadowRoot!);
            return;
        }

        // Check if any models have been removed
        Object.keys(this.pathway.models || {}).map((modelid) => {
            if(!models[modelid]) {
                // modelid has been removed. Remove it from the model and data ensembles
                if(model_ensembles[modelid]) {
                    let data_ensembles = { ...model_ensembles[modelid] };
                    Object.keys(data_ensembles).map((inputid) => {
                        let datasets = data_ensembles[inputid].slice();
                        datasets.map((dsid) => {
                            this.pathway = removeDatasetFromPathway(this.pathway, dsid, modelid, inputid);
                        })
                    })
                    delete model_ensembles[modelid];
                }
                if(executable_ensemble_summary[modelid]) {
                    // Delete ensemble ids
                    deleteAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);
                    // Remove executable summary
                    delete executable_ensemble_summary[modelid];
                }
            }
        });

        Object.keys(models || {}).map((modelid) => {
            if(!model_ensembles[modelid]) {
                model_ensembles[modelid] = {};
            }
        });


        this.pathway = {
            ...this.pathway,
            models: models,
            model_ensembles: model_ensembles
        }

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        this.pathway.notes = {
            ...this.pathway.notes!,
            models: notes
        };
        this.pathway.last_update = {
            ...this.pathway.last_update!,
            models: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };        

        updatePathway(this.scenario, this.pathway); 
        
        this._editMode = false;
        showNotification("saveNotification", this.shadowRoot!);
    }

    _removePathwayModel(modelid:string) {
        let model = this.pathway.models![modelid];
        if(model) {
            if(confirm("Are you sure you want to remove this model ?")) {
                let models:ModelMap = this.pathway.models || {};
                let model_ensembles:ModelEnsembleMap = this.pathway.model_ensembles || {};
                delete models[modelid];
                if(model_ensembles[modelid]) {
                    let data_ensembles = { ...model_ensembles[modelid] };
                    Object.keys(data_ensembles).map((inputid) => {
                        let datasets = data_ensembles[inputid].slice();
                        datasets.map((dsid) => {
                            this.pathway = removeDatasetFromPathway(this.pathway, dsid, modelid, inputid);
                        })
                    })
                    delete model_ensembles[modelid];
                }
                this.pathway = {
                    ...this.pathway,
                    models: models,
                    model_ensembles: model_ensembles
                }
                updatePathway(this.scenario, this.pathway);                   
            }
        }
    }

    _queryModelCatalog() {
        // Only query for models if we don't already have them
        // Unless we're in edit mode
        if(!this.pathway.models || Object.keys(this.pathway.models).length == 0 || this._editMode) {
            if(this._responseVariables && this._responseVariables.length > 0) {
                //console.log("Querying model catalog for " + this._responseVariables);
                this._dispatched = true;
                store.dispatch(queryModelsByVariables(this._responseVariables, this._drivingVariables));
            }
        }       
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);
        //let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        
        this._subregion = getUISelectedSubgoalRegion(state);

        if(this.pathway && 
                this.pathway.response_variables != this._responseVariables && 
                this.pathway.driving_variables != this._drivingVariables && 
                !this._dispatched) {
            this._responseVariables = this.pathway.response_variables;
            this._drivingVariables = this.pathway.driving_variables;
            this._queryModelCatalog();
            this._setEditMode(false);
        }

        if(state.models && !state.models.loading && this._dispatched) {
            this._queriedModels = state.models!.models;
            this._dispatched = false;
        }
    }
}
