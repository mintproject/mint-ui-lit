import { Region, SoftwareVersion, Model, ModelConfiguration, ModelConfigurationSetup } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

const TAG_LATEST = "latest";
const TAG_DEPRECATED = "deprecated";

export const capitalizeFirstLetter = (s:string) : string => {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export const getURL = (model:Model|string, ver?:SoftwareVersion|string, 
                       cfg?:ModelConfiguration|string, setup?:ModelConfigurationSetup|string) : string => {
    let modelid : string = typeof model === 'object' ? model.id : model;
    let verid : string = !!ver? (typeof ver === 'object' ? ver.id : ver) : '';
    let cfgid : string = !!cfg? (typeof cfg === 'object' ? cfg.id : cfg) : '';
    let setupid : string = !!setup? (typeof setup === 'object' ? setup.id : setup) : '';
    let url = uriToId(modelid);
    if (verid) {
        url += '/' + uriToId(verid);
        if (cfgid) {
            url += '/' + uriToId(cfgid);
            if (setupid) url += '/' + uriToId(setupid);
        }
    }
    return url;
};

export const uriToId = (uri:string) : string => {
    return typeof uri === 'string' ? uri.split('/').pop() : '';
}

export const getId = (obj: any) : string => {
    return obj.id ? uriToId(obj.id) : "";
}

export const getLabel = (obj: any) : string => {
    return obj && obj.label && obj.label.length > 0 ? obj.label[0] : getId(obj);
}

export const isSubregion = (parentRegionId:string, region:Region) : boolean => {
    return region && (
        (region.id === parentRegionId) || 
        (region.partOf||[]).some((r:Region) => isSubregion(parentRegionId, r))
    );
}

export const isMainRegion = (region:Region) : boolean => {
    return region.id === "https://w3id.org/okn/i/mint/Kyrgyzstan"
        || region.id === "https://w3id.org/okn/i/mint/Ethiopia"
        || region.id === "https://w3id.org/okn/i/mint/South_Sudan"
        || region.id === "https://w3id.org/okn/i/mint/Texas";
}

export const setupInRegion = (setup: ModelConfigurationSetup, parentRegionId: string, allRegions? : IdMap<Region>) => {
    if (!setup.hasRegion || setup.hasRegion.length == 0)
        return true;
    let regions = allRegions ? setup.hasRegion.map((region:Region) => allRegions[region.id]) : setup.hasRegion;
    return regions.some((region:Region) => isSubregion(parentRegionId, region));
}

export const isEmpty = (obj:object) : boolean => Object.keys(obj).length === 0;

export const taggedAs = (obj:object, tag:string) => {
    return obj && obj['tag'] && obj['tag'].length > 0 && obj['tag'][0] === tag;
}

export const sortVersions = (ver1:SoftwareVersion, ver2:SoftwareVersion) => {
    let latest : SoftwareVersion = getLatestVersion(ver1,ver2);
    return ver1 === latest? 1 : -1;
}

export const sortConfigurations = (cfg1:ModelConfiguration, cfg2:ModelConfiguration) => {
    let latest : ModelConfiguration = getLatestConfiguration(cfg1,cfg2);
    return cfg1 === latest? 1 : -1;
}

export const sortSetups = (setup1:ModelConfigurationSetup, setup2:ModelConfigurationSetup) => {
    let latest : ModelConfigurationSetup = getLatestSetup(setup1,setup2);
    return setup1 === latest? 1 : -1;
}

export const getLatestVersion = (ver1:SoftwareVersion, ver2:SoftwareVersion) : SoftwareVersion => {
    if (!ver1) return ver2;
    if (!ver2) return ver1;

    if (taggedAs(ver1, TAG_LATEST) || taggedAs(ver2, TAG_DEPRECATED)) return ver1;
    if (taggedAs(ver2, TAG_LATEST) || taggedAs(ver1, TAG_DEPRECATED)) return ver2;

    if (ver1.hasVersionId && ver2.hasVersionId) {
        let v1 = ver1.hasVersionId[0].split('.');
        let v2 = ver2.hasVersionId[0].split('.');
        let len = v1.length < v2.length ? v1.length : v2.length; // min len
        for (let i = 0; i < len; i++) {
            let a = parseInt(v1[i]);
            let b = parseInt(v2[i]);
            if (a > b) return ver1;
            if (b > a) return ver2;
        }
        if (v1.length !== v2.length) {
            return v1.length > v2.length ? ver1 : ver2;
        }
    } else if (ver1.hasVersionId) {
        return ver1;
    } else if (ver2.hasVersionId) {
        return ver2;
    }

    return ver2
}

export const getLatestConfiguration = (cfg1:ModelConfiguration, cfg2:ModelConfiguration) : ModelConfiguration => {
    if (!cfg1) return cfg2;
    if (!cfg2) return cfg1;

    if (taggedAs(cfg1, TAG_LATEST) || taggedAs(cfg2, TAG_DEPRECATED)) return cfg1;
    if (taggedAs(cfg2, TAG_LATEST) || taggedAs(cfg1, TAG_DEPRECATED)) return cfg2;

    return cfg2;
}

export const getLatestSetup = (setup1:ModelConfigurationSetup, setup2:ModelConfigurationSetup) : ModelConfigurationSetup => {
    if (!setup1) return setup2;
    if (!setup2) return setup1;

    if (taggedAs(setup1, TAG_LATEST) || taggedAs(setup2, TAG_DEPRECATED)) return setup1;
    if (taggedAs(setup2, TAG_LATEST) || taggedAs(setup1, TAG_DEPRECATED)) return setup2;

    return setup2;
}

export const sortByPosition = (a,b) => {
    let intA = Number(a.position);
    let intB = Number(b.position);
    return (intA < intB) ? -1 : (intA > intB? 1 : 0);
}

export const isExecutable = (config: ModelConfiguration|ModelConfigurationSetup) : boolean => {
    return  !!config &&
            config.hasOutput &&
            config.hasOutput.length > 0 &&
            config.hasComponentLocation &&
            config.hasComponentLocation.length > 0 &&
            config.hasSoftwareImage &&
            config.hasSoftwareImage.length > 0;
}
