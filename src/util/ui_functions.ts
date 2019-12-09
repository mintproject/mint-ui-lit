import { Snackbar } from "weightless/snackbar";
import { Dialog } from "weightless/dialog";

export const showDialog = (id: string, shadowRoot: ShadowRoot) => {
    let dialog:Dialog = shadowRoot.querySelector<Dialog>("#" + id)!;
    if(dialog)
        dialog.show();
}

export const hideDialog = (id: string, shadowRoot: ShadowRoot) => {
    let dialog:Dialog = shadowRoot.querySelector<Dialog>("#" + id)!;
    if(dialog)
        dialog.hide();
}

export const showNotification = (id: string, shadowRoot: ShadowRoot) => {
    let notification:Snackbar = shadowRoot.querySelector<Snackbar>("#" + id)!;
    if(notification)
        notification.show();
}

export const hideNotification = (id: string, shadowRoot: ShadowRoot) => {
    let notification:Snackbar = shadowRoot.querySelector<Snackbar>("#" + id)!;
    try {
        if(notification)
            notification.hide();
    }
    catch(e) {
        
    }
}

export const resetForm = (form: HTMLFormElement, exclude: any) => {
    Object.keys(form.elements).map((name) => {
        if(exclude && exclude[name]) {
            return;
        }
        let element = (form.elements[name] as HTMLInputElement | HTMLSelectElement);
        element.value = "";
        element.parentElement!.classList.remove("error");
    });
}

const _isEmpty = (input: HTMLInputElement | HTMLSelectElement ) => {
    if(!input.value) {
        input.parentElement!.classList.add("error");
        return true;
    }
    else {
        input.parentElement!.classList.remove("error");
    }
    return false;
}

export const formElementsComplete = (form: HTMLFormElement, element_names: string[]) => {
    let errors:Boolean[] = [];
    element_names.map((name) => {
        let element = (form.elements[name] as HTMLInputElement | HTMLSelectElement);
        if(element) {
            errors.push(_isEmpty(element));
        }
    });
    if(errors[0] || errors[1] || errors[2]) {
        return false;
    }
    return true;
}

export const downloadFile = (content:string, fileName:string, mimeType:string) => {
    let a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([content], { type: mimeType }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
    }
}
