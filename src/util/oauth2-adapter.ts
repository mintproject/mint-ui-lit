import { User } from "app/reducers";
import { MINT_PREFERENCES } from "config";

interface TokenBasic {
  expires_at: string;
  expires_in: number;
  jti: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
  session_state: string;
  "not-before-policy": number;
}

interface TokenResponse {
  access_token: {
    access_token: string;
  } & Partial<TokenBasic>;
  refresh_token?: {
    refresh_token: string;
  } & Partial<TokenBasic>;
}

interface TapisTokenResponse {
  message: string;
  metadata: any;
  result: TokenResponse;
  status: string;
  version: string;
}

interface keycloakProfile {
  region: string;
  graph: string;
}

interface decodedToken {
  sub: string;
  email: string;
  profile: keycloakProfile;
  preferred_username: string;
}

export class OAuth2Adapter {
  private static server: string = MINT_PREFERENCES.auth.server;
  private static clientId: string = MINT_PREFERENCES.auth.clientId;
  private static tokenEndpoint: string = MINT_PREFERENCES.auth.token;
  private static authEndpoint: string = MINT_PREFERENCES.auth.auth;
  private static logoutEndpoint: string = MINT_PREFERENCES.auth.logout;
  private static callbackUrl: string = `${window.location.origin}/oauth2/callback`;
  // user data
  private static username: string;
  private static userid: string;
  private static email: string;
  private static region: string;
  private static graph: string;
  // Token
  private static accessToken: string | undefined = undefined;
  private static refreshToken: string | undefined = undefined;
  private static accessExpiresAt: Date | undefined = undefined;
  private static refreshExpiresAt: Date | undefined = undefined;
  private static refreshPromise;

  public static getTokenURL(): string {
    return OAuth2Adapter.server + OAuth2Adapter.tokenEndpoint;
  }

  public static getAuthURL(): string {
    return OAuth2Adapter.server + OAuth2Adapter.authEndpoint;
  }

  public static getLogoutURL(): string {
    return OAuth2Adapter.server + OAuth2Adapter.logoutEndpoint;
  }

  public static authorize(type?: "token" | "code"): void {
    // If we are using tapis, we need a hash value to use the code grant, otherwise use token
    if (
      !type &&
      MINT_PREFERENCES.auth.provider === "tapis" &&
      !MINT_PREFERENCES.auth.hash
    ) {
      type = "token";
    } else {
      type = "code";
    }
    const query = new URLSearchParams({
      client_id: OAuth2Adapter.clientId,
      response_type: type,
      redirect_uri: OAuth2Adapter.callbackUrl,
    });
    document.location = OAuth2Adapter.getAuthURL() + "?" + query.toString();
  }

