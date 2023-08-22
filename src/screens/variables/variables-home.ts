import { html, customElement } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";

/*
store.addReducers({
    variables
});
*/

@customElement("variables-home")
export class VariablesHome extends PageViewElement {
  static get styles() {
    return [SharedStyles];
  }

  protected render() {
    return html` Details about the variable here `;
  }
}
