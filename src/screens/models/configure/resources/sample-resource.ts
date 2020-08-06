import { ModelCatalogResource } from './resource';
import { SampleResource, Unit, SampleResourceFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { sampleResourceGet, sampleResourcesGet, sampleResourcePost, sampleResourcePut, sampleResourceDelete } from 'model-catalog/actions';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-sample-resource')
export class ModelCatalogSampleResource extends connect(store)(ModelCatalogResource)<SampleResource> {
    protected classes : string = "resource sample-resource";
    protected name : string = "sample resource";
    protected pname : string = "sample resources";
    protected resourcesGet = sampleResourcesGet;
    protected resourceGet = sampleResourceGet;
    protected resourcePost = sampleResourcePost;
    protected resourcePut = sampleResourcePut;
    protected resourceDelete = sampleResourceDelete;

/*export interface SampleResource {
    dataCatalogIdentifier?: Array<string> | null;
    description?: Array<string> | null;
    id?: string;
    label?: Array<string> | null;
    type?: Array<string> | null;
    value?: Array<object> | null;
}*/

    protected _renderResource (r:SampleResource) {
        return r.value ? html`<a target="_blank" href="${r.value}">${getLabel(r)}</a>` : html`${getLabel(r)}`;
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.sampleResources;
    }
}
