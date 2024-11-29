import { css } from './css.js';
import { icons } from './icons.js';
import { columnToTable } from './weakMaps.js';
export { Column, BuiltInColumn };
class Column {
    th = document.createElement('th');
    colId = crypto.randomUUID();
    constructor(settings) {
        const thButton = document.createElement('button');
        const span = document.createElement('span');
        const chevron = icons.chevron();
        thButton.type = 'button';
        thButton.classList.add(css.button);
        thButton.append(span, chevron);
        this.th.append(thButton);
        this.isReactive = typeof settings.isReactive === 'boolean' ? settings.isReactive : true;
        this.#render = typeof settings.render === 'function' ? settings.render : null;
        if (typeof settings.sortBy === 'undefined')
            settings.sortBy = 'auto';
        this.sortBy = settings.sortBy;
        //this.th.classList.add(css.th);
        //this.th.dataset.uuid = this.colId;
        this.name = settings.name ?? '';
    }
    #isReactive = true;
    get isReactive() {
        return this.#isReactive;
    }
    set isReactive(bool) {
        this.#isReactive = !!bool;
    }
    get #table() {
        return columnToTable.get(this);
    }
    get index() {
        if (!this.#table)
            return -1;
        return this.#table.columns.indexOf(this);
    }
    #render;
    get render() {
        return this.#render;
    }
    set render(fn) {
        this.#render = typeof fn === 'function' ? fn : null;
        const table = this.#table;
        if (!table)
            return;
        for (const row of table.rows) {
            // Probably a cheaper way to do this
            row.renderCells();
        }
    }
    #name = '';
    get name() {
        return this.#name;
    }
    set name(name) {
        this.#name = name;
        this.th.querySelector('button span').textContent = this.#name;
    }
    get cells() {
        if (!this.#table)
            return null;
        return this.#table.rows.map(row => row.cells[this.colId]);
    }
    get cellsCurrentPage() {
        if (!this.#table)
            return null;
        return this.#table.rowsCurrentPage.map(row => row.tr.querySelector(`td[data-col-id="${this.colId}"`));
    }
    moveTo(index) {
        if (!this.#table)
            return;
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
        this.th = null;
    }
    #sortBy = null;
    get sortBy() {
        return this.#sortBy;
    }
    set sortBy(fn) {
        if (fn === 'auto' || typeof fn === 'function') {
            this.#sortBy = fn;
        }
        else {
            this.#sortBy = null;
        }
        // Re-sort if we are already sorted by this column
        this.th.querySelector('button').onclick = typeof this.#sortBy === 'function' || this.#sortBy === 'auto' ? () => this.sort() : null;
        this.th.dataset.sort = typeof this.#sortBy === 'function' || this.#sortBy === 'auto' ? 'true' : 'false';
    }
    #isCurrentlySortedByThisColumn = false;
    #isAscending = false;
    sort(ascending = !this.#isAscending) {
        if (!this.#sortBy)
            return;
        if (!this.#table)
            return;
        this.#table.rows.sort((a, b) => {
            if (this.#sortBy === 'auto') {
                // Automatically sort by the render function
                if (!this.#render)
                    throw new Error('swTable - auto sorting');
                let aVal = this.#render(a);
                let bVal = this.#render(b);
                if (typeof aVal !== 'object' && typeof bVal !== 'object') {
                    aVal = String(aVal);
                    bVal = String(bVal);
                    return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                if (aVal instanceof HTMLElement && bVal instanceof HTMLElement) {
                    // Render returns element not htmlelement
                    aVal = aVal.innerText;
                    bVal = bVal.innerText;
                    return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                throw new Error('swTable - auto sorting');
            }
            // Sort by custom parameter
            const aVal = String(this.#sortBy(a));
            const bVal = String(this.#sortBy(b));
            return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        // Need to say is currently sorted by this and undo all others
        // this.#isCurrentlySortedByThisColumn = true;
        // undo all others - public property?? this.table.sortCol = this?
        this.#isAscending = !!ascending;
        this.#table.goToPage(1);
    }
}
class BuiltInColumn {
    th = document.createElement('th');
    colId;
    constructor(type) {
        this.colId = type;
    }
    get #table() {
        return columnToTable.get(this);
    }
}
