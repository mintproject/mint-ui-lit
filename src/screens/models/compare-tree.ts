import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { ComparisonEntry } from './model-explore/ui-reducers';
import { IdMap } from "app/reducers";

import { getLabel, isSubregion, sortVersions, sortConfigurations, sortSetups } from 'model-catalog-api/util';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Region, ModelCategory } from '@mintproject/modelcatalog_client';

import { TreeNode } from 'components/tree-node';
import { TreeRoot } from 'components/tree-root';

import "weightless/progress-spinner";
import '../../components/loading-dots'
import { goToPage } from 'app/actions';

@customElement('compare-tree')
export class CompareTree extends connect(store)(PageViewElement) {
    @property({type: Array})  private _compare : ComparisonEntry[] = [];
    @property({type: Object}) private _categories : IdMap<ModelCategory> = {};
    @property({type: Object}) private _models : IdMap<Model> = {};
    @property({type: Object}) private _versions : IdMap<SoftwareVersion> = {};
    @property({type: Object}) private _configs : IdMap<ModelConfiguration> = {};
    @property({type: Object}) private _setups : IdMap<ModelConfigurationSetup> = {};
    @property({type: Object}) private _regions : IdMap<Region> = {};

    @property({type: Boolean}) private _loadingModels : boolean = true;
    @property({type: Boolean}) private _loadingVersions : boolean = true;
    @property({type: Boolean}) private _loadingConfigs : boolean = true;
    @property({type: Boolean}) private _loadingSetups : boolean = true;
    active: boolean = true;

    private _modelTree : TreeRoot;
    private _nodes : IdMap<TreeNode> = {};

    protected render () {
        this._calculateTree();
        if (this._loadingModels) return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
        else return html`${this._modelTree}`;
    }

    _addToComparison (c:ComparisonEntry) {
        if (this._compare.filter((ce:ComparisonEntry) => ce.uri === c.uri).length === 0) {
            let newC : ComparisonEntry[] = [ ... this._compare ];
            console.log(this._compare)
            newC.push(c);
            goToPage('models/compare/' + this._getURL(newC));
        }
    }

    _getURL (cArr:ComparisonEntry[]) {
        let url = "";
        cArr.forEach((c:ComparisonEntry) => {
            if (url.length > 0) url += "&"
            if (c.type === "Model") url += "model=";
            else if (c.type === "SoftwareVersion") url += "version=";
            else if (c.type === "ModelConfiguration") url += "config=";
            else if (c.type === "ModelConfigurationSetup") url += "setup=";
            url += c.uri.split('/').pop();
        })
        return url;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if (state.explorerUI) {
            this._compare = state.explorerUI.compare;
        }
        if (state.modelCatalog) {
            this._models = state.modelCatalog.model;
            this._versions = state.modelCatalog.softwareversion;
            this._configs = state.modelCatalog.modelconfiguration;
            this._setups = state.modelCatalog.modelconfigurationsetup;
            this._regions = state.modelCatalog.region;
            this._categories = state.modelCatalog.modelcategory;
        }
    }


