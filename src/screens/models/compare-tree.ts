import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { ExplorerStyles } from './model-explore/explorer-styles';
import { ComparisonEntry } from './model-explore/ui-reducers';
import { IdMap } from "app/reducers";

import { getLabel, isSubregion, sortVersions, sortConfigurations, sortSetups } from 'model-catalog/util';
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
    @property({type: Object}) private _categories : IdMap<ModelCategory>;
    active: boolean = true;


    static get styles() {
        return [ExplorerStyles,
            SharedStyles,
            css `
            .custom-button {
                line-height: 20px;
                cursor: pointer;
                margin-right: 5px;
                border: 1px solid green;
                padding: 1px 3px;
                border-radius: 4px;
            }

            .custom-button:hover {
                background-color: rgb(224, 224, 224);
            }

            .right_full {
                width: 100%;
            }

            span.tag {
                border: 1px solid;
                border-radius: 3px;
                padding: 0px 3px;
                font-weight: bold;
            }
            
            span.tag.deprecated {
                border-color: chocolate;
                background: chocolate;
                color: white;
            }
            
            span.tag.latest {
                border-color: forestgreen;
                background: forestgreen;
                color: white;
            }

            .horizontal-table {
                table-layout:fixed;
                width: fit-content;
                overflow-x: auto;
            }
            `,
        ];
    }
    
    protected render () {
        this._calculateTree();
        if (this._loadingAllModels) return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
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
    }

    private _allModels : IdMap<Model> = {};
    private _allVersions : IdMap<SoftwareVersion> = {};
    private _allConfigs : IdMap<ModelConfiguration> = {};
    private _allSetups : IdMap<ModelConfigurationSetup> = {};
    private _allRegions : IdMap<Region> = {};

    @property({type: Boolean}) private _loadingAllModels : boolean = true;
    @property({type: Boolean}) private _loadingAllVersions : boolean = true;
    @property({type: Boolean}) private _loadingAllConfigs : boolean = true;
    @property({type: Boolean}) private _loadingAllSetups : boolean = true;

    protected firstUpdated () {
        this._modelTree = new TreeRoot();
        store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll()).then((categories:IdMap<ModelCategory>) => {
            this._categories = categories;
        });
        store.dispatch(ModelCatalogApi.myCatalog.model.getAll()).then((models:IdMap<Model>) => {
            this._loadingAllModels = false;
            this._allModels = models;
        });
        store.dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll()).then((versions:IdMap<SoftwareVersion>) => {
            this._loadingAllVersions = false;
            this._allVersions = versions;
            Object.keys(versions).forEach((vid:string) => !!this._nodes[vid] && this._nodes[vid].refresh());
        });
        store.dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll()).then((cfgs:IdMap<ModelConfiguration>) => {
            this._loadingAllConfigs = false;
            this._allConfigs = cfgs;
            Object.keys(cfgs).forEach((cid:string) => !!this._nodes[cid] && this._nodes[cid].refresh());
        });
        let setupReq = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll())
        setupReq.then((setups:IdMap<ModelConfigurationSetup>) => {
            this._allSetups = setups;
            Object.keys(setups).forEach((sid:string) => !!this._nodes[sid] && this._nodes[sid].refresh());
        });
        let regionReq = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        regionReq.then((regions:IdMap<Region>) => {
            this._allRegions = regions;
        });
        Promise.all([setupReq, regionReq]).then(() => {
            this._loadingAllSetups = false;
        })
    }

    private _modelTree : TreeRoot;
    private _nodes : IdMap<TreeNode> = {};

    private _calculateTree () {
        const visibleSetup = (setup: ModelConfigurationSetup) =>
            !!setup && (!setup.hasRegion || (setup.hasRegion||[]).some((region:Region) =>
                    isSubregion(this._region.model_catalog_uri, this._allRegions[region.id])));

        Object.values(this._allModels).forEach((m:Model) => {
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

            if (this._loadingAllVersions) {
                //TODO: show a loading thing
            } else {
                (m.hasVersion||[])
                        .map((v:SoftwareVersion) => this._allVersions[v.id])
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

                    if (this._loadingAllConfigs) {
                        //TODO: loading...
                    } else {
                        (v.hasConfiguration || [])
                                .map((c:ModelConfiguration) => this._allConfigs[c.id])
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

                            if (this._loadingAllSetups) {
                                //TODO: loading...
                            } else {
                                (c.hasSetup || [])
                                        .map((s:ModelConfigurationSetup) => this._allSetups[s.id])
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
        });
    }
}
