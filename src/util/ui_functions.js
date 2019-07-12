export const showDialog = (id, shadowRoot) => {
    let dialog = shadowRoot.querySelector("#" + id);
    if (dialog)
        dialog.show();
};
export const hideDialog = (id, shadowRoot) => {
    let dialog = shadowRoot.querySelector("#" + id);
    if (dialog)
        dialog.hide();
};
export const showNotification = (id, shadowRoot) => {
    let notification = shadowRoot.querySelector("#" + id);
    if (notification)
        notification.show();
};
export const hideNotification = (id, shadowRoot) => {
    let notification = shadowRoot.querySelector("#" + id);
    if (notification)
        notification.hide();
};
export const resetForm = (form) => {
    Object.keys(form.elements).map((name) => {
        let element = form.elements[name];
        element.value = "";
        element.parentElement.classList.remove("error");
    });
};
const _isEmpty = (input) => {
    if (!input.value) {
        input.parentElement.classList.add("error");
        return true;
    }
    else {
        input.parentElement.classList.remove("error");
    }
    return false;
};
export const formElementsComplete = (form, element_names) => {
    let errors = [];
    element_names.map((name) => {
        let element = form.elements[name];
        errors.push(_isEmpty(element));
    });
    if (errors[0] || errors[1] || errors[2]) {
        return false;
    }
    return true;
};
