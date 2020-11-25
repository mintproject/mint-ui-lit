import { customElement, css, html, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { Execution, Task, ModelIOBindings } from "../reducers";
import { getUISelectedTask } from "../../../util/state_functions";
import { MintThreadPage } from "./mint-thread-page";

import "../../../components/editable-note";
import { getLatestEventOfType } from "util/event_utils";

@customElement('mint-summary')
export class MintSummary extends connect(store)(MintThreadPage) {

    @property({type: Object})
    private _task!: Task;

    static get styles() {
        return [
          SharedStyles,
          css`
          h1, h2, h3 {
              margin: 4px;
          }

          #notes {
              border: 0px;
              resize: none;
          }
          `
        ]
    }

    ss (t) {
        console.log('>', t);
    }
    
    protected render() {
        if(!this.thread) {
            return html ``;
        }
        let txt = 'This is a text that should appear in the textbox, shoulnd be editable.'

        return html`
        <editable-note .text="${txt}" .save="${this.ss}"></editable-note>
        <br/>
        <h2>${this.problem_statement.name}</h2>
        <div class="clt">
            <ul>
                <li>
                    <h2>${this._task.name}</h3>
                    <ul>
                        <li>
                            Variables:
                            <ul>
                                <li>Response: 
                                    ${this.thread.response_variables.map((v)=>
                                        v + " (" + v + ")").join(", ")}
                                </li>
                                <li>Driving: 
                                    ${this.thread.driving_variables.map((v)=>
                                        v + " (" + v + ")").join(", ")}
                                </li>
                            </ul>
                            <i>Notes: ${getLatestEventOfType(["CREATE", "UPDATE"], this._task.events).notes}</i>
                        </li>
                        <li>
                            Models:
                            <ul>
                                ${Object.keys(this.thread.models!).map((modelid: string) => {
                                    let model = this.thread.models![modelid];
                                    return html`
                                    <li>${model.name}</li>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${getLatestEventOfType(["SELECT_MODELS"], this.thread.events)?.notes}</i>
                        </li>
                        <li>
                            Datasets:
                            <ul>
                                ${Object.keys(this.thread.model_ensembles!).map((modelid) => {
                                    let model_ensemble = this.thread.model_ensembles![modelid].bindings as ModelIOBindings;
                                    let model = this.thread.models![modelid];
                                    return html`
                                    Datasets for model : ${model.name}
                                    <ul>
                                        ${model.input_files.filter((input) => !input.value).map((io) => {
                                            let bindings = model_ensemble[io.id!];
                                            let blist = bindings.map((binding) => {
                                                let ds = this.thread.data![binding];
                                                return ds.name;
                                            }).join(", ");

                                            return html`
                                                <li>${io.name} = ${blist}</li>
                                            `;
                                        })}
                                    </ul>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${getLatestEventOfType(["SELECT_DATA"], this.thread.events)?.notes}</i>
                        </li>
                        <li>
                            Setup:
                            <ul>
                                ${Object.keys(this.thread.model_ensembles!).map((modelid) => {
                                    let model_ensemble = this.thread.model_ensembles![modelid].bindings as ModelIOBindings;
                                    let model = this.thread.models![modelid];
                                    return html`
                                    Adjustment Variables for model : ${model.name}
                                    <ul>
                                        ${model.input_parameters.filter((input) => !input.value).map((io) => {
                                            let bindings = model_ensemble[io.id!];
                                            let blist = bindings.join(", ");
                                            return html`
                                                <li>${io.name} = ${blist}</li>
                                            `;
                                        })}
                                    </ul>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${getLatestEventOfType(["SELECT_PARAMETERS"], this.thread.events)?.notes}</i>
                        </li>
                        <li>
                            Model Runs and Results:
                            <ul>
                                ${Object.keys(this.thread.execution_summary).map((modelid: string) => {
                                    let model = this.thread.models[modelid];
                                    let summary = this.thread.execution_summary[modelid];
                                    return html`
                                    <li>
                                        The model setup created ${summary.total_runs} configurations. 
                                        ${summary.submitted_runs} model runs were submitted, out of which 
                                        ${summary.successful_runs} succeeded, and ${summary.failed_runs} failed.
                                    </li>
                                    `
                                })}
                            </ul>
                            <i>Notes: ${getLatestEventOfType(["INGEST"], this.thread.events)?.notes}</i>
                        </li> 
                    </ul>
                </li>
            </ul>
        </div>
        `
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setThread(state);
        this._task = getUISelectedTask(state)!;
    }
}
