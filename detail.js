import { css } from "./css.js";
export { Detail };
class Detail {
    tr = document.createElement('tr');
    #td = document.createElement('td');
    constructor() {
        this.tr.append(this.#td);
        this.tr.classList.add(css.detailTr);
    }
    render(contents, colSpan) {
        this.#td.colSpan = colSpan;
        this.#td.replaceChildren(contents);
    }
}
