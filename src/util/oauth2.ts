import { generateCodeVerifier, OAuth2Client } from '@badgateway/oauth2-client';
import { KeycloakAdapter } from './keycloak-adapter';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { store } from 'app/store';
import { FETCH_USER } from 'app/actions';
import { MINT_PREFERENCES } from 'config';


export class OAuth {
    private static server: string = MINT_PREFERENCES.auth.server;
    private static clientId: string = MINT_PREFERENCES.auth.clientId;
    private static tokenEndpoint: string = MINT_PREFERENCES.auth.token;
    private static authEndpoint: string = MINT_PREFERENCES.auth.auth;
    private static discoveryEndpoint: string = MINT_PREFERENCES.auth.discovery;
    private static callbackUrl: string = `${window.location.origin}/oauth2/callback`;

    private static accessToken : string = '';//eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MTQ2NTVmNC0yMzhlLTRmN2EtODU2Ni1hNTk1NzdhNmNmYTciLCJpc3MiOiJodHRwczovL3BvcnRhbHMudGFwaXMuaW8vdjMvdG9rZW5zIiwic3ViIjoiaHZhcmdhc190YWNjQHBvcnRhbHMiLCJ0YXBpcy90ZW5hbnRfaWQiOiJwb3J0YWxzIiwidGFwaXMvdG9rZW5fdHlwZSI6ImFjY2VzcyIsInRhcGlzL2RlbGVnYXRpb24iOmZhbHNlLCJ0YXBpcy9kZWxlZ2F0aW9uX3N1YiI6bnVsbCwidGFwaXMvdXNlcm5hbWUiOiJodmFyZ2FzX3RhY2MiLCJ0YXBpcy9hY2NvdW50X3R5cGUiOiJ1c2VyIiwiZXhwIjoxNzM5ODUwMDg4LCJ0YXBpcy9jbGllbnRfaWQiOiJtaW50LXVpLWRldiIsInRhcGlzL2dyYW50X3R5cGUiOiJpbXBsaWNpdCJ9.dKeD6GFO2uJ4jZlM5B2cL-XP_WZD8QucJ53brkZJghhA8ymoHStsTcxPB99UdfJFlLnUr-yzhmze-9s1dKo0yHUMacjls4zM0dEOPHw5QDIrOOnV9fIqOQha13ELbIpvR5-axqMT3U0xO6u5JiPTlt2C3F1ZFKgC404-mEXu-FRyKoD5Ysjov9UacltV2n_LIDWCLznh6qFtqj-hm3zBP_SZs-7aluNzNG3P5oxJloXPwFbAiInM1WzXYd79XVvyG6YZKJ74y1uGV7YZveWJ7q4ZdZl02xY-DM8bet9JqMKIq_yfEnjpY8CaRfZLSfqsPVQarPtkvn4WChhMO_SanQ';

    public static getTokenURL(): string {
        return OAuth.server + OAuth.tokenEndpoint;
    }

    public static getAuthURL(): string {
        return OAuth.server + OAuth.authEndpoint;
    }

    public static authorize(type: 'token' | 'code'): void {
        const query = new URLSearchParams({
            client_id: OAuth.clientId,
            response_type: type,
            redirect_uri: OAuth.callbackUrl,
        });
        document.location = OAuth.getAuthURL() + '?' + query.toString();
    }

    public static handleCallback () : void {
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop.toString()),
        });
        const token = params['access_token'];
        const expires = params['expires_in'];
        const code = params['code'];
        console.log(params);

        /* This depends of the authorization type used. Token generates one jwt-token
         * code generates a code to use on next requests */
        if (token) {
            console.log("Token detected.");
            OAuth.accessToken = token;
        } else if (code) {
            console.log("Code detected");
            OAuth.fromCode(code);
        }
    }

    public static fromCode (code: string): void {
        const body = {
            "grant_type": "authorization_code",
            "redirect_uri": OAuth.callbackUrl,
            "code": code,
            "client_id": OAuth.clientId,
        }
        let headers = {
            //"Content-Type": "application/json"
            "Content-Type": "application/x-www-form-urlencoded"
        }
        if (MINT_PREFERENCES.auth.provider === 'tapis' && OAuth.accessToken) {
            headers['X-Tapis-Token'] = OAuth.accessToken;
        }

        fetch(OAuth.getTokenURL(), {
            method: "POST",
            headers,
            body: new URLSearchParams(body).toString()
        }).then((resp) => {
            console.log(resp);
        })
    }
}


export const MyOAuthClient = {
    client: new OAuth2Client({
        server: MINT_PREFERENCES.auth.server,
        clientId: MINT_PREFERENCES.auth.clientId,
        tokenEndpoint: MINT_PREFERENCES.auth.token,
        authorizationEndpoint: MINT_PREFERENCES.auth.auth
    }),
    callbackUrl: `${window.location.origin}/oauth2/callback`,
    authorize: () => {
        MyOAuthClient.client.authorizationCode.getAuthorizeUri({
            redirectUri: MyOAuthClient.callbackUrl,
        }).then((url) => {
            document.location = url;
        })
    },
    getTokenFromRedirect: () => {
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop.toString()),
        });
        const code = params['code'];

        MyOAuthClient.client.authorizationCode.getToken({
            code,
            redirectUri: MyOAuthClient.callbackUrl
        }).then((resp) => {
            const accessToken = resp["accessToken"];
            const refreshToken = resp["refreshToken"]
            const expires = resp["expiresAt"]
            console.log(resp);

            KeycloakAdapter.saveOauth2Token(accessToken, Number(expires), refreshToken);
            ModelCatalogApi.setAccessToken(KeycloakAdapter.getAccessToken());
            store.dispatch({
                type: FETCH_USER,
                user: KeycloakAdapter.getUser(),
            });
            setTimeout(() => { window.location.href = '/'; }, 1000)
        });
    },
    signOut: () => {
        KeycloakAdapter.signOut();
        // Should query logout for tapis.
    }
}