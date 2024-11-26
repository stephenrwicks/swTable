import { css } from './css.js';
import { Row } from './row.js';
import { columnToTable } from './weakMaps.js';
export { Column, ColumnSettings };
type ColumnSettings = {
    render: (row: Row) => Element | string;
    name?: string;
    isReactive?: boolean;
    // isSortable?: boolean;
    // sortKey?: string;
    // isEditable?: boolean;
}


class Column {

    th = document.createElement('th');
    colId = this.getUUID();

    constructor(settings: ColumnSettings) {
        this.name = settings.name ?? '';
        this.isReactive = typeof settings.isReactive === 'boolean' ? settings.isReactive : true;
        this.#render = typeof settings.render === 'function' ? settings.render : null;
        this.th.classList.add(css.th);
        this.th.dataset.uuid = this.colId;
    }

    #isReactive = true;
    get isReactive() {
        return this.#isReactive;
    }

    set isReactive(bool: boolean) {
        this.#isReactive = !!bool;
    }

    get #table() {
        return columnToTable.get(this);
    }

    get index() {
        if (!this.#table) return -1;
        return this.#table.columns.indexOf(this);
    }

    #render: ColumnSettings['render'] | null;
    get render() {
        return this.#render;
    }
    set render(fn: ColumnSettings['render'] | null) {
        this.#render = typeof fn === 'function' ? fn : null;
        const table = this.#table;
        if (!table) return;

        for (const row of table.rows) {
            row.renderCells();
        }
    }

    #name = '';
    get name() {
        return this.#name;
    }
    set name(name: string) {
        this.#name = name;
        this.th.textContent = this.#name;
    }

    get cells() {
        if (!this.#table) return null;
        return this.#table.rows.map(row => row.tr.querySelector(`td[data-col-id="${this.colId}"`)) as Array<HTMLTableCellElement>;
    }

    get cellsCurrentPage() {
        if (!this.#table) return null;
        return this.#table.rowsCurrentPage.map(row => row.tr.querySelector(`td[data-col-id="${this.colId}"`)) as Array<HTMLTableCellElement>;
    }

    moveTo(index: number) {
        if (!this.#table) return;
        this.#table.columns.splice(this.#table.columns.indexOf(this), 1);
        this.#table.columns.splice(index, 0, this);

    }

    destroy() {
        for (const td of this.cells ?? []) {
            console.log(td);
            td.remove();
        }
        columnToTable.delete(this);
        this.th.remove();
        this.th = null as any;
    }

    getUUID(): string {
        const uuid = crypto.randomUUID();
        if (!this.#table) return ''; // This doesn't work right now because this is fired before it's bound to table
        if (this.#table?.columns.some(col => col.colId === uuid)) return this.getUUID();
        return uuid;
    }
}