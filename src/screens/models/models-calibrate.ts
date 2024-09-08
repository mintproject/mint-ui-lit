import { html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { goToPage } from "../../app/actions";

@customElement("models-calibrate")
export class ModelsCalibrate extends connect(store)(PageViewElement) {
  static get styles() {
    return [
      css`
        .cltrow wl-button {
          padding: 2px;
        }
      `,
      SharedStyles,
    ];
  }

  protected render() {
    return html`
      <p>
        This page is in progress, it will allow you to calibrate models from the
        Model Catalog for a particular area or region
      </p>
    `;
  }
}
