import { css } from "./css";
import { Row } from "./row";

export { Actions, ActionSettings };

type ActionSettings = Array<{
    text: string;
    fn(row: Row): any;
}>

class Actions {

    div = document.createElement('div');

    constructor() {
        this.div.classList.add('sw-table-actions-div')
    }

    render(settings: ActionSettings) {
        this.div.replaceChildren();
    }

}

