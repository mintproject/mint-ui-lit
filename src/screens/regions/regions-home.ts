import { html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import regions from "./reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "./regions-manual";
import "./regions-administrative";
import "./regions-agriculture";
import "./regions-hydrology";
import "../../styles/mint-icons";
import {
  cropsIcon,
  mountainRiverIcon,
  adminIcon,
} from "../../styles/mint-icons";
import "../../components/nav-title";

store.addReducers({
  regions,
});

@customElement("regions-home")
export class RegionsHome extends connect(store)(PageViewElement) {
  static get styles() {
    return [
      SharedStyles,
      css`
        .card {
          height: 100%;
          margin: 0px;
          padding: 0px;
        }

        regions-administrative,
        regions-hydrology,
        regions-agriculture {
          height: calc(100% - 40px);
        }

        .svgicon[disabled] > svg {
          fill: dimgray;
        }

        .two-columns {
          padding: 0 5em;
          display: grid;
          grid-auto-flow: row;
          grid-gap: 30px;
          grid-template-columns: 40% auto;
          max-width: 1200px;
          margin: auto;
        }

        .general-description {
          font-size: 1.15em;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-evenly;
        }

        .concept-grid-3 {
          display: grid;
          flex-direction: column;
          gap: 2rem;
        }

        .concept-grid-3 > .concept-card {
          padding: 16px 24px;
        }
      `,
    ];
  }

  protected render() {
    return html`
      <nav-title .ignore=${[]}></nav-title>
      <div class="${this._subpage != "home" ? "hiddensection" : "two-columns"}">
        <div class="general-description">
          <p>
            In this section, users can browse, manage, and organize a variety of geographical areas that serve as the foundation for registering datasets and configuring models within the system. Each dataset and model is directly linked to a specific area, which makes it possible to establish meaningful connections between available data and the corresponding geographical regions.
          </p>
          <p>
            The platform is designed to accommodate multiple levels of regional detail across each category. For example, administrative regions may include different levels such as states, provinces, districts, or municipalities, while other categories may feature regions defined by natural or land use boundaries. This flexible structure supports use cases that require both broad overviews and fine-grained local distinctions.
          </p>
          <p>
            Users have the ability to add new regions or entire subcategories at any time, using geojson files to define boundaries and attributes as needed. This ensures that the system can be tailored to evolving data requirements and organizational needs, supporting effective management and exploration of geographical information.
          </p>
        </div>
        <div class="concept-grid-3">
          <div class="concept-card">
            <h4>Agricultural Regions</h4>
            <p>
              Geographic areas characterized by distinct patterns of agricultural activity 
              due to climate, soil type, topography, economic factors, or cultural practices.
              These regions help us understand where and why certain types of crops
              and livestock are produced.
            </p>
            <a href="${this._regionid}/regions/agriculture">
              <wl-button>Explore Agricultural Regions</wl-button>
            </a>
          </div>

          <div class="concept-card">
            <h4>Hydrological Regions</h4>
            <p>
              Geographic areas defined based on drainage patterns, river basins, and water
              resources (such as rivers, lakes, and watersheds).
              These regions share characteristics related to how water flows,
              accumulates, and is distributed within them.
            </p>
            <a href="${this._regionid}/regions/hydrology">
              <wl-button>Explore Hydrological Regions</wl-button>
            </a>
          </div>

          <div class="concept-card">
            <h4>Administrative Regions</h4>
            <p>
              Geographic areas defined and governed by political or administrative boundaries
              set by a government or authority. These regions are created for the purposes of
              managing, organizing, and delivering governmental services, administration, and
              governance.
            </p>
            <a href="${this._regionid}/regions/administrative">
              <wl-button>Explore Administrative Regions</wl-button>
            </a>
          </div>
        </div>
      </div>

      <div class="hiddensection">
        <a href="${this._regionid}/regions/agriculture">
          <div class="svgicon">${cropsIcon}</div>
          <div>Agriculture</div>
        </a>
        <a href="${this._regionid}/regions/hydrology">
          <div class="svgicon">${mountainRiverIcon}</div>
          <div>Hydrology</div>
        </a>
        <a href="${this._regionid}/regions/administrative">
          <div class="svgicon">${adminIcon}</div>
          <div>Administrative</div>
        </a>
        <!--a href="{this._regionid}/regions/manual"-->
        <a disabled>
          <wl-icon>edit</wl-icon>
          <div>Manual Outline</div>
        </a>
      </div>

      <regions-manual
        class="page"
        ?active="${this._subpage == "manual"}"
      ></regions-manual>
      <regions-administrative
        class="page"
        ?active="${this._subpage == "administrative"}"
      ></regions-administrative>
      <regions-hydrology
        class="page"
        ?active="${this._subpage == "hydrology"}"
      ></regions-hydrology>
      <regions-agriculture
        class="page"
        ?active="${this._subpage == "agriculture"}"
      ></regions-agriculture>
    `;
  }

  stateChanged(state: RootState) {
    super.setSubPage(state);
    super.setRegionId(state);
  }
}