    protected firstUpdated () {
        this._modelTree = new TreeRoot();
        store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll()).then((categories:IdMap<ModelCategory>) => {
            this._categories = categories;
        });
        store.dispatch(ModelCatalogApi.myCatalog.model.getAll()).then((models:IdMap<Model>) => {
            this._loadingModels = false;
            this._models = models;
        });
        store.dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll()).then((versions:IdMap<SoftwareVersion>) => {
            this._loadingVersions = false;
            this._versions = versions;
            Object.keys(versions).forEach((vid:string) => !!this._nodes[vid] && this._nodes[vid].refresh());
        });
        store.dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll()).then((cfgs:IdMap<ModelConfiguration>) => {
            this._loadingConfigs = false;
            this._configs = cfgs;
            Object.keys(cfgs).forEach((cid:string) => !!this._nodes[cid] && this._nodes[cid].refresh());
        });
        let setupReq = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll())
        setupReq.then((setups:IdMap<ModelConfigurationSetup>) => {
            this._setups = setups;
            Object.keys(setups).forEach((sid:string) => !!this._nodes[sid] && this._nodes[sid].refresh());
        });
        let regionReq = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        regionReq.then((regions:IdMap<Region>) => {
            this._regions = regions;
        });
        Promise.all([setupReq, regionReq]).then(() => {
            this._loadingSetups = false;
        })
    }

    private _calculateTree () {
        if (!this._modelTree) return;
        const visibleSetup = (setup: ModelConfigurationSetup) =>
            !!setup && (!setup.hasRegion || (setup.hasRegion||[]).some((region:Region) =>
                    isSubregion(this._region.model_catalog_uri, this._regions[region.id])));

        Object.values(this._models).forEach((m:Model) => {
            // Model nodes.
            let category : string = m.hasModelCategory && m.hasModelCategory.length > 0 ?
                    getLabel(this._categories && this._categories[m.hasModelCategory[0].id] ?
                        this._categories[m.hasModelCategory[0].id]
                        : m.hasModelCategory[0])
                    : 'Uncategorized';
            if (!this._nodes[category]) {
                let newNode : TreeNode = new TreeNode();
                newNode.setName(category);
                newNode.selectIcon = false;
                newNode.select();
                newNode.contract();
                newNode.onClick = newNode.toggle;
                this._nodes[category] = newNode;
            }
            let nodeCat: TreeNode = this._nodes[category];

            if (!this._nodes[m.id]) {
                let newNode : TreeNode = new TreeNode();
                newNode.setName(getLabel(m));
                newNode.onClick = () => {
                    this._addToComparison({type:'Model', uri:m.id});
                };
                newNode.contract();
                this._nodes[m.id] = newNode;
            }
            let nodeModel : TreeNode = this._nodes[m.id];
            if (!nodeCat.hasNode(nodeModel)) nodeCat.addChild(nodeModel);
            if (!this._modelTree.hasNode(nodeCat)) this._modelTree.addChild(nodeCat);

            if (this._loadingVersions) {
                //TODO: show a loading thing
            } else {
                (m.hasVersion||[])
                        .map((v:SoftwareVersion) => this._versions[v.id])
                        .sort(sortVersions)
                        .forEach((v:SoftwareVersion) => {
                    if (!this._nodes[v.id]) {
                        let newNode = new TreeNode();
                        newNode.setName(getLabel(v));
                        let tag : string[] = v['tag'];
                        if (tag && tag.length > 0) {
                            if (tag[0] == "preferred") newNode.setTagIcon('start');
                            else {
                                if (tag[0] == "deprecated") newNode.style.cssText = "--tag-background-color: chocolate;";
                                else if (tag[0] == "latest") newNode.style.cssText = "--tag-background-color: forestgreen;";
                                newNode.setTag(tag[0])
                            }
                        }
                        newNode.onClick = () => {
                            this._addToComparison({type:'SoftwareVersion', uri:v.id});
                        };
                        this._nodes[v.id] = newNode;
                    }

                    let nodeVersion : TreeNode = this._nodes[v.id];
                    if (!nodeModel.hasNode(nodeVersion)) nodeModel.addChild(nodeVersion);

                    if (this._loadingConfigs) {
                        //TODO: loading...
                    } else {
                        (v.hasConfiguration || [])
                                .map((c:ModelConfiguration) => this._configs[c.id])
                                .sort(sortConfigurations)
                                .forEach((c:ModelConfiguration) => {
                            if (!this._nodes[c.id]) {
                                let newNode = new TreeNode();
                                newNode.setName(getLabel(c))
                                newNode.style.cssText = "--text-color: rgb(6, 108, 67);";
                                newNode.onClick = () => {
                                    this._addToComparison({type:'ModelConfiguration', uri:c.id});
                                };
                                this._nodes[c.id] = newNode;
                            }
                            let nodeConfig : TreeNode = this._nodes[c.id];
                            if (!nodeVersion.hasNode(nodeConfig)) nodeVersion.addChild(nodeConfig);

                            if (this._loadingSetups) {
                                //TODO: loading...
                            } else {
                                (c.hasSetup || [])
                                        .map((s:ModelConfigurationSetup) => this._setups[s.id])
                                        .filter(visibleSetup)
                                        .sort(sortSetups)
                                        .forEach((s:ModelConfigurationSetup) => {
                                    if (!this._nodes[s.id]) {
                                        let newNode : TreeNode = new TreeNode();
                                        newNode.setName(getLabel(s));
                                        newNode.style.cssText = "--text-color: rgb(6, 67, 108);";
                                        newNode.onClick = () => {
                                            this._addToComparison({type:'ModelConfigurationSetup', uri:s.id});
                                        };
                                        this._nodes[s.id] = newNode;
                                    }
                                    let nodeSetup : TreeNode = this._nodes[s.id];
                                    if (!nodeConfig.hasNode(nodeSetup)) nodeConfig.addChild(nodeSetup);
                                });

                            }
                        });
                    }
                });
            }
        });

        Object.values(this._nodes).forEach((n:TreeNode) => n.unselect());
        this._compare.forEach((c:ComparisonEntry) => {
            if (this._nodes[c.uri]) this._nodes[c.uri].select();
            //FIXME: when selected, the parent should expand...
        });
    }
}
