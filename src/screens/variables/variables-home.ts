import { html, customElement, property, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";
import { SharedStyles } from "../../styles/shared-styles";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { listVariables } from "./actions";
import { Variable, VariableMap } from "./reducers";
import { CustomNotification } from "../../components/notification";

/*
store.addReducers({
    variables
});
*/

@customElement("variables-home")
export class VariablesHome extends connect(store)(PageViewElement) {
  @property({ type: Object })
  private variables: VariableMap = {};

  private _notification: CustomNotification;

  firstUpdated() {
    this._notification = document.createElement('custom-notification') as CustomNotification;
    document.body.appendChild(this._notification);
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this._notification.custom("Variable name copied to clipboard!", "content_copy");
    }).catch(() => {
      this._notification.error("Failed to copy variable name");
    });
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        .header {
          margin-bottom: 2rem;
        }
        .description-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .description-section h3 {
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        .description-section p {
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .description-section .variable-type {
          margin-top: 1.5rem;
        }
        .description-section .variable-type h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }
        .description-section .variable-type p {
          margin-left: 1rem;
        }
        .table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: auto;
        }
        .table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .table th:first-child {
          width: 60px;
          min-width: 60px;
        }
        .table th:nth-child(2) {
          width: 300px;
          min-width: 300px;
        }
        .table td {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
          vertical-align: top;
        }
        .table td:first-child {
          width: 60px;
          min-width: 60px;
          text-align: center;
          padding: 0.5rem;
        }
        .table td:nth-child(2) {
          width: 300px;
          min-width: 300px;
          word-break: break-word;
        }
        .table tr:hover {
          background-color: #f8f9fa;
        }
        .name-cell {
          font-weight: 500;
          color: #2c3e50;
        }
        .description {
          color: #6c757d;
          word-break: break-word;
          line-height: 1.5;
          padding-right: 1rem;
        }
        h1 {
          color: #212529;
          margin-bottom: 0.5rem;
        }
        h2 {
          color: #6c757d;
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .copy-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: all 0.2s;
          width: 32px;
          height: 32px;
        }
        .copy-button:hover {
          background: #f1f3f5;
          opacity: 1;
        }
      `
    ];
  }

  stateChanged(state: RootState) {
    this.variables = state.ui?.variables || {};
  }

  connectedCallback() {
    super.connectedCallback();
    store.dispatch(listVariables());
  }

  protected render() {
    const variables = Object.values(this.variables);

    return html`
      <div class="container">
        <div class="header">
          <h1>Standard Variables</h1>
        </div>
        <div class="description-section">
          <h3>About Standard Variables</h3>
          <p>
            A standard variable is necessary to refer to all variables using the same nomenclature in a domain ontology.
            This standardization facilitates exchanges of information and software, allowing researchers to focus on research
            rather than converting and re-formatting data.
          </p>

          <div class="variable-type">
            <h4>ICASA Variables</h4>
            <p>
              Variables that follow the ICASA standard for agriculture. These standards support agricultural research
              that quantifies complex interactions of processes across environmental conditions and crop management scenarios.
              <a href="https://dssat.net/data/standards_v2" target="_blank">Learn more about ICASA</a>
            </p>
          </div>

          <div class="variable-type">
            <h4>SVO Variables</h4>
            <p>
              Variables that follow the Scientific Variables Ontology (SVO). The SVO framework enables representation of
              scientific variables in machine-readable form for automated computational scientific workflows, providing
              modular expression and manipulation of scientific variable concepts.
              <a href="http://geoscienceontology.org/" target="_blank">Learn more about SVO</a>
            </p>
          </div>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${variables.map(
                (variable) => html`
                  <tr>
                    <td>
                      <button
                        class="copy-button"
                        @click=${() => this.copyToClipboard(variable.name)}
                        title="Copy variable name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </td>
                    <td class="name-cell">${variable.name}</td>
                    <td class="description">${variable.description || "No description available"}</td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
