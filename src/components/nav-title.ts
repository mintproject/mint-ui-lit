import { customElement, LitElement, property, html, css } from "lit-element";
import { SharedStyles } from "../styles/shared-styles";

import "weightless/icon";

const PAGE_NAMES = {
  'variables': 'Explore Variables',
  'regions': 'Explore Areas',
  'agriculture': 'Agriculture Regions',
  'hydrology': 'Hydrology Regions',
  'administrative': 'Administrative Regions',
  'models': 'Prepare Models',
  'explore': 'Model Catalog',
  'register': 'Add Models',
  'edit': 'Edit Models',
  'compare': 'Compare Models',
  'configure': 'Configure Models',
  'cromo': 'Recommend Models',
  'datasets': 'Explore Data',
  'browse': 'Browse Datasets',
  'quality-workflows': 'Improve Quality of Datasets',
  'rs-workflows': 'Remote Sensing',
  'report': 'Available Reports',
  'emulators': 'Model Products / Emulators',
  'messages': 'Discussion topics',
  'modeling': 'Problem statements'
}

const PAGE_SKIP = ['analysis']

@customElement("nav-title")
export class NavTitle extends LitElement {
  @property({ type: Boolean }) displaytitle = true;
  @property({ type: Object }) names = {};
  @property({ type: Array }) ignore = [];

  static get styles() {
    return [ SharedStyles, css`
        .nav-br-t {
          padding: 0;
        }

        div.simple-breadcrumbs {
          padding-top: 45px;
          margin-bottom: 40px
        }
          `
    ];
  }

  createURL (pages, index) {
    let url = ""
    for (let i = 0; i <= index; i++) {
      url += pages[i] + '/';
    }
    return url.substring(0, url.length - 1);
  }


  protected render() {
    let pageNames = { ...PAGE_NAMES, ...this.names};

    let loc = window.location.pathname;
    let parts = loc.split('/');
    if (parts[parts.length-1] === "")
      parts = parts.slice(0,-1);
    if (parts.length <= 2) {
      return html``;
    }
    let paths = parts.slice(1);
    let current = paths[paths.length-1];
    
    //exclude model= paths
    let ignore = paths.filter(p => p.includes('model='));
    let pageSkip = [ ...PAGE_SKIP, ...this.ignore, ...ignore];
    
    return html`
    <div class="nav-br-t">
      <div class="simple-breadcrumbs">
        ${paths.map((page, i) => i == 0 ? 
            html`<a href="${this.createURL(paths, i)}/home" ?selected=${page === current}>Home</a>`
          : (pageSkip.includes(page) ? html`` :
            html`
              <span>&gt;</span>
              <a href="${this.createURL(paths, i)}" ?selected=${page === current}>${pageNames[page] || page}</a>`
            )
        )}
      </div>
      ${this.displaytitle ? html`
      <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
          <wl-title level="3">
            ${pageSkip.includes(current) ? "Compare Models" : pageNames[current] || current}
          </wl-title>
        <slot name="after"></slot>
      </div>` : null}
    </div>
    `;
  }
}