import { customElement, LitElement, property, html, css } from "lit-element";

@customElement("loading-dots")
export class LoadingDots extends LitElement {
  static get styles() {
    return [
      css`
        #loading-dots {
          width: var(--width, auto);
          height: var(--height, auto);
        }
      `,
    ];
  }

  protected render() {
    return html`
      <svg
        id="loading-dots"
        version="1.0"
        width="128px"
        height="35px"
        viewBox="0 0 128 35"
        xml:space="preserve"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <g>
          <circle fill="#000" cx="17.5" cy="17.5" r="17.5" />
          <animate
            attributeName="opacity"
            dur="1s"
            begin="0s"
            repeatCount="indefinite"
            keyTimes="0;0.167;0.5;0.668;1"
            values="0.3;1;1;0.3;0.3"
          />
        </g>
        <g>
          <circle fill="#000" cx="110.5" cy="17.5" r="17.5" />
          <animate
            attributeName="opacity"
            dur="1s"
            begin="0s"
            repeatCount="indefinite"
            keyTimes="0;0.334;0.5;0.835;1"
            values="0.3;0.3;1;1;0.3"
          />
        </g>
        <g>
          <circle fill="#000" cx="64" cy="17.5" r="17.5" />
          <animate
            attributeName="opacity"
            dur="1s"
            begin="0s"
            repeatCount="indefinite"
            keyTimes="0;0.167;0.334;0.668;0.835;1"
            values="0.3;0.3;1;1;0.3;0.3"
          />
        </g>
      </svg>
    `;
  }
}
