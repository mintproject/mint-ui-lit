import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { sourceCodeGet, sourceCodesGet, sourceCodePost, sourceCodePut, sourceCodeDelete } from 'model-catalog/actions';
import { SourceCode, SourceCodeFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-source-code')
export class ModelCatalogSourceCode extends connect(store)(ModelCatalogResource)<SourceCode> {
    protected classes : string = "resource source-code";
    protected name : string = "source code";
    protected pname : string = "source codes";
    protected resourcesGet = sourceCodesGet;
    protected resourceGet = sourceCodeGet;
    protected resourcePost = sourceCodePost;
    protected resourcePut = sourceCodePut;
    protected resourceDelete = sourceCodeDelete;

    protected _renderResource (r:SourceCode) {
        let url : string = (r.codeRepository) ?  r.codeRepository[0] : '';
        return html`
            <b style="text-decoration: underline;">${getLabel(r)}</b>
            ${r.programmingLanguage || url ?
            html`
                <div style="display:flex; justify-content: space-between; align-items: center;">
                    ${r.programmingLanguage ? html`
                        <span>
                            <b>language:</b>
                            ${r.programmingLanguage[0]}
                        </span>`: ''}
                    ${url ? html`
                        <span>
                            <a target="_blank" href="${url}">
                                Code
                                <wl-icon style="font-size:14px; margin-left:3px">open_in_new<wl-icon>
                            </a>
                        </span>`: ''}
                </div>
            `: ''}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="i-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textfield id="i-language" label="Programming Language"
                value=${edResource && edResource.programmingLanguage ? edResource.programmingLanguage[0] : ''}>
            </wl-textfield>
            <wl-textfield id="i-code" label="Code Repository URL" type="URL"
                value=${edResource && edResource.codeRepository ? edResource.codeRepository[0] : ''}>
            </wl-textfield>
            <wl-textfield id="i-license" label="License"
                value=${edResource && edResource.license ? edResource.license[0] : ''}>
            </wl-textfield>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('i-label') as Textfield;
        let inputLang : Textfield = this.shadowRoot.getElementById('i-language') as Textfield;
        let inputCode : Textfield = this.shadowRoot.getElementById('i-code') as Textfield;
        let inputLicense : Textfield = this.shadowRoot.getElementById('i-license') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let lang : string = inputLang ? inputLang.value : '';
        let code : string = inputCode ? inputCode.value : '';
        let license : string = inputLicense ? inputLicense.value : '';

        if (label) {
            let jsonRes = {
                type: ["SourceCode"],
                label: [label],
                // New way to define props
                programmingLanguage: lang ? [lang] : [],
                codeRepository: code ? [code] : [],
                license: license ? [license] : []
            };

            return SourceCodeFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.sourceCodes;
    }
}
