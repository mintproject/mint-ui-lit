import { html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";

import "../../components/image-gallery";

@customElement("datasets-quality-workflows")
export class DatasetsQualityWorkflows extends connect(store)(PageViewElement) {
  static get styles() {
    return [
      css`
        .cltrow wl-button {
          padding: 2px;
        }
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
      `,
      SharedStyles,
    ];
  }

  protected render() {
    let items: Array<any>;
    if (this._regionid === "south_sudan") {
      items = [];
    } else if (this._regionid === "ethiopia") {
      items = [
        {
          label: "Ethiopia relief subbasins (94MB)",
          src: "images/thumbnails/Ethiopia_relief_subbasins_med.png",
          thumbnail: "images/thumbnails/Ethiopia_relief_subbasins_small.png",
          external:
            "http://mint.isi.edu/data/Ethiopia_relief_subbasins_big.png",
        },
        {
          label: "Blue Nile Tributaries relief and boundaries (76MB)",
          src: "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_med.png",
          thumbnail:
            "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_small.png",
          external:
            "http://mint.isi.edu/data/Blue_Nile_Tribs_relief_and_boundaries_big.png",
        },
        {
          label: "Ethiopia relief boundary",
          src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png",
        },
        {
          label: "Guder relief rivers boundary",
          src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png",
        },
        {
          label: "Jamma relief river boundary",
          src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png",
        },
        {
          label: "Muger relief rivers boundary",
          src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png",
        },
        {
          label: "Dashilo relief river boundary",
          src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png",
        },
      ];
    } else {
      items = [];
    }

    return html`
      <div class="content">
        <p>
          This page is in progress, it will allow you to run tools that improve
          the quality of datasets.
          ${this._regionid === "ethiopia"
            ? html`Below is an example of the results of a tool that improves
              the quality of elevation models for a small area of Ethiopia`
            : "No tools or datasets available for this region"}
        </p>
        <image-gallery
          style="--width: 300px; --height: 160px;"
          .items="${items}"
        ></image-gallery>
      </div>
    `;
  }

  stateChanged(state: RootState) {
    super.setRegionId(state);
  }
}
