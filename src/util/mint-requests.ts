export function getResource(rq: any, withCredentials: boolean) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
  xhr.addEventListener("error", rq.onError);
  xhr.withCredentials = withCredentials;
  xhr.open("GET", rq.url);
  xhr.send();
}

function sendData(xhr: XMLHttpRequest, payload: any) {
  xhr.send(payload);
}

export function postJSONResource(
  rq: any,
  data: Object,
  withCredentials: boolean,
  headers?: Record<string, string>
) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", rq.onLoad);
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
