import { html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";

@customElement("analysis-visualize")
export class AnalysisVisualize extends connect(store)(PageViewElement) {
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
        This page is in progress, it will give you the ability to visualize
        results from model runs
      </p>
    `;
  }
}
