import {
  customElement,
  html,
  css,
  TemplateResult,
  property,
} from "lit-element";
import { RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/expansion";
import "weightless/icon";
import "weightless/button";

import "components/data-catalog-id-checker";

import { ThreadExpansion } from "./thread-expansion";
import {
  DataMap,
  DateRange,
  ModelEnsembleMap,
  ModelIOBindings,
  Thread,
} from "../reducers";
import { Model as LocalModel, ModelIO } from "screens/models/reducers";
import { DatasetSelector } from "components/dataset-selector";
import { hideDialog, showDialog } from "util/ui_functions";
import { DataResource, Dataset, Dataslice } from "screens/datasets/reducers";
import { DataCatalogAdapter, DatasetQuery } from "util/data-catalog-adapter";
import { Region as LocalRegion, RegionMap } from "screens/regions/reducers";
import { uuidv4 } from "util/helpers";
import { IdMap } from "app/reducers";
import { DatasetResourceSelector } from "components/dataset-resource-selector";
import {
  setThreadData,
  selectThreadDataResources,
  getThreadDataResources,
} from "../actions";
import { getThreadDatasetsStatus, TASK_DONE } from "util/state_functions";
import {
  DatasetCompatibleModel,
  ModelOutputMatch,
} from "components/dataset-compatible-model";
import { ModelConfigurationSetup } from "@mintproject/modelcatalog_client";
import { getLabel } from "model-catalog-api/util";
import { PREFIX_URI } from "config/default-graph";

type StatusType = "warning" | "done" | "error";

@customElement("thread-expansion-datasets")
export class ThreadExpansionDatasets extends ThreadExpansion {
  protected _name: string = "Select datasets";
  protected _description: TemplateResult = html`Search datasets to use on your
    executions. Click on
    <wl-icon style="font-size: 13px; margin: 0px 4px;">edit</wl-icon> to edit
    the selection.`;
  @property({ type: Object }) datasetSelector: DatasetSelector;
  @property({ type: Object }) datasetModelSelector: DatasetCompatibleModel;
  @property({ type: Object }) selectedInput: ModelIO;
  @property({ type: Object }) localRegions: RegionMap;
  @property({ type: Object }) modelVisible: IdMap<boolean> = {};
  private modifiedInputs: IdMap<Dataslice[]> = {};
  private resourceSelectors: IdMap<DatasetResourceSelector> = {};
  private modelIds: string[] = [];

  static get styles() {
    return [
      SharedStyles,
      this.generalStyles,
      css`
        .model_title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 10px;
        }
        .model_status {
          display: flex;
          align-items: center;
        }
        .model_status > * {
          padding: 0px 5px;
        }
        .tooltip {
          cursor: help;
          display: inline-block;
          position: relative;
        }

        .tooltip:hover:after {
          background: #333;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 5px;
          bottom: 26px;
          color: #fff;
          content: attr(tip);
          right: 20%;
          padding: 5px 15px;
          position: absolute;
          z-index: 98;
          width: fit-content;
          white-space: nowrap;
        }

        .tooltip:hover:before {
          border: solid;
          border-color: #333 transparent;
          border-width: 6px 6px 0 6px;
          bottom: 20px;
          content: "";
          right: 42%;
          position: absolute;
          z-index: 99;
        }
        .datasetlist {
          margin: 0;
          padding-left: 20px;
        }
        .clickable {
          cursor: pointer;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dataset_button {
          padding: 2px 3px 2px 6px;
          border-radius: 3px;
          --button-bg: #f1951b;
          --button-bg-hover: #ffa52b;
          --button-bg-active: #f1951b;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.datasetSelector = new DatasetSelector();
    this.datasetModelSelector = new DatasetCompatibleModel();
  }

  protected getStatusInfo(): string {
    if (this.open) return "Select datasets for your models";
    return "Open to see selected data";
  }

  public getStatus(): StatusType {
    if (
      !this.thread ||
      !this.thread.models ||
      Object.keys(this.thread.models).length === 0
    )
      return "error";
    let done: boolean = true;
    Object.values(this.thread.models).forEach((m: LocalModel) => {
      (m.input_files || []).forEach((input: ModelIO) => {
        if (!input.value) {
          let allBindings: ModelIOBindings =
            this.thread.model_ensembles![m.id].bindings || {};
          let datasetIds: string[] = allBindings[input.id]
            ? allBindings[input.id]
            : [];
          let values = datasetIds.map(
            (bid: string) => this.thread.data[bid]?.dataset?.id
          );
          if (values.length == 0) done = false;
        }
      });
    });
    if (done) return "done";
    return "warning";
  }

  protected renderView(): TemplateResult {
    let thread: Thread = this.thread;
    if (!thread.models || Object.keys(thread.models).length === 0)
      return html`You must select at least a model first.`;
    return html`
      <div>
        ${Object.values(thread.models).map(this.renderModelDatasets.bind(this))}
      </div>
    `;
  }

  private toggleModelVisibility(modelid: string): void {
    this.modelVisible[modelid] = !this.modelVisible[modelid];
    this.requestUpdate();
  }

  private renderModelDatasets(model: LocalModel): TemplateResult {
    let fixedInputs: ModelIO[] = model.input_files.filter(
      (input: ModelIO) => input.value && input.value.resources
    );
    let reqInputs: ModelIO[] = model.input_files.filter(
      (input: ModelIO) =>
        !input.value ||
        !input.value.resources ||
        input.value.resources.length === 0
    );

    // Check status
    let modelBindings: ModelIOBindings =
      this.thread.model_ensembles![model.id].bindings || {};
    let modelDone: boolean =
      model.input_files.length == 0 ||
      (fixedInputs.length > 0 &&
        reqInputs.every(
          (input: ModelIO) =>
            (this.modifiedInputs[input.id] &&
              this.modifiedInputs[input.id].length > 0) ||
            (modelBindings[input.id] || []).map(
              (id: string) => this.thread.data![id]
            ).length > 0
        ));

    return html` <div style="border: 1px solid #EEE; margin: 10px 0px;">
      <div class="model_title">
        <div class="model_status">
          ${modelDone
            ? html` <wl-icon style="color: 'green'">done</wl-icon> `
            : html` <wl-icon style="color: 'orange'">warning</wl-icon> `}
          <span style="color: #aaa;">MODEL:</span>
          <a href="#">${model.name}</a
          ><!-- FIXME: url -->
        </div>
        <wl-icon
          class="clickable"
          @click=${() => this.toggleModelVisibility(model.id)}
        >
          ${this.modelVisible[model.id] ? "visibility" : "visibility_off"}
        </wl-icon>
      </div>

      <!-- Table with inputs -->
      <table
        class="pure-table pure-table-striped"
        style="visibility: ${this.modelVisible[model.id]
          ? "visible"
          : "collapse"}"
      >
        <thead>
          <tr>
            <th><b>Input name</b></th>
            <th><b>Selected dataset</b></th>
          </tr>
        </thead>
        <tbody>
          ${fixedInputs.length + reqInputs.length === 0
            ? html` <tr>
                <td colspan="2" style="text-align:center;">
                  This model does not require any input
                </td>
              </tr>`
            : html`
                ${reqInputs.map((io: ModelIO) =>
                  this.renderRequiredDatasetRow(model, io)
                )}
                ${fixedInputs.length > 0
                  ? html`
                      <tr>
                        <td
                          colspan="2"
                          style="font-weight:bold; padding-left:35px;"
                        >
                          The following inputs were pre-selected and cannot be
                          changed:
                        </td>
                      </tr>
                      ${fixedInputs.map((io: ModelIO) =>
                        this.renderFixedDatasetRow(model, io)
                      )}
                    `
                  : ""}
              `}
        </tbody>
      </table>
    </div>`;
  }

  private renderFixedDatasetRow(
    model: LocalModel,
    input: ModelIO
  ): TemplateResult {
    if (!input.value || !input.value.resources) return html``;
    return html` <tr>
      <td>
        <div style="display:flex; align-items:center;">
          <wl-icon style="color: 'green'; margin-right: 5px;">done</wl-icon>
          ${input.name}
        </div>
      </td>
      <td>
        <div
          style="display:flex; align-items:center; justify-content: space-between;"
        >
          <ul class="datasetlist">
            ${input.value.resources.map(
              (r) =>
                html`<li><a target="_blank" href="${r.url}">${r.name}</a></li>`
            )}
          </ul>
          <span
            tip="This input was pre-selected. Cannot be changed"
            class="tooltip"
            ><wl-icon>lock</wl-icon></span
          >
        </div>
      </td>
    </tr>`;
  }

  private renderRequiredDatasetRow(
    model: LocalModel,
    input: ModelIO
  ): TemplateResult {
    let dataslices: Dataslice[] = this.modifiedInputs[input.id];
    return html`
      <tr>
        <td>
          <div style="display:flex; align-items:center;">
            ${dataslices && dataslices.length > 0
              ? html`
                  <wl-icon style="color: 'green'; margin-right: 5px;"
                    >done</wl-icon
                  >
                `
              : html`
                  <wl-icon style="color: 'orange'; margin-right: 5px;"
                    >warning</wl-icon
                  >
                `}
            ${input.name}
          </div>
        </td>
        <td>
          <div class="flex-between">
            <ul class="datasetlist">
              ${!dataslices
                ? html`<loading-dots style="--width: 25px;"></loading-dots>`
                : dataslices.length == 0
                ? "None selected"
                : dataslices.map((dataslice: Dataslice) => {
                    if (!dataslice) return;
                    let num_selected_resources =
                      dataslice.selected_resources ?? 0;
                    let num_total_resources = dataslice.total_resources ?? 0;
                    return html`<li>
                      <div class="flex-between">
                        <span>
                          <a
                            target="_blank"
                            href="${this._regionid}/datasets/browse/${dataslice
                              .dataset.id}/${this.thread.regionid}"
                            >${dataslice.dataset.name}</a
                          >
                          ${num_total_resources > 1
                            ? html`
                                <br />
                                ( ${num_selected_resources} /
                                ${num_total_resources} files )
                              `
                            : ""}
                        </span>
                        <span style="margin-left:10px;">
                          ${dataslice.dataset.id.startsWith(PREFIX_URI)
                            ? html`<wl-icon
                                style="color: 'darkgrey'; margin-right: 5px;"
                                >schedule</wl-icon
                              >`
                            : this.resourceSelectors[dataslice.dataset.id]
                            ? this.resourceSelectors[dataslice.dataset.id]
                            : html`<loading-dots
                                style="--width: 25px;"
                              ></loading-dots>`}
                        </span>
                      </div>
                    </li>`;
                  })}
            </ul>

            ${this.editMode
              ? html` <wl-button
                  class="clickable dataset_button"
                  @click=${() => this.editInput(model, input)}
                >
                  Select
                  <wl-icon style="margin-left:6px;">edit</wl-icon>
                </wl-button>`
              : html`<wl-icon>person</wl-icon>`}
          </div>
        </td>
      </tr>
    `;
  }

  private renderDatasetSelectionDialog(): TemplateResult {
    return html`
      <wl-dialog
        id="datasetSelectionDialog"
        fixed
        backdrop
        blockscrolling
        size="large"
        persistent
      >
        <h3 slot="header">
          Selecting dataset for
          ${this.selectedInput ? this.selectedInput.name : "?"}
        </h3>
        <div slot="content" style="overflow-y:scroll;padding-right:8px;">
          ${this.datasetSelector}
          ${(this.selectedInput?.variables || []).length > 0
            ? this.datasetModelSelector
            : null}
        </div>
        <div slot="content" style="padding-right:8px;">
          ${this.selectedInput?.variables &&
          this.selectedInput?.variables.length > 0
            ? html`
                  <h4>Variables</h4>
                  <p>
                    The dataset has the following variables:
                  </p>
                  <ul>
                   ${this.selectedInput?.variables.map(
                     (v) => html`<li>${v}</li>`
                   )}
                  </ul>
                </div>
              `
            : null}
        </div>
        <div slot="footer" style="padding-top:0px;">
          <wl-button
            flat
            inverted
            style="margin-right:5px;"
            @click=${this.onDatasetDialogCancel}
            >Cancel</wl-button
          >
          <wl-button class="submit" @click=${this.onDatasetDialogSave}
            >Save</wl-button
          >
        </div>
      </wl-dialog>
    `;
  }

  private onDatasetDialogSave(): void {
    let dates = this.thread.dates;
    let region = this.localRegions[this.thread.regionid];
    let datasets: Dataset[] = this.datasetSelector.getSelectedDatasets();
    let models: ModelOutputMatch[] =
      this.datasetModelSelector.getSelectedModels();
    let inputid: string = this.selectedInput.id;
    this.isSaved = false;
    this.modifiedInputs[inputid] = undefined;

    // Add selected models as dataslices.
    console.log("models:", models);
    if (models.length > 0) {
      if (this.modifiedInputs[inputid]) {
        let newDataslices = models.map(this.modelOutputToDataslice);
        this.modifiedInputs[inputid] = [
          ...this.modifiedInputs[inputid],
          ...newDataslices,
        ];
      } else {
        this.modifiedInputs[inputid] = models.map(this.modelOutputToDataslice);
      }
      console.log(this.modifiedInputs);
      this.requestUpdate();
    }

    // Load dataset details.
    let loadingDataslices: Dataslice[] = [];
    let reqs: Promise<Dataslice>[] = datasets.map((d: Dataset) => {
      let req = this.loadResourcesForDataset(d, region, dates);
      req.then((slice: Dataslice) => {
        loadingDataslices.push(slice);
        this.resourceSelectors[slice.dataset.id] = new DatasetResourceSelector(
          slice.dataset,
          slice.resources,
          region
        );
      });
      return req;
    });
    Promise.all(reqs).then(() => {
      if (this.modifiedInputs[inputid]) {
        this.modifiedInputs[inputid] = [
          ...this.modifiedInputs[inputid],
          ...loadingDataslices,
        ];
      } else {
        this.modifiedInputs[inputid] = loadingDataslices;
      }
      this.requestUpdate();
    });

    this.onDatasetDialogCancel();
  }

  private modelOutputToDataslice: (modelOutput: ModelOutputMatch) => Dataslice =
    (r) => {
      return {
        id: r.model.id, //Not sure if should be this or the datasetspec id.
        name: getLabel(r.model),
        dataset: {
          id: r.model.id,
          name: getLabel(r.model),
          region: this.thread.regionid,
          variables: [], //FIXME: get from variable.
          datatype: "", //FIXME
          time_period: this.thread.dates
            ? this.thread.dates
            : {
                start_date: new Date(),
                end_date: new Date(),
              },
          description: "",
          version: "",
          limitations: "",
          source: {
            // TODO: this should come from the model.
            name: "",
            url: "",
            type: "",
          },
          //categories?: string[],
          //is_cached?: boolean,
          //resource_repr?: any,
          //dataset_repr?: any,
          resources: r.model.hasOutput.map((out) => ({
            url: out.id,
            name: getLabel(out),
            selected: r.outputMatchs.some((m) => m.id === out.id),
          })),
          //resources_loaded?: boolean,
          resource_count: r.model.hasOutput.length,
          //spatial_coverage?: any,
        },
        total_resources: r.model.hasOutput.length,
        selected_resources: r.outputMatchs.length,
        resources: r.outputMatchs.map((out) => ({
          url: out.id,
          name: getLabel(out),
          selected: true,
          time_period: this.thread.dates
            ? this.thread.dates
            : {
                start_date: new Date(),
                end_date: new Date(),
              },
        })),
        //resources_loaded?: true,
        time_period: this.thread.dates
          ? this.thread.dates
          : {
              start_date: new Date(),
              end_date: new Date(),
            },
        //spatial_coverage?: any
      };
    };

  private onDatasetDialogCancel(): void {
    hideDialog("datasetSelectionDialog", this.shadowRoot!);
    this.selectedInput = null;
  }

  private editInput(model: LocalModel, input: ModelIO) {
    let dates = this.thread.dates;
    let region = this.localRegions[this.thread.regionid];
    this.selectedInput = input;
    this.datasetSelector.unload();
    this.datasetModelSelector.setInput(input);

    let req: Promise<Dataset[]> = this.queryDatasets(input, region, dates);
    req.then((datasets: Dataset[]) => {
      // Sort results depending of type.
      if (input.type) {
        let inputtype = input.type.replace(/.*#/, "");
        datasets = datasets.sort((d1: Dataset, d2: Dataset) => {
          return d1.datatype === d2.datatype
            ? 0
            : d1.datatype === inputtype
            ? -1
            : d2.datatype === inputtype
            ? 1
            : !!d1.datatype && !d2.datatype
            ? -1
            : !!d2.datatype && !d1.datatype
            ? 1
            : 0;
        });
      }
      this.datasetSelector.setDatasets(datasets, region, dates);
    });

    let allBindings: ModelIOBindings =
      this.thread.model_ensembles![model.id].bindings || {};
    let bindings: string[] = allBindings[input.id] ? allBindings[input.id] : [];
    let datasetIds = (bindings || []).map(
      (bid) => this.thread.data[bid]?.dataset?.id
    );

    if (this.modifiedInputs[input.id]) {
      let mDatasets: string[] = this.modifiedInputs[input.id].map(
        (sl: Dataslice) => sl.dataset.id
      );
      this.datasetSelector.setSelected(new Set<string>(mDatasets));
    } else if (datasetIds.length > 0) {
      this.datasetSelector.setSelected(new Set<string>(datasetIds));
    }
    showDialog("datasetSelectionDialog", this.shadowRoot!);
  }

  protected renderEditForm(): TemplateResult {
    return html` ${this.renderView()} ${this.renderDatasetSelectionDialog()} `;
  }

  protected onEditEnable(): void {
    super.onEditEnable();
  }

  protected onCancelClicked(): void {
    this.selectedInput = null;
    this.modifiedInputs = {};
    this.onThreadChange(this.thread);
    super.onCancelClicked();
  }

  protected onSaveClicked(): void {
    //super.onSaveClicked();
    this.loading = true;
    let req = this.save();
    req.then((x) => {
      this.loading = false;
      this.editMode = false;
      this.isSaved = true;
      if (this.modelIds.length > 0) {
        let event: CustomEvent = new CustomEvent(
          "thread-add-model-as-dataslice",
          {
            bubbles: true,
            composed: true,
            detail: [...this.modelIds],
          }
        );
        this.dispatchEvent(event);
        this.modelIds = [];
      }
    });
  }

  public saveAll(): Promise<any> {
    this.loading = true;
    let req = this.save();
    req.then((x) => {
      this.loading = false;
      this.editMode = false;
      this.isSaved = true;
      if (this.modelIds.length > 0) {
        let event: CustomEvent = new CustomEvent(
          "thread-add-model-as-dataslice",
          {
            bubbles: true,
            composed: true,
            detail: [...this.modelIds],
          }
        );
        this.dispatchEvent(event);
        this.modelIds = [];
      }
    });
    return req;
  }

  private save(): Promise<any> {
    let data: DataMap = {};
    let model_ensembles: ModelEnsembleMap = this.thread.model_ensembles || {};
    let allOk = true;

    Object.keys(this.thread.models!).map((modelid) => {
      let model = this.thread.models![modelid];
      model.input_files
        .filter((input) => !input.value)
        .map((input: ModelIO) => {
          // Check if we already have bindings for this
          //let current_data_ensemble: string[] = (this.thread.model_ensembles![modelid] || {})[input.id];
          let newdata: Dataslice[] = this.modifiedInputs[input.id];
          if (!model_ensembles[modelid])
            model_ensembles[modelid] = { id: uuidv4(), bindings: {} };
          console.log(
            input.name,
            "new data:",
            newdata,
            model_ensembles[modelid]
          );
          if (newdata && newdata.length > 0) {
            model_ensembles[modelid].bindings[input.id] = [];
            newdata.map((slice: Dataslice) => {
              let dataid = slice.id;
              if (dataid.startsWith(PREFIX_URI)) {
                // Is a model, change the ids and add to the list.
                this.modelIds.push(dataid);
                dataid = uuidv4();
                slice.id = dataid;
              }
              model_ensembles[modelid].bindings[input.id].push(dataid);
              data[dataid] = slice;
            });
          } else {
            //----
            allOk = false;
            console.log(" - Nothing added - ");
          }
        });
    });

    let notes = ""; //(this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
    console.log(model_ensembles);
    console.log(data);
    return setThreadData(data, model_ensembles, notes, this.thread);
  }

  protected onThreadChange(thread: Thread): void {
    let reqEdit: boolean = false;
    if (this.localRegions && thread && thread.models) {
      Object.values(thread.models).forEach((m: LocalModel) => {
        this.modelVisible[m.id] = true;
        let bindings: ModelIOBindings =
          this.thread.model_ensembles![m.id].bindings || {};
        let reqInputs: ModelIO[] = (m.input_files || []).filter(
          (i) => !i.value
        );
        reqInputs.forEach((input: ModelIO) => {
          this.loadInput(input, bindings);
          let dataslices: Dataslice[] = (bindings[input.id] || [])
            .map((bid: string) => this.thread.data![bid])
            .filter((x) => !!x);
          if (dataslices.length === 0) {
            // We need to add a dataset before next steps
            reqEdit = true;
          }
        });
      });
    }
    if (thread) {
      this.isSaved = getThreadDatasetsStatus(thread) === TASK_DONE;
      if (reqEdit || !this.isSaved) {
        this.onEditEnable();
        this.open = true;
      }
    }
  }

  private loadInput(input: ModelIO, bindings: ModelIOBindings): void {
    let dates = this.thread.dates;
    let region = this.localRegions[this.thread.regionid];
    if (!this.modifiedInputs[input.id]) {
      let dataslices: Dataslice[] = (bindings[input.id] || [])
        .map((bid: string) => this.thread.data![bid])
        .filter((x) => !!x);
      if (dataslices.length > 0) {
        //console.log("selected slices:", dataslices, region);
        //Load all resources for each dataset selected
        let resourceRequests: Promise<Dataslice>[] = [];
        let loadingDataslices: Dataslice[] = [];
        dataslices.forEach((slice: Dataslice) => {
          let req = this.loadResourcesForDataset(
            slice.dataset,
            region,
            dates,
            slice.id
          );
          req.then((resp: Dataslice) => {
            loadingDataslices.push(resp);
            this.resourceSelectors[slice.dataset.id] =
              new DatasetResourceSelector(
                slice.dataset,
                resp.resources,
                region
              );
          });
          resourceRequests.push(req);
        });

        Promise.all(resourceRequests).then((resources: Dataslice[]) => {
          this.modifiedInputs[input.id] = loadingDataslices;
          this.requestUpdate();
        });
      } else {
        // Theres no dataset, just create an empty array and pre-query possible datasets.
        this.modifiedInputs[input.id] = [];
        let req: Promise<Dataset[]> = this.queryDatasets(input, region, dates);
      }
    } else {
      // Load already made edits.
      let datasets: Dataset[] = this.modifiedInputs[input.id].map(
        (slice: Dataslice) => slice.dataset
      );
      let resourceRequests: Promise<Dataslice>[] = [];
      let loadingDataslices: Dataslice[] = [];
      datasets.forEach((dataset: Dataset) => {
        //Query resources for this dataset
        let req: Promise<Dataslice> = this.loadResourcesForDataset(
          dataset,
          region,
          dates
        );
        req.then((slice: Dataslice) => {
          loadingDataslices.push(slice);
          this.resourceSelectors[dataset.id] = new DatasetResourceSelector(
            dataset,
            slice.resources,
            region
          );
        });
        resourceRequests.push(req);
      });

      Promise.all(resourceRequests).then((resources: Dataslice[]) => {
        this.modifiedInputs[input.id] = loadingDataslices;
        this.requestUpdate();
      });
    }
  }

  private lastRegionId: string;
  stateChanged(state: RootState) {
    super.stateChanged(state);
    super.setRegionId(state);
    if (state.regions.regions && this.localRegions != state.regions.regions) {
      this.localRegions = state.regions.regions;
      if (
        this.thread &&
        this.thread.regionid &&
        this.lastRegionId != this.thread.regionid &&
        this.localRegions[this.thread.regionid]
      ) {
        this.onThreadChange(this.thread);
        this.lastRegionId = this.thread.regionid;
      }
    }
  }

  private loadResourcesForDataset(
    dataset: Dataset,
    region: LocalRegion,
    dates: DateRange,
    sliceid?: string
  ): Promise<Dataslice> {
    return new Promise<Dataslice>((resolve, reject) => {
      //A dataset can have one or more resources selected. First we query for resources
      let req: Promise<DataResource[]> = this.queryResources(
        dataset,
        region,
        dates
      );
      req.catch(reject);
      if (sliceid) {
        //If a slice id was provided, load selected resources from graphql
        let req2: Promise<Dataslice> = getThreadDataResources(sliceid);
        req2.catch(reject);
        Promise.all([req, req2]).then((arr: any) => {
          let savedResourcesMap: IdMap<DataResource> = {}; // Name -> resource
          let queriedResources: DataResource[] = arr[0];
          let savedDataslice: Dataslice = arr[1];
          savedDataslice.resources.forEach(
            (r: DataResource) => (savedResourcesMap[r.name] = r)
          );
          let resources: DataResource[] = queriedResources.map(
            (r: DataResource) => {
              r.selected = savedResourcesMap[r.name]
                ? savedResourcesMap[r.name].selected
                : false;
              return r;
            }
          );
          dataset.resource_count = resources.length;

          resolve({
            id: sliceid,
            total_resources: resources.length,
            selected_resources: resources.filter(
              (res: DataResource) => res.selected
            ).length,
            resources: resources,
            time_period: dates,
            name: dataset.name,
            dataset: dataset,
            resources_loaded: true,
          } as Dataslice);
        });
      } else {
        req.then((resources: DataResource[]) => {
          // Create a dataslice with all the resources.
          resolve({
            id: uuidv4(),
            total_resources: resources.length,
            selected_resources: resources.filter(
              (res: DataResource) => res.selected
            ).length,
            resources: resources,
            time_period: dates,
            name: dataset.name,
            dataset: dataset,
            resources_loaded: true,
          } as Dataslice);
        });
      }
    });
  }

  /* request to data-catalog */
  private resourceCache: IdMap<Promise<DataResource[]>> = {};
  private queryResources(
    dataset: Dataset,
    region: LocalRegion,
    dates: DateRange
  ): Promise<DataResource[]> {
    let cacheid: string =
      dataset.id +
      region.id +
      dates.start_date.getTime() +
      "-" +
      dates.end_date.getTime();
    if (!this.resourceCache[cacheid]) {
      this.addToLoadQueue(cacheid);
      this.resourceCache[cacheid] = DataCatalogAdapter.queryDatasetResources(
        dataset.id,
        region,
        dates
      );
      this.resourceCache[cacheid].finally(() =>
        this.removeFromLoadQueue(cacheid)
      );
    }
    return this.resourceCache[cacheid];
  }

  private datasetCache: IdMap<Promise<Dataset[]>> = {};
  private queryDatasets(
    input: ModelIO,
    region: LocalRegion,
    dates: DateRange
  ): Promise<Dataset[]> {
    let cacheid: string =
      input.id +
      region.id +
      dates.start_date.getTime() +
      "-" +
      dates.end_date.getTime();
    if (!this.datasetCache[cacheid])
      this.datasetCache[cacheid] = DataCatalogAdapter.findDatasetByVariableName(
        input.variables,
        region,
        dates
      );
    return this.datasetCache[cacheid];
  }

  //Do no allow edits while loading resources.
  private loadingResourceSet: Set<string> = new Set<string>();
  private addToLoadQueue(id: string): void {
    this.loadingResourceSet.add(id);
    this.loading = true;
  }
  private removeFromLoadQueue(id: string): void {
    if (this.loadingResourceSet.has(id)) {
      this.loadingResourceSet.delete(id);
      if (this.loadingResourceSet.size === 0) {
        this.loading = false;
      }
    }
  }
}
