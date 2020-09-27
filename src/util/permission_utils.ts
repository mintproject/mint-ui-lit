import { GraphQL } from "config/graphql";
import { MintEvent, MintPermission } from "screens/modeling/reducers"
import { getCreator } from "./event_utils";

export const getAllUsersPermission = (permissions: MintPermission[]) => {
    let allUsersPermission = {
        read: false, write: false, execute: false, owner: false, userid: "*"
    } as MintPermission;
    permissions.forEach((permission) => {
        if(permission.userid == "*") {
            allUsersPermission = permission;
        }
    });
    return allUsersPermission;
}

export const getUserPermission = (permissions: MintPermission[], events: MintEvent[]) => {
    let userid = GraphQL.userId;
    let creator = getCreator(events);
    if(creator == userid) {
        return {
            read: true, write: true, execute: true, owner: true, userid: creator
        } as MintPermission;
    }
    let userPermission = getAllUsersPermission(permissions);
    permissions.forEach((permission) => {
        if(permission.userid == userid) {
            userPermission = permission;
        }
    });
    return userPermission;
}