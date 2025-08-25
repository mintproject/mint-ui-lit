import { html, customElement, css, property } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import analysis from "./reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "./analysis-compare";
import "./analysis-visualize";
import "./analysis-aggregate";
import "./analysis-report";
import "../../components/nav-title";

store.addReducers({
  analysis,
});

@customElement("analysis-home")
export class AnalysisHome extends connect(store)(PageViewElement) {
  @property({ type: String })
  private _selectedThreadId: string = "";

  static get styles() {
    return [css``, SharedStyles];
  }

  protected render() {
    return html`
    <div class="content-page">
      <nav-title .ignore="${[]}"></nav-title>
      <analysis-report
        class="page"
        ?active="${this._subpage == "report"}"
      ></analysis-report>
    </div>`;
  }

  stateChanged(state: RootState) {
    super.setRegionId(state);
    super.setSubPage(state);
    if (state.ui) {
      this._selectedThreadId = state.ui.selected_thread_id;
    }
  }
}
