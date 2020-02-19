import { Region } from '@mintproject/modelcatalog_client';

export const isSubregion = (parentRegionId:string, region:Region) => {
    return region && (
        (region.id === parentRegionId) || 
        (region.country||[]).some(r => r.id === parentRegionId)
    );
}

export const isEmpty = (obj:object) => Object.keys(obj).length === 0;
