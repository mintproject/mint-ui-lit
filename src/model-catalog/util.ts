import { Region, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup } from '@mintproject/modelcatalog_client';

export const getId = (obj: any) => {
    return obj.id.split('/').pop();
}

export const isSubregion = (parentRegionId:string, region:Region) => {
    return region && (
        (region.id === parentRegionId) || 
        (region.country||[]).some(r => r.id === parentRegionId)
    );
}

export const isEmpty = (obj:object) => Object.keys(obj).length === 0;

export const getLatestVersion = (ver1:SoftwareVersion, ver2:SoftwareVersion) => {
    if (!ver1) return ver2;
    if (!ver2) return ver1;

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

export const getLatestConfiguration = (cfg1:ModelConfiguration, cfg2:ModelConfiguration) => {
    if (!cfg1) return cfg2;
    if (!cfg2) return cfg1;

    return cfg2;
}

export const getLatestSetup = (setup1:ModelConfigurationSetup, setup2:ModelConfigurationSetup) => {
    if (!setup1) return setup2;
    if (!setup2) return setup1;

    return setup2;
}
