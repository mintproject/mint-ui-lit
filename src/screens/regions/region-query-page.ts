import { customElement, property } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { RegionMap, Region } from "./reducers";

import "components/google-map-custom";
import "weightless/progress-spinner";

@customElement("region-query-page")
export class RegionQueryPage extends PageViewElement {
  @property({ type: String })
  public regionType: string;

  @property({ type: Object })
  private _regions: RegionMap;

  @property({ type: Object })
  protected _selectedRegion: Region;

  protected setSelectedRegion(state: RootState) {
    super.setRegion(state);
    if (state.regions && state.regions.regions) {
      this._regions = state.regions.regions;
      this._selectedRegion = this._regions[state.ui.selected_sub_regionid];
    }
  }
}
