import { customElement, LitElement, property, html, css } from "lit-element";

import { goToPage } from '../app/actions';
import { SharedStyles } from '../styles/shared-styles';
import { showDialog } from "../util/ui_functions";

import "weightless/icon";
import "weightless/dialog";

interface Resource {
    uri: string;
    label: string;
}

export interface GalleryEntry {
    src:        string; //url of the image or video.
    label:      string; //label (title) of this resource.
    desc:       string; //description of the resource.
    thumbnail?: string; //thumbnail, replaces src on preview.
    external?:  string; //external link open new tab.
    source?:    Resource; //source of the image.
}

@customElement('image-gallery')
export class ImageGallery extends LitElement {
    @property({type:Object})
    items: GalleryEntry = [];

    static get styles() {
        return [SharedStyles, css`
            div.gallery {
                margin: 5px;
                border: 1px solid #ccc;
                float: left;
                width: var(--width, 180px);
            }

            div.gallery:hover {
                border: 1px solid #777;
            }

            div.gallery img {
                width: 100%;
                height: auto;
            }

            div.title {
                width: calc(100% - 10px);
                padding: 5px 5px;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap
            }

            .img {
                width:  var(--width, 180px);
                height: var(--height, 100px);
                background-position: 50% 50%;
                background-repeat:   no-repeat;
                background-size:     cover;
            }

            #dialog {
                --dialog-max-width: calc(100vw - 40px);
                --dialog-max-height: calc(100vh - 40px);
                --dialog-width: auto;
                --dialog-height: auto;
                text-align: center;
            }

            #dialog img {
                max-height: calc(100vh - 200px);
            }

            #dialog video {
                max-height: calc(100vh - 200px);
                max-width: 100%;
            }

            #dialog-title {
                margin-bottom: 4px;
                margin-top: 0px;
            }

            .hidden {
                display: none;
            }
        `];
    }

    protected render() {
        return html`
            ${this.items.map((i) => html`
            <div class="gallery">
              <a target="_blank" @click=${()=>{this.openDialog(i)}}>
                <div class="img" style="background-image:url('${i.thumbnail || i.src}');"></div>
              </a>
              <div class="title"><b>${i.label}</b></div>
            </div>
            `)}

            <wl-dialog id="dialog" fixed backdrop blockscrolling>
                <div slot="header">
                    <a id="dialog-external-link" style="float:right;" href="" target="_blank"><wl-icon>open_in_new</wl-icon></a>
                    <h3 id="dialog-title">Sample Visualization</h3>
                    <wl-divider style="margin-bottom: .5em;"></wl-divider>
                </div>
                <div slot="content">
                    <img id="dialog-img" src=""></img>
                    <video class="hidden" id="dialog-video" autoplay loop controls>
                        <source id="dialog-video-src" src="" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <p id="dialog-desc" style="margin-bottom:1em;"></p>
                    <p id="dialog-source">
                        <b>Source:</b>
                        <span id="dialog-source-text"></span>
                        <a id="dialog-source-link" href=""></a>
                    </p>
                </div>
            </wl-dialog>
        `;
    }

    openDialog (entry: GalleryEntry) {
        let external    = this.shadowRoot!.getElementById("dialog-external-link");
        let title       = this.shadowRoot!.getElementById("dialog-title");
        let img         = this.shadowRoot!.getElementById("dialog-img");
        let video       = this.shadowRoot!.getElementById("dialog-video");
        let videoSrc    = this.shadowRoot!.getElementById("dialog-video-src");
        let desc        = this.shadowRoot!.getElementById("dialog-desc");
        let source      = this.shadowRoot!.getElementById("dialog-source");
        let sourceTxt   = this.shadowRoot!.getElementById("dialog-source-text");
        let sourceLink  = this.shadowRoot!.getElementById("dialog-source-link");

        external!['href']    = entry.external || entry.src;
        title!['innerHTML'] = entry.label;
        desc!['innerHTML']  = entry.desc || '';
        if (entry.src.split('.').pop() === 'mp4') {
            videoSrc!['src'] = entry.src;
            video.classList.remove('hidden');
            video.load();
            img.classList.add('hidden');
        } else {
            img!['src'] = entry.src;
            video.classList.add('hidden');
            img.classList.remove('hidden');
        }
        if (entry.source) {
            source.classList.remove('hidden');
            if (entry.source.url) {
                sourceLink!['innerHTML'] = entry.source.label;
                sourceLink!['href'] = entry.source.url;
                sourceLink.classList.remove('hidden');
                sourceTxt.classList.add('hidden');
            } else {
                sourceTxt!['innerHTML'] = entry.source.label;
                sourceTxt.classList.remove('hidden');
                sourceLink.classList.add('hidden');
            }
        } else {
            source.classList.add('hidden');
        }

        showDialog("dialog", this.shadowRoot!);
    }
}
