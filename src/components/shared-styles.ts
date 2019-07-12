/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { css } from 'lit-element';

export const SharedStyles = css`

  :host {
    font-family: "Raleway";
    --font-family-serif: "Raleway";
    --font-family-sans-serif: "Raleway";
    --primary-hue: 224;
    --primary-saturation: 50%;
    font-size: 14px;
    color: #444;
  }

  p {
    color: #666;
  }

  wl-nav {
    --nav-bg: #F0F0F0;
    --nav-color: #232323;
    --nav-height: 50px;
    border-bottom: 1px solid #E6E6E6;
  }   

  wl-button {
    --button-padding: 10px;
    --button-font-size: 12px;
    --button-letter-spacing: 1px;
  }

  wl-button[flat] {
    --button-bg: #444;
    --button-bg-hover: #666;
    --button-bg-active: #444;
  }

  wl-button[outlined] {
    --button-border-outlined: 2px solid #f1951b;
  }

  wl-button.submit {
    --button-bg: #f1951b;
    --button-bg-hover: #ffa52b;
    --button-bg-active: #f1951b;
    --button-border-radius: 3px;
  }

  wl-nav wl-button[flat] {
    --button-bg: #0f7acf;
    --button-bg-hover: #0f7acf;
    --button-bg-active: #0f7acf;
  }

  wl-list-item {
    --list-item-border-radius: 0;
    --list-item-before-margin: 8px;
    border-bottom: 1px solid #F0F0F0;
    font-size: 12px;
    color: #0f7acf;
  }

  wl-title[level="3"] {
    color: #629b30
  }
  wl-title[level="4"] {
    color: #0f7acf
  }

  wl-list-item.active {
    cursor: pointer;
  }

  wl-list-item.heading {
    background: #F0F0F0;
    font-weight: bold;
  }

  wl-title {
    color: #444;
  }

  wl-progress-bar {
    --progress-bar-height: 16px;
    --progress-bar-bg: #EEE;
    --progress-bar-color: green;
  }  

  wl-tooltip {
    font-size: 12px;
    /*
    --tooltip-bg: #06436c;
    --tooltip-color: white;*/
    --tooltip-padding: 6px;
  }

  .leftnav {
    padding: 10px;
    margin-left: 20px;
  }
  .welcome {
    text-align: center;
  }
  .avatar {
    border: 4px solid #0f7acf;
    border-radius: 52px;    
    width: 100px;
    height: 100px;
    object-fit: cover;
    margin: 20px;
    text-align: center;
  }
  .leftnav * {
    color: white;
  }
  .leftnav a:hover {
    color: white;
    background: transparent;
    text-decoration: underline;
  }

  .actionIcon {
    font-size: 16px;
    width: 16px;
    cursor: pointer;
    padding: 2px;
    color: #909090;
  }
  .actionIcon:hover {
    background-color: #0f7acf;
    color: white;
  }
  .actionIcon.deleteIcon:hover {
    background-color: #f17a60;
  }

  a {
    color: #0f7acf;
    text-decoration: none;
  }
  a:hover {
    background-color: #F0F0F0;
    text-decoration: underline;
  }

  a.title {
    color: #444;
  }

  /* Tree view */
  .clt, .clt ul, .clt li {
      /*color: #0f7acf;*/
      position: relative;
  }
  .clt ul li {
      padding: 4px; 
      padding-right: 0px;   
      font-size: 13px;
      font-weight: normal;
  }
  .clt ul li.active {
      color: #0f7acf;
      cursor: pointer;
      font-weight: normal;
  }
  .clt ul li.active:hover,
  .clt ul li.highlighted {
      background-color: #F0F0F0;
  }
  .clt ul li.active:hover .cltmain {
    text-decoration: underline;
  }
  .clt ul li.highlighted .cltmain {
      font-weight: bold;
  }
  .clt ul {
      list-style: none;
      padding-left: 24px;
      margin-top: 0px;
  }
  .cltrow, .cltrow_padded {
    display:flex; 
    align-items: center;
  }
  .cltrow_padded {
    padding: 5px 0px 5px 10px;
  }
  .cltmain {
    flex-grow: 1;
  }
  .clt li::before, .clt li::after {
      content: "";
      position: absolute;
      left: -12px;
  }
  .clt li::before {
      border-top: 1px solid #E0E0E0;
      top: 14px;
      width: 8px;
      height: 0;
  }
  .clt li::after {
      border-left: 1px solid #E0E0E0;
      height: 100%;
      width: 0px;
      top: 7px;
  }
  .clt ul > li:last-child::after {
      height: 8px;
  }
  /* End of Tree View */

  .card {
    margin: 15px;
    left: 0px;
    right: 0px;
    padding: 10px;
    height: calc(100% - 50px);
    background: #FFFFFF;
  }

  .page {
    display: none;
  }

  .page.fullpage[active] {
    height: calc(100% - 50px);
    left: 0px;
    right: 0px;
  }

  .page[active] {
    display: block;
  }

  p {
    margin-top: 5px;
  }

  /* Dialog and Dialog form elements */
  wl-dialog {
    --dialog-bg: #F6F6F6;
    --dialog-color: #444;
    --dialog-header-padding: 15px 20px 0px 20px;
    --dialog-content-padding: 0px 20px 5px 20px;
    --dialog-footer-padding: 20px;
    --dialog-width: 480px;
  }
  wl-dialog.larger {
    --dialog-width: 520px;
  }
  wl-dialog.comparison {
    --dialog-bg: #FFFFFF;
    --dialog-color: #444;
    --dialog-header-padding: 15px 20px 0px 20px;
    --dialog-content-padding: 0px 20px 5px 20px;
    --dialog-footer-padding: 20px;
    --dialog-width: 1000px;
  }
  
  wl-dialog.larger {
    --dialog-width: 520px;
  }

  fieldset.notes, 
  wl-dialog fieldset {
    margin: 0px;
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #D9D9D9;
    border-radius: 5px;
  }
  fieldset.notes legend,
  div.information,
  wl-dialog fieldset legend {
    font-size: 10px;
  }

  fieldset.notes div.notepage,
  fieldset.notes textarea {
    width: calc(100% - 5px);
    height: 150px;
    border: 1px solid #E9E9E9;
    /*font-family: cursive;*/
    font-size:13px;
    color: #666;
  }
  fieldset.notes div.notepage {
    white-space: pre;
    border: 0px;
  }

  fieldset.notes textarea:focus {
    outline: none;
    border-color: #909090;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    padding: 10px;
  }

  .formRow {
    width: 440px;
    display:flex; 
    align-items:center; 
    justify-content: space-between;
  }

  div.caption {
    color: #999;
    font-size: 85%;
  }

  .input_full input {
    width: 100%;
    border: 0px;
    height: 30px;
    color: #444;
    font-size: 13px;
    background-color: transparent;
    border-bottom: 1px solid #D9D9D9;
    padding-bottom: 2px;
    font-weight: bold;
  }
  .input_half input {
    width: 188px;
    display: block;
    background-color: #E9E9E9;
    border: 1px solid #D0D0D0;
    padding: 5px;
    border-radius: 5px;
    color: #393939;
  }
  .input_full input:focus,
  .input_half input:focus {
    outline: none;
    border-color: #909090;
  }
  .input_half select {
    display: block;
    width: 200px;
    border: 1px solid #D0D0D0;
    padding: 5px;
    border-radius: 5px;
    color: #393939;
    height: 30px;
    -moz-appearance: none; 
    -webkit-appearance: none; 
    appearance: none;
    background: url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0ye2ZpbGw6IzQ0NDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmFycm93czwvdGl0bGU+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjEuNDEgNC42NyAyLjQ4IDMuMTggMy41NCA0LjY3IDEuNDEgNC42NyIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIzLjU0IDUuMzMgMi40OCA2LjgyIDEuNDEgNS4zMyAzLjU0IDUuMzMiLz48L3N2Zz4=) no-repeat 95% 50%; 
    background-color: #E9E9E9;
  }
  .input_half select:focus {
    outline: none;
    border-color: #909090;
  }
  .input_full label,
  .input_half label {
    font-weight: bold;
    font-size: 14px;
    padding-bottom: 8px;
    display: block;
  }
  .input_half * {
    font-size: 14px;
  }

  .error input, .error select {
    border-color: red;
  }
  .error input:focus, .error select:focus {
    border-color: maroon;
  }

  /* End of Dialog Form elements */

  .pure-table {
    width: 100%;
    border-collapse: collapse;
  }

  .pure-table {
    empty-cells: show;
    border: 1px solid #f0f0f0
  }

  .pure-table caption {
    color: #000;
    font: italic 85%/1 arial,sans-serif;
    padding: 1em 0;
    text-align: center
  }

  .pure-table td,.pure-table th {
    border-left: 1px solid #f0f0f0;
    border-width: 0 0 0 1px;
    font-size: 13px;
    margin: 0;
    overflow: visible;
    padding: .5em 1em
  }

  .pure-table td:first-child,.pure-table th:first-child {
    border-left-width: 0
  }

  .pure-table thead {
    background-color: #f0f0f0;
    color: #232323;
    text-align: left;
    vertical-align: bottom
  }

  .pure-table td {
    background-color: transparent
  }

  .pure-table-odd td,.pure-table-striped tr:nth-child(2n-1) td {
    background-color: #f6f6f6;
  }

  .pure-table-bordered td {
    border-bottom: 1px solid #f0f0f0
  }

  .pure-table-bordered tbody>tr:last-child>td {
    border-bottom-width: 0
  }

  .pure-table-horizontal td,.pure-table-horizontal th {
    border-width: 0 0 1px;
    border-bottom: 1px solid #cbcbcb
  }

  .pure-table-horizontal tbody>tr:last-child>td {
    border-bottom-width: 0
  }

  /* Pure Table modifications */
  .pure-table {
    border-width: 0px;
  }

  .pure-table thead {
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    background-color: transparent;
    color: #999;
  }

  .pure-table thead th {
    border-left: 0px;
    border-right: 0px;
    padding-top: 10px;
    font-weight: normal;
    font-size: 12px;
  }

  .pure-table tbody td {
    border-left: 0px;
    border-right: 0px;
  }

`;
