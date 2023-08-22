import { ModelCatalogResource } from "./resource";
import {
  TimeInterval,
  TimeIntervalFromJSON,
} from "@mintproject/modelcatalog_client";
import { html, customElement, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";
import { ModelCatalogUnit } from "./unit";

import { Textfield } from "weightless/textfield";
import { Textarea } from "weightless/textarea";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

@customElement("model-catalog-time-interval")
export class ModelCatalogTimeInterval extends connect(store)(
  ModelCatalogResource
)<TimeInterval> {
  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      this.getBasicStyles(),
      css`
        .two-inputs > wl-textfield,
        .two-inputs > wl-select,
        .two-inputs > span {
          display: inline-block;
          width: 50%;
        }
        #input-unit {
          --list-height: 140px;
          --dialog-height: 100%;
        }
      `,
    ];
  }

  protected classes: string = "resource time-interval";
  protected name: string = "time interval";
  protected pname: string = "time intervals";

  protected resourceApi: DefaultReduxApi<TimeInterval, BaseAPI> =
    ModelCatalogApi.myCatalog.timeInterval;

  private _inputUnit: ModelCatalogUnit;

  constructor() {
    super();
    this._inputUnit = new ModelCatalogUnit();
    this._inputUnit.setActionSelect();
    this._inputUnit.setAttribute("id", "input-unit");
  }

  protected _createResource() {
    this._inputUnit.setResources(null);
    super._createResource();
  }

  protected _editResource(r: TimeInterval) {
    super._editResource(r);
    this._inputUnit.setResources(r.intervalUnit);
  }

  protected _renderResource(r: TimeInterval) {
    return html`
      <span
        style="line-height: 20px; display: flex; justify-content: space-between;"
      >
        <span style="margin-right: 30px; text-decoration: underline;">
          ${getLabel(r)}
        </span>
        <span class="monospaced">
          ${r.intervalValue}
          ${r.intervalUnit ? getLabel(r.intervalUnit[0]) : ""}
        </span>
      </span>
      <span style="line-height: 20px; font-style: oblique; color: gray;">
        ${r.description}
      </span>
    `;
  }

  protected _renderForm() {
    let edResource = this._getEditingResource();
    return html` <div style="height:40px"></div>
      <form>
        <wl-textfield
          id="time-interval-label"
          label="Name"
          required
          value=${edResource ? getLabel(edResource) : ""}
        >
        </wl-textfield>
        <wl-textarea
          id="time-interval-desc"
          label="Description"
          required
          value=${edResource && edResource.description
            ? edResource.description[0]
            : ""}
        >
        </wl-textarea>
        <div class="two-inputs">
          <wl-textfield
            id="time-interval-value"
            label="Interval value"
            value="${edResource && edResource.intervalValue
              ? edResource.intervalValue[0]
              : ""}"
          >
          </wl-textfield>
          <span>
            <span style="font-size: 0.75rem;color: rgb(86, 90, 93);"
              >Unit:</span
            >
            ${this._inputUnit}
          </span>
        </div>
      </form>`;
  }

  protected _getResourceFromForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "time-interval-label"
    ) as Textfield;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "time-interval-desc"
    ) as Textarea;
    let inputValue: Textfield = this.shadowRoot.getElementById(
      "time-interval-value"
    ) as Textfield;
    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";
    let value: string = inputValue ? inputValue.value : "";
    if (label && desc) {
      let jsonRes = {
        type: ["TimeInterval"],
        label: [label],
        description: [desc],
        intervalUnit: this._inputUnit.getResources(),
      };
      if (value) jsonRes["intervalValue"] = [value];
      return TimeIntervalFromJSON(jsonRes);
    } else {
      // Show errors
      if (!label) (<any>inputLabel).onBlur();
      if (!desc) (<any>inputDesc).onBlur();
    }
  }
}
