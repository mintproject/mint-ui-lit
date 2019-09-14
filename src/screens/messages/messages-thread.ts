import { customElement, property } from "lit-element";
import { PageViewElement } from "components/page-view-element";
import { PostList } from "./reducers";
import { store } from "app/store";
import { connect } from "pwa-helpers/connect-mixin";

@customElement('messages-thread')
export class MessagesThread extends connect(store)(PageViewElement) {
  @property({type: Object})
  private _list!: PostList;

}