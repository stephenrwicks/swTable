export { Detail };

class Detail {

    tr = document.createElement('tr');
    #td = document.createElement('td');

    constructor() {
        this.tr.append(this.#td);
        this.tr.classList.add('sw-table-detail-tr');
    }

    render(contents: Element | string, colSpan: number) {
        this.#td.colSpan = colSpan; 
        // colSpan will get messed up. Best really might just be to set to 999
        this.#td.replaceChildren(contents);
    }

}