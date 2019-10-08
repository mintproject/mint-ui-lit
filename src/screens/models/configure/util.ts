import { html } from 'lit-element';

export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const getId = (resource) => {
    return resource.id.split('/').pop();
}

export const createUrl = (model, version?, config?, setup?) => {
    let url = 'models/configure/' + getId(model);
    if (version) {
        url += '/' + getId(version);
        if (config) {
            url += '/' + getId(config);
            if (setup) {
                url += '/' + getId(setup);
            }
        }
    }
    return url;
}

export const sortByPosition = (a,b) => {
    let intA = Number(a.position);
    let intB = Number(b.position);
    return (intA < intB) ? -1 : (intA > intB? 1 : 0);
}

export const renderExternalLink = (uri, label?) => {
    return html`<a target='_blank' href="${uri}">${label? label : uri}</a>`
}

export const renderParameterType = (param) => {
    let ptype = param.type.filter(p => p != 'Parameter').map(uri => uri.split('#').pop())
    return html`
        ${ptype} ${param.hasDataType ? html`(<span class="monospaced">${param.hasDataType}</span>)` : ''}
        ${(param.hasMinimumAcceptedValue || param.hasMaximumAcceptedValue) ?
            html`<br/><span style="font-size: 11px;">Range is from ${param.hasMinimumAcceptedValue} to ${param.hasMaximumAcceptedValue}</span>` : '' }
    `
}
