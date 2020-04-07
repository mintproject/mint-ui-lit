import { Action } from "redux";
import { IdMap } from 'app/reducers';
import { BoundingBox } from 'screens/regions/reducers';
import { Configuration, GeoShape, GeoShapeApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getUser, getStatusConfigAndUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC GeoShape]', ...args); }

const str_to_bbox = (bb: string) : BoundingBox => {
    let coords = bb.split(/,| /g);
    return { 
        xmin: parseFloat(coords[0]),
        ymin: parseFloat(coords[1]),
        xmax: parseFloat(coords[2]),
        ymax: parseFloat(coords[3])
    };
}

const parseBoundingBox = (gs:GeoShape) : GeoShape => {
    if (gs.box && gs.box.length === 1) {
        return { ...gs, bbox: str_to_bbox(gs.box[0]) } as GeoShape;
    } else {
        return gs;
    }
}

export const GEO_SHAPES_ADD = "GEO_SHAPES_ADD";
export const GEO_SHAPE_DELETE = "GEO_SHAPE_DELETE";

export interface MCAGeoShapesAdd extends Action<'GEO_SHAPES_ADD'> { payload: IdMap<GeoShape> };
interface MCAGeoShapeDelete extends Action<'GEO_SHAPE_DELETE'> { uri: string };

export type ModelCatalogGeoShapeAction =  MCAGeoShapesAdd | MCAGeoShapeDelete;

let geoShapesPromise : Promise<IdMap<GeoShape>> | null = null;

export const geoShapesGet: ActionThunk<Promise<IdMap<GeoShape>>, MCAGeoShapesAdd> = () => (dispatch) => {
    if (!geoShapesPromise) {
        geoShapesPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : GeoShapeApi = new GeoShapeApi();
            let user : string = getUser();

            let req : Promise<GeoShape[]> = api.geoshapesGet({username: user});
            req.then((resp:GeoShape[]) => {
                let data : IdMap<GeoShape> = resp.map(parseBoundingBox).reduce(idReducer, {});
                dispatch({ type: GEO_SHAPES_ADD, payload: data});
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET GeoShapes', err)
                reject(err);
            });
        });
    } else {
        debug('All GeoShapes are already in memory or loading');
    }
    return geoShapesPromise;
}

export const geoShapeGet: ActionThunk<Promise<GeoShape>, MCAGeoShapesAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : GeoShapeApi = new GeoShapeApi();
    let req : Promise<GeoShape> = api.geoshapesIdGet({username: user, id: id});
    req.then((resp:GeoShape) => {
        //TODO: add bbox
        dispatch({
            type: GEO_SHAPES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET GeoShapes', err);
    });
    return req;
}

export const geoShapePost: ActionThunk<Promise<GeoShape>, MCAGeoShapesAdd> = (geoShape:GeoShape) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', geoShape);
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let req = api.geoshapesPost({user: user, geoShape: geoShape})
        req.then((resp:GeoShape) => {
            debug('Response for POST:', resp);
            dispatch({
                type: GEO_SHAPES_ADD,
                payload: createIdMap(resp)
            });
        });
        req.catch((err) => {
            console.error('Error on POST GeoShape', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('GeoShape error'));
    }
}

export const geoShapePut: ActionThunk<Promise<GeoShape>, MCAGeoShapesAdd> = ( geoShape: GeoShape ) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', geoShape);
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let id : string = getIdFromUri(geoShape.id);
        let req : Promise<GeoShape> = api.geoshapesIdPut({id: id, user: user, geoShape: geoShape});
        req.then((resp:GeoShape) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: GEO_SHAPES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT GeoShape', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const geoShapeDelete: ActionThunk<void, MCAGeoShapeDelete> = ( geoShape: GeoShape ) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', geoShape);
        let api : GeoShapeApi = new GeoShapeApi(cfg);
        let id : string = getIdFromUri(geoShape.id);
        let req : Promise<void> = api.geoshapesIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: GEO_SHAPE_DELETE,
                uri: geoShape.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE GeoShape', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
