import { ModelCatalogResource } from "./resource";
import { html, customElement } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";
import { Image, ImageFromJSON } from "@mintproject/modelcatalog_client";

import { Textfield } from "weightless/textfield";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

@customElement("model-catalog-image")
export class ModelCatalogImage extends connect(store)(
  ModelCatalogResource
)<Image> {
  protected classes: string = "resource image";
  protected name: string = "image";
  protected pname: string = "images";

  protected resourceApi: DefaultReduxApi<Image, BaseAPI> =
    ModelCatalogApi.myCatalog.image;

  public pageMax: number = 10;

  protected _renderForm() {
    let edResource = this._getEditingResource();
    return html` <form>
      <wl-textfield
        id="label"
        label="Name"
        required
        value=${edResource ? getLabel(edResource) : ""}
      >
      </wl-textfield>
      <wl-textfield
        id="desc"
        label="Description"
        value=${edResource && edResource.description
          ? edResource.description[0]
          : ""}
      >
      </wl-textfield>
      <wl-textfield
        id="value"
        label="URL to image"
        required
        value=${edResource && edResource.value ? edResource.value[0] : ""}
      >
      </wl-textfield>
    </form>`;
  }

  protected _getResourceFromForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "label"
    ) as Textfield;
    let inputValue: Textfield = this.shadowRoot.getElementById(
      "value"
    ) as Textfield;
    let inputDesc: Textfield = this.shadowRoot.getElementById(
      "desc"
    ) as Textfield;

    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let value: string = inputValue ? inputValue.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";

    if (label && value) {
      let jsonRes = {
        type: ["Image"],
        label: [label],
        value: [value],
        description: desc ? [desc] : [],
      };
      return ImageFromJSON(jsonRes);
    } else {
      // Show errors
      if (!label) (<any>inputLabel).onBlur();
      if (!value) (<any>inputValue).onBlur();
    }
  }
}
