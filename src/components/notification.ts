import { customElement, LitElement, property, html, css } from "lit-element";
import { Snackbar } from "weightless/snackbar";
import "weightless/snackbar";

@customElement('custom-notification')
export class CustomNotification extends LitElement {
    @property({type:String}) public icon: string = "error";
    @property({type:String}) public message: string = "Notification text";
    @property({type:Number}) public delay : number = 3000;
    @property({type:String}) public buttonName: string = "";
    private buttonFn : any;

    private snackbar: Snackbar;

    protected render() {
        return html`
        <wl-snackbar id="snackbar" fixed backdrop disableFocusTrap hideDelay="${this.delay}">
            ${this.icon ? html`<wl-icon slot="icon">${this.icon}</wl-icon>` : ''}
            ${this.buttonName && this.buttonFn ? html`
                <wl-button @click="${this.buttonFn}" slot="action" flat inverted> ${this.buttonName} </wl-button>
            `:''}
            <span>${this.message}</span>
        </wl-snackbar>`;
    }

    protected updated () {
        if (!this.snackbar) this.snackbar = this.shadowRoot.querySelector<Snackbar>("#snackbar");
    }

    public show () {
        let q = this.snackbar.show();
        q.then(() => {
            this.buttonName = "";
            this.buttonFn = null;
        });
        return q;
    }

    public hide () {
        this.icon = "error";
        this.message = "Notification text";
        this.buttonName = "";
        this.buttonFn = null;
        return this.snackbar.hide();
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

    public custom (msg: string, icon: string, buttonName?: string, buttonFn?: any) {
        this.message = msg;
        this.icon = icon;
        if (buttonName && buttonFn) {
            this.buttonFn = buttonFn;
            this.buttonName = buttonName;
        }
        this.show();
    }

    public setDelay (delay:number) {
        this.delay = delay;
    }
}
