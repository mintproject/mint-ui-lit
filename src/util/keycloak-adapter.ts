import * as mintConfig from 'config/config.json';
import { MintPreferences, User } from 'app/reducers';

let prefs = mintConfig["default"] as MintPreferences;

interface tokenResponse {
    access_token: string,
    expires_in: number,
    'not-before-policy': number,
    refresh_expires_in: number,
    refresh_token: string,
    scope: string,
    session_state: string,
    token_type: string
};

interface keycloakProfile {
    region: string,
    graph: string,
}

interface decodedToken {
    sub: string,
    email: string,
    profile: keycloakProfile,
    preferred_username: string
}

export class KeycloakAdapter {
    private static server : string = "https://auth.mint.mosorio.dev/auth/";
    private static realm : string = "development";
    private static clientId : string = "MINT-UI";
    // Return values
    private static accessToken : string;
    private static refreshToken : string;
    private static sessionState : string;
    private static expiresIn : number;
    private static refreshExpiresIn : number;
    // user data
    private static username : string;
    private static userid : string;
    private static email : string;
    private static region : string;
    private static graph : string;

    private static getTokenUri () : string {
        return KeycloakAdapter.server + "realms/" + KeycloakAdapter.realm + "/protocol/openid-connect/token";
    }

    private static saveTokenResponse (tkn: tokenResponse) : void {
        KeycloakAdapter.accessToken = tkn.access_token;
        KeycloakAdapter.refreshToken = tkn.refresh_token;
        KeycloakAdapter.sessionState = tkn.session_state;
        KeycloakAdapter.expiresIn = tkn.expires_in;
        KeycloakAdapter.refreshExpiresIn = tkn.refresh_expires_in;
        KeycloakAdapter.setLocalStorage();

        //Decode token
        let decoded : decodedToken = JSON.parse(atob(KeycloakAdapter.accessToken.split(".")[1]));
        KeycloakAdapter.username = decoded.preferred_username;
        KeycloakAdapter.userid = decoded.sub
        KeycloakAdapter.email = decoded.email
        KeycloakAdapter.region = decoded.profile ? decoded.profile.region : undefined;
        KeycloakAdapter.graph = decoded.profile ? decoded.profile.graph : undefined;
    }

    public static signIn (username: string, password:string) : Promise<void> {
        let uri : string = KeycloakAdapter.getTokenUri();
        let data = {
            client_id: KeycloakAdapter.clientId,
            grant_type: "password",
            username: username,
            password: password
        };

        return new Promise<void>((resolve, reject) => {
            let req : Promise<Response> = fetch(uri, {
                method: 'POST',
                headers: {'Content-Type': "application/x-www-form-urlencoded"},
                body: new URLSearchParams(data)
            });
            req.catch(reject);
            req.then((response:Response) => {
                let jsn = response.json();
                jsn.catch(reject);
                jsn.then((tkn:tokenResponse) => {
                    KeycloakAdapter.saveTokenResponse(tkn);
                    resolve();
                })
            });
        });
    }

    public static refresh (token?: string) : Promise<void> {
        let uri : string = KeycloakAdapter.getTokenUri();
        let data = {
            client_id: KeycloakAdapter.clientId,
            grant_type: "refresh_token",
            refresh_token: token ? token : KeycloakAdapter.refreshToken
        }

        return new Promise<void>((resolve, reject) => {
            let req : Promise<Response> = fetch(uri, {
                method: 'POST',
                headers: {'Content-Type': "application/x-www-form-urlencoded"},
                body: new URLSearchParams(data)
            });
            req.catch(reject);
            req.then((response:Response) => {
                if (response.status === 200) {
                    response.json().then((tkn : tokenResponse) => {
                        KeycloakAdapter.saveTokenResponse(tkn);
                        resolve();
                    });
                } else {
                    reject();
                }
            });
        });
    }

    private static setLocalStorage () : void {
        localStorage.setItem('access-token', KeycloakAdapter.accessToken);
        localStorage.setItem('refresh-token', KeycloakAdapter.refreshToken);
    }

    private static clearLocalStorage () : void {
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
    }

    public static signOut () : void {
        KeycloakAdapter.username = undefined;
        KeycloakAdapter.userid = undefined;
        KeycloakAdapter.email = undefined;
        KeycloakAdapter.region = undefined;
        KeycloakAdapter.graph = undefined;

        KeycloakAdapter.accessToken = undefined;
        KeycloakAdapter.refreshToken = undefined;
        KeycloakAdapter.sessionState = undefined;
        KeycloakAdapter.expiresIn = undefined;
        KeycloakAdapter.refreshExpiresIn = undefined;
        KeycloakAdapter.clearLocalStorage();
    }

    public static loadFromLocalStorage () : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let accessToken : string = localStorage.getItem('access-token');
            let refreshToken : string = localStorage.getItem('refresh-token');
            if (accessToken && refreshToken) {
                //Check if access token is still valid, if not, try to refresh.
                if (false) { //KeycloakAdapter.checkToken()) {
                } else {
                    let ref : Promise<void> = KeycloakAdapter.refresh(refreshToken);
                    ref.catch(() => resolve(false));
                    ref.then(() => resolve(true));
                }
            } else {
                resolve(false);
            }
        });
    }

    public static getAccessTokenHeader () {
        if (KeycloakAdapter.accessToken)
            return {'Authorization': "Bearer " + KeycloakAdapter.accessToken};
        return undefined;
    }

    public static getUser () : User {
        return {
            email: KeycloakAdapter.username,
            uid: KeycloakAdapter.userid,
            region: KeycloakAdapter.region,
            graph: KeycloakAdapter.graph
        } as User;
    }

    public static updateProfile (u: User) : void {
        let uri : string = KeycloakAdapter.server + "admin/realms/" + KeycloakAdapter.realm + "/users/" + KeycloakAdapter.userid;
        let data = {
            "attributes": {
                "region": u.region,
                "graph": u.graph
            }
        }
        //FIXME: editing profile requires user role
    }

    public static checkToken () {
        let uri : string = KeycloakAdapter.server + "realms/" + KeycloakAdapter.realm + "/protocol/openid-connect/userinfo";

        let req = fetch(uri, {
            method: 'GET',
            credentials: 'include',
            headers: KeycloakAdapter.getAccessTokenHeader()
        });
        //FIXME: we should be able to verify the token here!
    }
}
