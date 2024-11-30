import { css } from './css.js';
import { icons } from './icons.js';
import { Row } from './row.js';
import { columnToTable } from './weakMaps.js';
export { Column, ColumnSettings, BuiltInColumn, CheckboxColumn };
type ColumnSettings = {
    render: (row: Row) => Element | string;
    name?: string;
    sortBy?: ((row: Row) => string | number) | 'auto'; // Could also be by 'key' string but 'auto' could be a key
    isReactive?: boolean; // Not working yet

}


class Column {

    th = document.createElement('th');
    colId = crypto.randomUUID();
    sortOrder = -1;

    constructor(settings: ColumnSettings) {
        const thButton = document.createElement('button');
        const span = document.createElement('span');
        const chevron = icons.chevron();
        thButton.type = 'button';
        thButton.classList.add(css.button);
        thButton.append(span, chevron);
        this.th.append(thButton);
        this.th.dataset.isAscending = 'false';
        this.th.dataset.isCurrentSort = 'false';
        //this.isReactive = typeof settings.isReactive === 'boolean' ? settings.isReactive : true;
        this.#render = typeof settings.render === 'function' ? settings.render : null;
        if (typeof settings.sortBy === 'undefined') settings.sortBy = 'auto';
        this.sortBy = settings.sortBy;
        this.name = settings.name ?? '';

    }

    addHoverEffect(color: string) {
        this.th.addEventListener('mouseover', () => {
            this.th.style.backgroundColor = color;
            for (const cell of this.cellsCurrentPage ?? []) cell.style.backgroundColor = color;
        });
        this.th.addEventListener('mouseout', () => {
            this.th.style.backgroundColor = '';
            for (const cell of this.cellsCurrentPage ?? []) cell.style.backgroundColor = '';
        });
    }

    // #isReactive = true;
    // get isReactive() {
    //     return this.#isReactive;
    // }

    // set isReactive(bool: boolean) {
    //     this.#isReactive = !!bool;
    // }

    get #table() {
        return columnToTable.get(this);
    }

    // get index() {
    //     if (!this.#table) return -1;
    //     return this.#table.columns.indexOf(this);
    // }

    // get i() {
    //     if (!this.#table) return -1;
    //     return [...this.#table.element.querySelectorAll('thead tr th')].indexOf(this.th);
    // }

    #render: ColumnSettings['render'] | null;
    get render() {
        return this.#render;
    }
    set render(fn: ColumnSettings['render'] | null) {
        this.#render = typeof fn === 'function' ? fn : null;
        const table = this.#table;
        if (!table) return;

        for (const row of table.rows) {
            // Probably a cheaper way to do this
            row.render();
        }
    }

    #name = '';
    get name() {
        return this.#name;
    }
    set name(name: string) {
        this.#name = name;
        this.th.querySelector('button span')!.textContent = this.#name;
    }

    get cells() {
        if (!this.#table) return null;
        return this.#table.rows.map(row => row.cells[this.colId]) as Array<HTMLTableCellElement>;
    }

    get cellsCurrentPage() {
        if (!this.#table) return null;
        return this.#table.rowsCurrentPage.map(row => row.cells[this.colId]) as Array<HTMLTableCellElement>;
    }

    moveTo(i: number) {
        if (!this.#table) return;
        const x = this.#table.columns.find(col => col.sortOrder === i);
        if (x) x.sortOrder--;
        this.sortOrder = i;
        this.#table.renderColumnTr();
        for (const row of this.#table.rows) row.render();
    }

    destroy() {
        if (!this.#table) return;
        for (const td of this.cells ?? []) {
            td.remove();
        }
        this.#table.columnsObject[this.colId] = null;
        columnToTable.delete(this);
        this.th.remove();
        this.th = null as any;
    }

    #sortBy: ColumnSettings['sortBy'] | null = null;
    get sortBy() {
        return this.#sortBy;
    }
    set sortBy(fn: ColumnSettings['sortBy'] | null) {
        const isSortable = typeof fn === 'function' || fn === 'auto';
        if (isSortable) {
            this.#sortBy = fn;
        }
        else {
            this.#sortBy = null;
        }
        // Re-sort if we are already sorted by this column
        this.th.querySelector('button')!.onclick = isSortable ? () => this.sort() : null;
        this.th.querySelector('button')!.disabled = !isSortable;
        this.th.dataset.isSortable = String(isSortable);
    }

    #isAscending = false;
    #isCurrentSort = false;
    sort(ascending: boolean = !this.#isAscending) {
        if (!this.#sortBy) return;
        if (!this.#table) return;
        for (const column of this.#table.columns) {
            column.#isCurrentSort = false;
            column.#isAscending = false;
            column.th.dataset.isAscending = 'false';
            column.th.dataset.isCurrentSort = 'false';
        }
        this.#table.rows.sort((a, b) => {
            if (this.#sortBy === 'auto') {
                // Automatically sort by the render function
                if (!this.#render) throw new Error('swTable - auto sorting');
                let aVal = this.#render!(a);
                let bVal = this.#render!(b);
                // Convert element or number to string
                aVal = aVal instanceof HTMLElement ? aVal.innerText : String(aVal);
                bVal = bVal instanceof HTMLElement ? bVal.innerText : String(bVal);
                return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            // Sort by custom parameter
            const aVal = String(this.#sortBy!(a));
            const bVal = String(this.#sortBy!(b));
            return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        this.#isAscending = !!ascending;
        this.#isCurrentSort = true;
        this.th.dataset.isAscending = String(this.#isAscending);
        this.th.dataset.isCurrentSort = String(this.#isCurrentSort);
        this.#table.goToPage(1);
    }
}

class BuiltInColumn {
    th = document.createElement('th');
    colId: string;
    constructor(type: 'detail' | 'actions' | 'checkbox') {
        this.colId = type;
    }
    get #table() {
        return columnToTable.get(this);
    }
    destroy() {
        if (!this.#table) return;
        this.#table.columnsObject[this.colId] = null;
        columnToTable.delete(this);
        this.th = null as any;
        // this.#renderTheadTr();
    }
}

class CheckboxColumn extends BuiltInColumn {
    selectAllCheckbox = document.createElement('input');
    constructor() {
        super('checkbox');
        this.selectAllCheckbox.type = 'checkbox';
        this.selectAllCheckbox.classList.add(css.checkbox);
        this.th.append(this.selectAllCheckbox);
    }
}