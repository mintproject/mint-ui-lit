import { customElement, LitElement, property, html, css } from "lit-element";

import "weightless/button";
import "weightless/icon";
import { MINT_PREFERENCES } from "config";

const data_catalog_api_url = MINT_PREFERENCES.data_catalog_api;

@customElement("data-catalog-id-checker")
export class DataCatalogIdChecker extends LitElement {
  static get styles() {
    return [
      css`
        wl-icon {
          margin: 0px 5px;
          cursor: pointer;
        }
      `,
    ];
  }

  @property({ type: String }) public id: string = "";

  private loaded = {};
  public name = {};
  public description = {};

  protected render() {
    if (
      this.id &&
      this.id != "undefined" &&
      this.id.length > 3 &&
      !(this.id[0] == "F" && this.id[1] == "F" && this.id[2] == "F")
    ) {
      return this.loaded[this.id]
        ? html`
            <b>${this.name[this.id]}</b>
            <hr />
            <span>${this.description[this.id]}</span>
          `
        : html` <span class="monospaced" style="white-space: nowrap;">
              ${this.id}
            </span>
            <wl-icon @click="${this._load}">system_update_alt</wl-icon>`;
    } else return html``;
  }

  private _load() {
    let req = fetch(data_catalog_api_url + "/datasets/get_dataset_info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: this.id }),
    });
    req.then((response) => {
      response.json().then((obj) => {
        this.name[this.id] = obj.name;
        this.description[this.id] = obj.description;
        this.loaded[this.id] = true;
        console.log("RESPONSE", obj);
        this.requestUpdate();
      });
    });
  }
}
