/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, property } from 'lit-element';
import { RootState } from '../app/store';
import { Region, BoundingBox } from 'screens/regions/reducers';

export class PageViewElement extends LitElement {
  @property({type: Object})
  protected _region: Region;
  
  @property({type: String})
  protected _regionid: string;

  @property({type: String})
  protected _subpage: string = '';

  @property({type: Boolean})
  active = false;

  // Only render this page if it's actually visible.
  protected shouldUpdate() {
    return this.active;
  }

  setSubPage(state: RootState) {
    if(state.app && state.app.subpage)
      this._subpage = state.app!.subpage;
  }

  setRegion(state: RootState): boolean {
    if(state.ui && state.ui && state.regions) {
      let curregionid = this._regionid;
      this._regionid = state.ui.selected_top_regionid;
      if (this._regionid && state && state.regions && state.regions.regions && state.regions.regions[this._regionid]) {
        this._region = state.regions.regions[this._regionid];
      }
      if(curregionid != this._regionid) {
        return true;
      }
    }
    return false;
  }

  setRegionId(state: RootState): boolean {
    return this.setRegion(state);
  }
}