  public static handleCallback(): void {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop.toString()),
    });
    const token = params["access_token"];
    const expires = params["expires_in"];
    const code = params["code"];
    console.log(params);

    /* This depends of the authorization type used. 'Token' generates one jwt-token
     * 'Code' generates a code to use on next requests */
    if (token) {
      console.log("Token detected.");
      OAuth2Adapter.saveTokenResponse(token, expires);
      window.location.href = "/";
    } else if (code) {
      console.log("Code detected");
      OAuth2Adapter.fromCode(code);
    }
  }

  public static fromCode(code: string): void {
    const body = {
      grant_type: "authorization_code",
      redirect_uri: OAuth2Adapter.callbackUrl,
      code: code,
    };
    let headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (MINT_PREFERENCES.auth.provider === "tapis") {
      headers["Authorization"] = "Basic " + MINT_PREFERENCES.auth.hash;
    } else {
      body["client_id"] = OAuth2Adapter.clientId;
    }

    fetch(OAuth2Adapter.getTokenURL(), {
      method: "POST",
      headers,
      body: new URLSearchParams(body).toString(),
    }).then((resp) => {
      if (resp.ok) {
        resp.json().then((data) => {
          if (MINT_PREFERENCES.auth.provider === "tapis") {
            OAuth2Adapter.saveTapisCodeResponse(data);
          } else if (MINT_PREFERENCES.auth.provider === "keycloak") {
            OAuth2Adapter.saveKeycloakCodeResponse(data);
          } else {
            OAuth2Adapter.saveCodeResponse(data);
          }
        });
      } else {
        alert("Invalid authentication code, please try again");
        window.location.href = "/";
      }
    });
  }

  private static setLocalStorage(obj: Partial<TokenResponse>): void {
    if (obj.access_token.access_token) {
      localStorage.setItem("access-token", obj.access_token.access_token);
    } else {
      localStorage.removeItem("access-token");
    }
    if (obj.refresh_token && obj.refresh_token.refresh_token) {
      localStorage.setItem("refresh-token", obj.refresh_token.refresh_token);
    } else {
      localStorage.removeItem("refresh-token");
    }
    if (obj.access_token.expires_at) {
      localStorage.setItem("access-expires-at", obj.access_token.expires_at);
    } else if (obj.access_token.expires_in) {
      try {
        let now = new Date();
        now.setSeconds(now.getSeconds() + obj.access_token.expires_in);
        localStorage.setItem("access-expires-at", now.toISOString());
      } catch (error) {
        console.warn("Error getting access expires at");
      }
    } else {
      localStorage.removeItem("access-expires-at");
    }
    if (obj.refresh_token && obj.refresh_token.expires_at) {
      localStorage.setItem("refresh-expires-at", obj.refresh_token.expires_at);
    } else if (obj.refresh_token && obj.refresh_token.expires_in) {
      try {
        let now = new Date();
        now.setSeconds(now.getSeconds() + obj.refresh_token.expires_in);
        localStorage.setItem("refresh-expires-at", now.toISOString());
      } catch (error) {
        console.warn("Error getting access expires at");
      }
    } else {
      localStorage.removeItem("refresh-expires-at");
    }
  }

  private static clearLocalStorage(): void {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
    localStorage.removeItem("access-expires-at");
    localStorage.removeItem("refresh-expires-at");
  }

  //TODO, maybe check the refresh token on open?
  public static loadFromLocalStorage(): boolean {
    let now: Date = new Date();
    let accessToken: string = localStorage.getItem("access-token");
    let refreshToken: string = localStorage.getItem("refresh-token");
    let accessExpiresAt: string = localStorage.getItem("access-expires-at");
    let refreshExpiresAt: string = localStorage.getItem("refresh-expires-at");
    let accessExpires: Date | undefined = accessExpiresAt
      ? new Date(accessExpiresAt)
      : undefined;
    let refreshExpires: Date | undefined = refreshExpiresAt
      ? new Date(refreshExpiresAt)
      : undefined;

    // Reason to log out:
    if (
      !accessToken ||
      !accessExpires ||
      (!refreshExpires && accessExpires < now) ||
      refreshExpires < now
    ) {
      if (accessToken || accessExpires || refreshToken || refreshExpires) {
        OAuth2Adapter.clearLocalStorage();
      }
      return false;
    } else {
      OAuth2Adapter.accessToken = accessToken;
      OAuth2Adapter.decodeToken(accessToken);
      OAuth2Adapter.accessExpiresAt = accessExpires;
      if (refreshToken && refreshExpiresAt) {
        OAuth2Adapter.refreshToken = refreshToken;
        OAuth2Adapter.refreshExpiresAt = refreshExpires;
      }
      // Token is working, refresh 1 minutes before expiration.
      let untilExpiration = accessExpires.getTime() - now.getTime() - 60000;
      if (untilExpiration < 0) untilExpiration = 0;

      //console.log("Until refresh: " + untilExpiration/1000);
      if (OAuth2Adapter.refreshPromise)
        clearTimeout(OAuth2Adapter.refreshPromise);
      OAuth2Adapter.refreshPromise = setTimeout(() => {
        OAuth2Adapter.refresh();
      }, untilExpiration);
      return true;
    }
  }

  private static decodeToken(token: string): void {
    //Decode token
    let decoded: decodedToken = JSON.parse(atob(token.split(".")[1]));
    //console.log("decoded token:\n", decoded);

    OAuth2Adapter.username =
      decoded["preferred_username"] ||
      decoded["tapis/username"] ||
      decoded["name"];
    OAuth2Adapter.userid = decoded["sub"];
    OAuth2Adapter.email = decoded["email"] || decoded["sub"];
    if (decoded["profile"]) {
      OAuth2Adapter.region = decoded["profile"]["region"] || undefined;
      OAuth2Adapter.graph = decoded["profile"]["graph"] || undefined;
    } else {
      OAuth2Adapter.region = undefined;
      OAuth2Adapter.graph = undefined;
    }
  }

  public static saveTokenResponse(tkn: string, expires_in: string): void {
    OAuth2Adapter.setLocalStorage({
      access_token: { access_token: tkn, expires_in: Number(expires_in) },
    });
    OAuth2Adapter.loadFromLocalStorage();
  }

  private static saveCodeResponse(tokenObj: TokenResponse) {
    OAuth2Adapter.setLocalStorage(tokenObj);
    OAuth2Adapter.loadFromLocalStorage();
    if (window.location.href.includes("callback")) {
      window.location.href = "/";
    }
    return;
  }

  private static saveTapisCodeResponse(tokenObj: TapisTokenResponse) {
    if (tokenObj.result) return OAuth2Adapter.saveCodeResponse(tokenObj.result);
  }

  private static saveKeycloakCodeResponse(tokenObj: KeycloakTokenResponse) {
    let tkn: TokenResponse = {
      access_token: {
        access_token: tokenObj.access_token,
        expires_in: tokenObj.expires_in,
      },
      refresh_token: {
        refresh_token: tokenObj.refresh_token,
        expires_in: tokenObj.refresh_expires_in,
      },
    };
    return OAuth2Adapter.saveCodeResponse(tkn);
  }

  public static getAccessToken() {
    if (OAuth2Adapter.accessToken) return OAuth2Adapter.accessToken;
    return undefined;
  }

  public static getAccessTokenHeader() {
    if (OAuth2Adapter.accessToken)
      return { Authorization: "Bearer " + OAuth2Adapter.accessToken };
    return undefined;
  }

  public static getUser(): User {
    return {
      email: OAuth2Adapter.username,
      uid: OAuth2Adapter.userid,
      region: OAuth2Adapter.region,
      graph: OAuth2Adapter.graph,
    } as User;
  }

  public static logOut(): void {
    if (MINT_PREFERENCES.auth.provider === "keycloak") {
      const query = new URLSearchParams({
        client_id: OAuth2Adapter.clientId,
        post_redirect_uri: OAuth2Adapter.callbackUrl,
      });
      // FIXME: this does not redirect, cleaning the local storage before redirection as a quick fix
      OAuth2Adapter.clearLocalStorage();
      document.location = OAuth2Adapter.getLogoutURL() + "?" + query.toString();
    } else {
      const body = {
        token: OAuth2Adapter.refreshToken || OAuth2Adapter.accessToken,
      };
      let headers = { "Content-Type": "application/json" };
      if (
        MINT_PREFERENCES.auth.provider === "tapis" &&
        MINT_PREFERENCES.auth.hash
      ) {
        headers["Authorization"] = "Basic " + MINT_PREFERENCES.auth.hash;
      }
      fetch(OAuth2Adapter.getLogoutURL(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
        .then((resp) => {
          if (!resp.ok) console.warn("Logout process complete with errors.");
        })
        .finally(() => {
          OAuth2Adapter.clearLocalStorage();
          //window.location.href = '/';
        });
    }
  }

  public static refresh(): Promise<boolean> {
    OAuth2Adapter.refreshPromise = undefined;
    if (!OAuth2Adapter.refreshToken) {
      OAuth2Adapter.clearLocalStorage();
      console.warn("Refresh token not found");
      return;
    }

    let data = {
      client_id: OAuth2Adapter.clientId,
      grant_type: "refresh_token",
      refresh_token: OAuth2Adapter.refreshToken,
    };

    let headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + MINT_PREFERENCES.auth.hash,
    };
    if (
      MINT_PREFERENCES.auth.provider === "tapis" &&
      MINT_PREFERENCES.auth.hash
    ) {
      headers["Authorization"] = "Basic " + MINT_PREFERENCES.auth.hash;
    }

    return new Promise<boolean>((resolve, reject) => {
      let req: Promise<Response> = fetch(OAuth2Adapter.getTokenURL(), {
        method: "POST",
        headers: headers,
        body: new URLSearchParams(data),
      });
      req.catch(reject);
      req.then((response: Response) => {
        if (response.status === 200) {
          response.json().then((tkn) => {
            if (MINT_PREFERENCES.auth.provider === "tapis") {
              OAuth2Adapter.saveTapisCodeResponse(tkn);
            } else if (MINT_PREFERENCES.auth.provider === "keycloak") {
              OAuth2Adapter.saveKeycloakCodeResponse(tkn);
            } else {
              OAuth2Adapter.saveCodeResponse(tkn);
            }
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  public static signIn(username: string, password: string) {
    // Implicit grant
    let uri: string = OAuth2Adapter.getTokenURL();
    let data = {
      client_id: OAuth2Adapter.clientId,
      grant_type: "password",
      username: username,
      password: password,
    };

    return new Promise<void>((resolve, reject) => {
      let req: Promise<Response> = fetch(uri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data),
      });
      req.catch(reject);
      req.then((response: Response) => {
        if (response.status === 200) {
          let jsn = response.json();
          jsn.catch(reject);
          jsn.then((tkn) => {
            if (MINT_PREFERENCES.auth.provider === "tapis") {
              OAuth2Adapter.saveTapisCodeResponse(tkn);
            } else if (MINT_PREFERENCES.auth.provider === "keycloak") {
              OAuth2Adapter.saveKeycloakCodeResponse(tkn);
            } else {
              OAuth2Adapter.saveCodeResponse(tkn);
            }
            resolve();
          });
        } else {
          reject();
        }
      });
    });
  }
}
