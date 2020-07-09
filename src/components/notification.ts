import { customElement, LitElement, property, html, css } from "lit-element";
import { Snackbar } from "weightless/snackbar";
import "weightless/snackbar";

@customElement('custom-notification')
export class CustomNotification extends LitElement {
    @property({type:String}) public icon: string = "error";
    @property({type:String}) public message: string = "Notification text";
    @property({type:Number}) public delay : number = 3000;

    protected render() {
        return html`
        <wl-snackbar id="snackbar" fixed backdrop disableFocusTrap hideDelay="${this.delay}">
            <wl-icon slot="icon">${this.icon}</wl-icon>
            <span>${this.message}</span>
        </wl-snackbar>`;
    }

    public show () {
        let notification : Snackbar = this.shadowRoot.querySelector<Snackbar>("#snackbar")!;
        if(notification) notification.show();
    }

    public hide () {
        let notification : Snackbar = this.shadowRoot.querySelector<Snackbar>("#snackbar")!;
        try {
            if(notification) notification.hide();
        } catch {}
    }

    public error (msg: string) {
        this.icon = "error";
        this.message = msg;
        this.show();
    }

    public save (msg: string) {
        this.icon = "save";
        this.message = msg;
        this.show();
    }

    public custom (msg: string, icon: string) {
        this.icon = icon;
        this.message = msg;
        this.show();
    }

    public setDelay (delay:number) {
        this.delay = delay;
    }
}
