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

    private _toUri (r:SoftwareImage) : string {
        let url : string = "";
        if (r && r.availableInRegistry && r.availableInRegistry.length > 0) {
            let registry : string = r.availableInRegistry[0];
            switch (registry) {
                case 'https://hub.docker.com/repository/docker/':
                    let label : string = getLabel(r);
                    let sp : string[] = label.split(':');
                    url = (sp.length > 0) ? "https://hub.docker.com/r/" + sp[0] + "/tags" : '';
                    break;
                default: break;
            }
        }
        return url;
    }

    protected _renderResource (r:SoftwareImage) {
        let url = this._toUri(r);
        return url ? 
            html`<a target="_blank" href="${url}">${getLabel(r)}</a>` 
            : html`<span>${getLabel(r)}</span>`;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textfield id="registry" label="Registry" required
                value=${edResource && edResource.availableInRegistry ? edResource.availableInRegistry[0] : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('label') as Textfield;
        let inputRegistry : Textfield = this.shadowRoot.getElementById('registry') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let registry : string = inputRegistry ? inputRegistry.value : '';
        if (label && registry) {
            let jsonRes = {
                type: ["SoftwareImage"],
                label: [label],
                availableInRegistry: [registry]
            };
            return SoftwareImageFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!registry) (<any>inputRegistry).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.softwareImages;
    }
}
