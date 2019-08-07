import { css } from 'lit-element';

export const ExplorerStyles = css`
pre {
    border-radius: 5px;
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border: 1px solid #BCBEC0;
    background: #F1F3F5;
    font:12px Monaco,Consolas,"Andale  Mono","DejaVu Sans Mono",monospace
}

code {
    border-radius: 5px;
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border: 1px solid #BCBEC0;
    padding: 0px 2px;
    font:12px Monaco,Consolas,"Andale  Mono","DejaVu Sans Mono",monospace
}

pre code {
    border-radius: 0px;
    -moz-border-radius: 0px;
    -webkit-border-radius: 0px;
    border: 0px;
    padding: 2px;
    font:12px Monaco,Consolas,"Andale  Mono","DejaVu Sans Mono",monospace
}

.noselect {
      -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
         -khtml-user-select: none; /* Konqueror HTML */
           -moz-user-select: none; /* Firefox */
            -ms-user-select: none; /* Internet Explorer/Edge */
                user-select: none; /* Non-prefixed version, currently
                                      supported by Chrome and Opera */
}

.clickable {
    cursor: pointer;
}
`
