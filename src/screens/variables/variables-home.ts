import { html, customElement, property, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";
import { SharedStyles } from "../../styles/shared-styles";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { VariablePresentation } from "@mintproject/modelcatalog_client";
import { CustomNotification } from "../../components/notification";
import { ModelCatalogApi } from "../../model-catalog-api/model-catalog-api";

/*
store.addReducers({
    variables
});
*/

@customElement("variables-home")
export class VariablesHome extends connect(store)(PageViewElement) {
  @property({ type: Array })
  private variablePresentations: VariablePresentation[] = [];

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
        .table td {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
          vertical-align: top;
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
        .units {
          color: #6c757d;
          font-style: italic;
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
    // Get variable presentations from the model catalog state
    const modelCatalog = state.modelCatalog;
    if (modelCatalog && modelCatalog.variablepresentation) {
      this.variablePresentations = Object.values(modelCatalog.variablepresentation);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Load variable presentations
    store.dispatch(ModelCatalogApi.myCatalog.variablePresentation.getAll());
  }

  protected render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>Variable Presentations</h1>
        </div>
        <div class="description-section">
          <h3>About Variable Presentations</h3>
          <p>
            Variable presentations define how variables are represented in specific contexts, including their units,
            constraints, and relationships to standard variables. They provide a way to customize how variables
            are used in different models and datasets while maintaining connections to standardized ontologies.
          </p>

          <div class="variable-type">
            <h4>Key Features</h4>
            <p>
              Variable presentations include:
              <ul>
                <li>Human-readable names and descriptions</li>
                <li>Units of measurement</li>
                <li>Constraints and value ranges</li>
                <li>Links to standard variables</li>
              </ul>
            </p>
          </div>

          <div class="variable-type">
            <h4>Model Integration with MINT</h4>
            <p>
              The Model Integration (MINT) platform uses standard variables as keys to match model inputs with datasets
              from data catalogs like CKAN. Think of standard variables as the "mint" that connects different components:
              <ul>
                <li>They serve as a common language between models and datasets</li>
                <li>Enable automatic matching of model inputs with appropriate data sources</li>
                <li>Facilitate interoperability across different scientific domains</li>
                <li>Allow for consistent data exchange and reuse</li>
              </ul>
              This standardization is crucial for enabling automated workflows and ensuring that models can find and use
              the right data without manual intervention.
            </p>
          </div>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Standard Variables</th>
                <th>Variable Presentation</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              ${this.variablePresentations.map(
                (vp) => html`
                  <tr>
                    <td>
                      <button
                        class="copy-button"
                        @click=${() => this.copyToClipboard(vp.hasStandardVariable?.[0]?.label?.[0] || vp.label?.[0] || '')}
                        title="Copy standard variable name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </td>
                    <td class="description">
                      ${vp.hasStandardVariable?.map(sv => sv.label?.[0]).join(', ') || '-'}
                    </td>
                    <td class="name-cell">
                      <div>${vp.label?.[0] || 'Unnamed'}</div>
                      <div class="description">${vp.description?.[0] || "No description available"}</div>
                    </td>
                    <td class="units">${vp.usesUnit?.map(u => u.label?.[0]).join(', ') || '-'}</td>
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