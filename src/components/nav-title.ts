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
        div.simple-breadcrumbs {
          color: rgb(72, 72, 72);
          font-size: .8rem;
          display: flex;
        }

        div.simple-breadcrumbs > span {
          padding: 0px 4px;
        }

        div.simple-breadcrumbs > a {
          display: inline-block;
          text-overflow: ellipsis;
          overflow: hidden;
          text-wrap: nowrap;
          max-width: 210px;
        }

        div.simple-breadcrumbs > a[selected] {
          color: rgb(72, 72, 72);
          font-weight: 600;
        }

        div.simple-breadcrumbs > a:hover {
          background-color: transparent;
        }`
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
    let pageSkip = [ ...PAGE_SKIP, ...this.ignore];

    let loc = window.location.pathname;
    let parts = loc.split('/');
    if (parts[parts.length-1] === "")
      parts = parts.slice(0,-1);
    if (parts.length <= 2) {
      return html``;
    }
    let paths = parts.slice(1);
    let current = paths[paths.length-1];
    
    return html`
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
      <div style="display:flex; justify-content: space-between; align-items: center;">
          <wl-title level="3" class="page-title">
            ${pageNames[current] || current}
          </wl-title>
        <slot name="after"></slot>
      </div>` : null}
    `;
  }
}