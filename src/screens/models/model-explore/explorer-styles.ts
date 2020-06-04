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

.no-decoration, .no-decoration:hover {
    text-decoration: none;
    background-color: unset;
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

b.clickable, span.clickable {
    border-bottom: 1px dotted;
}

.tooltip {
    cursor: help;
    display: inline-block;
    position: relative;
}

.tooltip:hover:after {
    background: #333;
    background: rgba(0, 0, 0, .8);
    border-radius: 5px;
    bottom: 26px;
    color: #fff;
    content: attr(tip);
    right: 20%;
    padding: 5px 15px;
    position: absolute;
    z-index: 98;
    width: 300px;
}

.tooltip:hover:before {
    border: solid;
    border-color: #333 transparent;
    border-width: 6px 6px 0 6px;
    bottom: 20px;
    content: "";
    right: 42%;
    position: absolute;
    z-index: 99;
}

th > span.tooltip {
    margin: 0 0 0 4px;"
    font-size: 14px;
}

th > span.tooltip > wl-icon {
    --icon-size: 14px;
    vertical-align: bottom;
}

span.resource {
    display: inline-block;
    line-height: 1em;
    margin: 0px 3px 3px 0px;
    border-radius: 4px;
    padding: 1px 4px;
}

span.author {
    border: 2px solid cadetblue;
}

span.organization {
    border: 2px solid lightseagreen;
}

span.region {
    border: 2px solid brown;
}

span.process {
    border: 2px solid purple;
}

span.parameter {
    border: 2px solid red;
}

span.time-interval {
    border: 2px solid burlywood;
}

span.grid {
    border: 2px solid teal;
}

span.software-image {
    border: 2px solid darkgray;;
    font: 12px Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace;
}

span.variable-presentation {
    border: 2px solid darkgray;;
    font: 12px Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace;
}

.monospaced {
    font: 12px Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace;
}

.number {
    font-family: helvetica;
}

`
