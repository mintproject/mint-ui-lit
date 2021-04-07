import { ModelCatalogResource } from './resource';
import { ModelCategory, ModelCategoryFromJSON } from '@mintproject/modelcatalog_client';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

@customElement('model-catalog-category')
export class ModelCatalogCategory extends connect(store)(ModelCatalogResource)<ModelCategory> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    protected classes : string = "resource category";
    protected name : string = "category";
    protected pname : string = "categories";
    
    protected resourceApi : DefaultReduxApi<ModelCategory,BaseAPI> = ModelCatalogApi.myCatalog.modelCategory;

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.categories;
    }
}
