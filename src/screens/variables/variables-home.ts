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

  @property({ type: String })
  private searchQuery: string = '';

  @property({ type: Boolean })
  private isExplanationExpanded: boolean = true;

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

  private _filterVariablePresentations(): VariablePresentation[] {
    if (!this.searchQuery) return this.variablePresentations;

    const query = this.searchQuery.toLowerCase();
    return this.variablePresentations.filter(vp => {
      const name = vp.label?.[0]?.toLowerCase() || '';
      const description = vp.description?.[0]?.toLowerCase() || '';
      const standardVars = vp.hasStandardVariable?.map(sv => sv.label?.[0]?.toLowerCase()).join(' ') || '';

      return name.includes(query) ||
             description.includes(query) ||
             standardVars.includes(query);
    });
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1em 2rem;
        }
        .header {
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .toggle-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }
        .toggle-button:hover {
          color: #495057;
        }
        .toggle-button svg {
          width: 16px;
          height: 16px;
          margin-right: 0.5rem;
          transition: transform 0.3s ease;
        }
        .toggle-button.collapsed svg {
          transform: rotate(-90deg);
        }
        .description-section {
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        .description-section.collapsed {
          margin-bottom: 0;
          padding: 0;
          height: 0;
          overflow: hidden;
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
        .search-bar {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 0.5rem 1rem;
        }
        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0.5rem;
          font-size: 1rem;
          color: #495057;
        }
        .search-bar input::placeholder {
          color: #adb5bd;
        }
        .table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: visible;
          position: relative;
        }
        .table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          overflow: auto;
        }
        .table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: rgb(72,72,72);
          border-bottom: 2px solid #dee2e6;
          position: sticky;
          top: -10px;
          z-index: 1;
        }
        .table td {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
          vertical-align: top;
        }
        .table tr:nth-child(even) {
          background-color: #F2F2F2;
        }
        .table tr:nth-child(odd) {
          background-color: #F9F9F9;
        }
        .table tr:hover {
          background-color: #EEEEEE;
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
          position: relative;
        }
        .copy-button:hover {
          background: #f1f3f5;
          opacity: 1;
        }
        .copy-button .tooltip {
          position: absolute;
          bottom: calc(100% + 15px);
          left: 50%;
          transform: translateX(-25%) translateY(10px);
          background: #2c3e50;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          pointer-events: none;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .copy-button .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 25%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: #2c3e50 transparent transparent transparent;
        }
        .copy-button:hover .tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-25%) translateY(0);
        }
        .concept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .concept-card {
          border-top: 4px solid rgb(97, 163, 156);
          background: #F4F4F4;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .concept-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        }

        .concept-card h4 {
          color: rgb(72, 72, 72);
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .concept-card p {
          color: #495057;
          margin: 0;
          line-height: 1.5;
        }

        .concept-card ul {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
        }

        .concept-card li {
          margin-bottom: 0.5rem;
          color: #495057;
        }

        @media (max-width: 900px) {
          .concept-grid {
            grid-template-columns: 1fr;
          }
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
    const filteredPresentations = this._filterVariablePresentations();
    let nav = [{ label: "Explore Variables", url: "variables" }];

    return html`
      <nav-title .ignore=${[]}></nav-title>
      <div class="container">
        <div class="description-section ${this.isExplanationExpanded ? '' : 'collapsed'}">
          <div class="concept-grid">
            <div class="concept-card">
              <h4>What is a Standard Variable?</h4>
              <p>
                A standard variable is necessary to refer to all variables using the same nomenclature in a domain ontology.
                For example, a standard variable may be a <a href="http://www.geoscienceontology.org/geo-upper#Variable" target="_blank">SVO variable</a>.
                Standard variables serve as the common language that connects different variable presentations of the same concept.
              </p>
            </div>

            <div class="concept-card">
              <h4>What is a Variable Presentation?</h4>
              <p>
                A variable presentation is a concept used to represent an instantiation of a variable in an input/output dataset.
                For example:
                <ul>
                  <li>Model A may use an input file with temperature expressed in Fahrenheit (variablePresentation1)</li>
                  <li>Model B may produce an output with temperature in Celsius (variablePresentation2)</li>
                  <li>Both variable presentations refer to the same concept of temperature</li>
                </ul>
                This allows different models to use the same variable concept with different units or representations while maintaining
                semantic interoperability.
              </p>
            </div>
          </div>

          <div class="concept-card">
            <h4>How to Use Standard Variables</h4>
            <p>
              The standard variable will be required on your model inputs and datasets (data catalog). Below you'll find a list
              of all available standard variables that you can use when:
              <ul>
                <li>Uploading your datasets to the data catalog</li>
                <li>Creating new models</li>
                <li>Defining model inputs and outputs</li>
              </ul>
              Use the search bar below to find the appropriate standard variable for your data or model. You can click the copy
              button next to each variable to easily copy its name.
            </p>
          </div>
        </div>
        <div class="table-container">
          <div class="search-bar">
            <input
              type="text"
              placeholder="Search variable presentations..."
              .value=${this.searchQuery}
              @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
            />
          </div>
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
              ${filteredPresentations.map(
                (vp) => html`
                  <tr>
                    <td>
                      <button
                        class="copy-button"
                        @click=${() => this.copyToClipboard(vp.hasStandardVariable?.[0]?.label?.[0] || vp.label?.[0] || '')}
                        title="Copy standard variable name">
                        <div class="tooltip">Click to copy standard variable name</div>
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