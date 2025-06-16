export function getResource(rq: any, withCredentials: boolean, headers?: Record<string, string>) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("GET", rq.url);
  if (headers) {
    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
  }
  xhr.send();
}

function sendData(xhr: XMLHttpRequest, payload: any) {
  xhr.send(payload);
}

interface RequestConfig {
  url: string;
  onLoad: (response: any) => void;
  onError: (error: Error) => void;
}

export async function postJSONResourceModern(
  rq: RequestConfig,
  data: Object,
  withCredentials: boolean,
  headers?: Record<string, string>
) {
  try {
    const response = await fetch(rq.url, {
      method: 'POST',
      credentials: withCredentials ? 'include' : 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    rq.onLoad(result);
    return result;
  } catch (error: unknown) {
    console.error('Failed to send data:', error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    rq.onError(errorObj);
    throw errorObj;
  }
}

export function postJSONResource(
  rq: any,
  data: Object,
  withCredentials: boolean,
  headers?: Record<string, string>
) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", function () {
    if (xhr.status >= 200 && xhr.status < 400) {
      console.log("Data sent successfully.");
      rq.onLoad.call(this);
    } else {
      console.error("Failed to send data:", xhr.statusText);
      rq.onError.call(this);
    }
  });
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("POST", rq.url);
  xhr.setRequestHeader("Content-type", "application/json");
  if (headers) {
    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
  }
  sendData(xhr, JSON.stringify(data));
}

export function putJSONResource(
  rq: any,
  data: Object,
  withCredentials: boolean
) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("PUT", rq.url);
  xhr.setRequestHeader("Content-type", "application/json");
  sendData(xhr, JSON.stringify(data));
}

export function postFormResource(
  rq: any,
  keyvalues: Object,
  withCredentials: boolean
) {
  // Crate form data
  var data = "";
  for (var key in keyvalues) {
    if (data) data += "&";
    data += key + "=" + encodeURIComponent(keyvalues[key]);
  }
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("POST", rq.url);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  sendData(xhr, data);
}

export function deleteResource(rq: any, withCredentials: boolean) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("DELETE", rq.url);
  xhr.send();
}

export async function postJSONResourcePromise(
  url: string,
  data: Object,
  withCredentials: boolean,
  headers?: Record<string, string>
): Promise<any> {
  return await fetch(url, {
    method: 'POST',
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  });
}

export async function getResourcePromise(
  url: string,
  withCredentials: boolean,
  headers?: Record<string, string>
): Promise<any> {
  return await fetch(url, {
    method: 'GET',
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      ...headers
    }
  });
}

export async function putJSONResourcePromise(
  url: string,
  data: Object,
  withCredentials: boolean,
  headers?: Record<string, string>
): Promise<any> {
  return await fetch(url, {
    method: 'PUT',
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  });

}

export async function postFormResourcePromise(
  url: string,
  formData: Record<string, string>,
  withCredentials: boolean,
  headers?: Record<string, string>
): Promise<any> {
  const formBody = new URLSearchParams();
  for (const [key, value] of Object.entries(formData)) {
    formBody.append(key, value);
  }

  return await fetch(url, {
    method: 'POST',
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers
    },
    body: formBody.toString()
  });

}

export async function deleteResourcePromise(
  url: string,
  withCredentials: boolean,
  headers?: Record<string, string>
): Promise<any> {
  return await fetch(url, {
    method: 'DELETE',
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      ...headers
    }
  });
}
