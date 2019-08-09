
import { html, customElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element.js';

import { SharedStyles } from '../../styles/shared-styles.js';

/*
store.addReducers({
    variables
});
*/

@customElement('variables-home')
export class VariablesHome extends PageViewElement {
    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
        Details about the variable here
    `
    }
}
