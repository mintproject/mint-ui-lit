import {
  customElement,
  html,
  css,
  TemplateResult,
  property,
} from "lit-element";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/expansion";
import "weightless/icon";
import "weightless/button";

import { ThreadExpansion } from "./thread-expansion";
import { Thread } from "../reducers";
import { ModelSelector } from "components/model-selector";
import { Region as LocalRegion, RegionMap } from "screens/regions/reducers";
import {
  Model,
  ModelConfiguration,
  ModelConfigurationSetup,
  SoftwareImage,
  SoftwareVersion,
} from "@mintproject/modelcatalog_client";
import { setupToOldModel } from "screens/models/actions";
import { IdMap } from "app/reducers";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";
import { cacheModelsFromCatalog, setThreadModels } from "../actions";

type StatusType = "warning" | "done" | "error";

@customElement("thread-expansion-models")
export class ThreadExpansionModels extends ThreadExpansion {
  protected _name: string = "Select models";
  protected _description: TemplateResult = html`Search for a model to run.`;
  private modelSelector: ModelSelector;
  @property({ type: Object }) private filterRegion: LocalRegion;
  @property({ type: String }) private filterRegionId: string;
  @property({ type: Number }) private nModels: number;
  private allRegions: RegionMap;
  // I dont think this is necesary but is faster
  private allSoftwareImages: IdMap<SoftwareImage>;
  private allModels: IdMap<Model>;
  private allVersions: IdMap<SoftwareVersion>;
  private allConfigs: IdMap<ModelConfiguration>;

  static get styles() {
    return [SharedStyles, this.generalStyles, css``];
  }

  constructor() {
    super();
    this.modelSelector = new ModelSelector();
    const updateFunc: (n: number) => void = (n: number) => (this.nModels = n);
    this.modelSelector.onModelCountUpdate = updateFunc;

    this.addEventListener("model-selector-request-edit", (e: Event) => {
      this.onEditEnable();
    });
  }

  protected firstUpdated(): void {
    this.loading = true;
    let req1 = store.dispatch(ModelCatalogApi.myCatalog.softwareImage.getAll());
    let req2 = store.dispatch(ModelCatalogApi.myCatalog.model.getAll());
    let req3 = store.dispatch(
      ModelCatalogApi.myCatalog.softwareVersion.getAll()
    );
    let req4 = store.dispatch(
      ModelCatalogApi.myCatalog.modelConfiguration.getAll()
    );
    req1.then((all) => (this.allSoftwareImages = all));
    req2.then((all) => (this.allModels = all));
    req3.then((all) => (this.allVersions = all));
    req4.then((all) => (this.allConfigs = all));

    Promise.all([req1, req2, req3, req4]).then(() => (this.loading = false));
  }

  public addModels = (ids: string[]) => {
    this.open = true;
    this.modelSelector.addSelected(new Set(ids));
    //this.requestUpdate();
    this.save();
  };

  protected getStatusInfo(): string {
    if (this.open) return "Select one or more models to run";
    return "Open to see selected models";
  }

  public getStatus(): StatusType {
    if (
      !this.thread ||
      (!this.thread.regionid &&
        this.thread.driving_variables.length === 0 &&
        this.thread.response_variables.length === 0)
    )
      return "error";
    if (this.nModels === 0) return "error";
    if (this.thread.models && Object.keys(this.thread.models).length > 0)
      return "done";
    return "warning";
  }

  protected renderView(): TemplateResult {
    let thread: Thread = this.thread;
    return html`${this.modelSelector}`;
  }

  protected renderEditForm(): TemplateResult {
    let thread: Thread = this.thread;
    return html`${this.modelSelector}`;
  }

  protected onEditEnable(): void {
    super.onEditEnable();
    this.modelSelector.setEditable();
  }

  protected onCancelClicked(): void {
    super.onCancelClicked();
    this.modelSelector.cancel();
  }

  protected onSaveClicked(): void {
    this.loading = true;
    let req = this.save();
    req.then(() => {
      this.modelSelector.save();
      this.editMode = false;
      this.loading = false;

      let event: CustomEvent = new CustomEvent("thread-models-updated", {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });
    req.catch(() => {
      this.onCancelClicked();
      this.loading = false;
    });

    //super.onSaveClicked();
  }

  async save() {
    let models = [];
    let selectedModels: ModelConfigurationSetup[] =
      this.modelSelector.getSelectedModels();
    selectedModels.forEach((s: ModelConfigurationSetup) => {
      models.push(setupToOldModel(s, this.allSoftwareImages));
    });

    // Cache models from Catalog FIXME
    await cacheModelsFromCatalog(
      models,
      this.allSoftwareImages,
      this.allConfigs,
      this.allVersions,
      this.allModels
    );

    //let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
    let notes = "";

    await setThreadModels(models, notes, this.thread);
  }

  protected onThreadChange(thread: Thread): void {
    if (thread && thread.models && Object.keys(thread.models).length > 0) {
      this.modelSelector.setSelected(new Set(Object.keys(thread.models)));
    } else {
      this.onEditEnable();
      this.open = true;
    }
    if (thread && thread.regionid) {
      this.filterRegionId = thread.regionid;
      if (this.allRegions && this.allRegions[this.filterRegionId]) {
        this.filterRegion = this.allRegions[this.filterRegionId];
        this.modelSelector.setRegion(this.filterRegion);
      }
    } else {
      this.filterRegion = null;
      this.filterRegionId = null;
      this.modelSelector.setRegion(null);
    }

    if (
      thread &&
      thread.response_variables &&
      thread.response_variables.length > 0
    ) {
      this.modelSelector.setIndicator(thread.response_variables[0]);
    } else {
      this.modelSelector.setIndicator(null);
    }
  }

  stateChanged(state: RootState) {
    super.stateChanged(state);

    if (state.ui && state.regions) {
      this.allRegions = state.regions.regions;
      if (this.filterRegionId && !this.filterRegion) {
        this.onThreadChange(this.thread);
      }
    }
  }
}
