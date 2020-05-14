import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { softwareImageGet, softwareImagesGet, softwareImagePost, softwareImagePut, softwareImageDelete } from 'model-catalog/actions';
import { SoftwareImage, SoftwareImageFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-software-image')
export class ModelCatalogSoftwareImage extends connect(store)(ModelCatalogResource)<SoftwareImage> {
    protected classes : string = "resource software-image";
    protected name : string = "software image";
    protected pname : string = "software images";
    protected resourcesGet = softwareImagesGet;
    protected resourceGet = softwareImageGet;
    protected resourcePost = softwareImagePost;
    protected resourcePut = softwareImagePut;
    protected resourceDelete = softwareImageDelete;

    protected _renderResource (r:SoftwareImage) {
        let label : string = getLabel(r);
        let sp : string[] = label.split(':');
        let url : string = (sp.length > 0) ? 
                "https://hub.docker.com/r/" + sp[0] + "/tags" : '#';
        return html`<a target="_blank" href="${url}">${getLabel(r)}</a>`;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="time-interval-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('time-interval-label') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        if (label) {
            let jsonRes = {
                type: ["SoftwareImage"],
                label: [label],
            };
            return SoftwareImageFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.softwareImages;
    }
}
