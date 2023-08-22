import { MINT_PREFERENCES } from "config";

interface AirflowResultsConfiguration {
  origin: string;
  email: string;
  thread_id: string;
  graphql_endpoint: string;
  subtask_url: string;
  problem_statement_name: string;
  subtask_name: string;
}

interface AirflowConfiguration {
  conf: AirflowResultsConfiguration;
}

export class AirflowAdapter {
  private static server: string = MINT_PREFERENCES.airflow_api;
  private static dagDownloadThreadId: string =
    MINT_PREFERENCES.airflow_dag_download_thread_id;
  private static _accessToken: string;

  public static setAccessToken(token: string) {
    AirflowAdapter.saveAccessToken(token);
  }

  private static saveAccessToken(token: string) {
    localStorage.setItem("accessToken", token);
    AirflowAdapter._accessToken = token;
  }

  private static getAccessToken(): string {
    if (AirflowAdapter._accessToken) return AirflowAdapter._accessToken;
    let localToken: string = this.getLocalAccessToken();
    if (localToken) {
      AirflowAdapter._accessToken = localToken;
      return localToken;
    }
    throw new Error("Could not get access token");
  }

  private static getLocalAccessToken(): string {
    let accessToken = localStorage.getItem("access-token");
    if (accessToken) return accessToken;
    console.info("No access token on local storage");
    return "";
  }

  public static sendResultsToEmail(
    email: string,
    threadId: string,
    subtask_url: string,
    problem_statement_name: string,
    subtask_name: string
  ): Promise<void> {
    const origin = MINT_PREFERENCES.graphql.endpoint.replace("/v1/graphql", "");
    let conf: AirflowConfiguration = {
      conf: {
        email: email,
        thread_id: threadId,
        graphql_endpoint: "https://" + MINT_PREFERENCES.graphql.endpoint,
        subtask_url: subtask_url,
        problem_statement_name: problem_statement_name,
        subtask_name: subtask_name,
        origin: origin,
      },
    };
    return new Promise<void>((resolve, reject) => {
      let req: Promise<Response> = fetch(
        AirflowAdapter.server +
          "/dags/" +
          AirflowAdapter.dagDownloadThreadId +
          "/dagRuns",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token " + AirflowAdapter.getAccessToken(),
          },
          body: JSON.stringify(conf),
        }
      );
      req.catch(reject);
      req.then((response: Response) => {
        if (response.status === 200) {
          let jsn = response.json();
          jsn.catch(reject);
          jsn.then((tkn) => {
            console.log("Response from airflow", tkn);
            resolve();
          });
        } else {
          reject(response.statusText);
        }
      });
    });
  }
}
