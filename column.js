import { css } from './css.js';
import { icons } from './icons.js';
import { columnToTable } from './weakMaps.js';
export { Column, BuiltInColumn, CheckboxColumn };
class Column {
    th = document.createElement('th');
    colId = crypto.randomUUID();
    sortOrder = -1;
    constructor(settings) {
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
        if (typeof settings.sortBy === 'undefined')
            settings.sortBy = 'auto';
        this.sortBy = settings.sortBy;
        this.name = settings.name ?? '';
        this.th.draggable = true;
        this.th.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setDragImage(document.createElement('div'), 0, 0); // Hides default drag placeholder
            this.#table.element.dataset.dragColId = this.colId; // Use table dataset to track dragged col
            this.th.style.backgroundColor = 'lightblue';
            this.cellsCurrentPage.forEach(td => td.style.backgroundColor = 'lightblue');
        });
        this.th.addEventListener('dragover', (e) => {
            e.preventDefault();
            // We never actually need to use "drop" if we do this
            const colId = this.#table.element.dataset.dragColId;
            if (colId === this.colId)
                return;
            const draggingColumn = this.#table?.columnsObject[colId];
            if (!draggingColumn)
                return;
            draggingColumn.moveTo(this.sortOrder);
        });
        this.th.addEventListener('dragend', (e) => {
            e.preventDefault();
            delete this.#table.element.dataset.dragColId;
            this.th.style.backgroundColor = '';
            this.cellsCurrentPage.forEach(td => td.style.backgroundColor = '');
        });
    }
    addHoverEffect(color) {
        this.th.addEventListener('mouseover', () => {
            this.th.style.backgroundColor = color;
            for (const cell of this.cellsCurrentPage ?? [])
                cell.style.backgroundColor = color;
        });
        this.th.addEventListener('mouseout', () => {
            this.th.style.backgroundColor = '';
            for (const cell of this.cellsCurrentPage ?? [])
                cell.style.backgroundColor = '';
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
            row.render();
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
        return this.#table.rowsCurrentPage.map(row => row.cells[this.colId]);
    }
    moveTo(index) {
        const table = this.#table;
        if (!table)
            throw new Error('SwTable - column moveTo');
        if (typeof index !== 'number')
            throw new Error('SwTable - column moveTo');
        if (index < 0)
            index = 0;
        if (index > table.columns.length - 1)
            index = table.columns.length - 1;
        if (this.sortOrder === index)
            return;
        const currentSortOrder = this.sortOrder;
        const targetSortOrder = index;
        table.columns.forEach(col => {
            if (col === this) {
                col.sortOrder = index; // Set the sortOrder for the moved column
            }
            else if (currentSortOrder < targetSortOrder) {
                // Moving forward: Shift columns in the target range back by 1
                if (col.sortOrder > currentSortOrder && col.sortOrder <= targetSortOrder) {
                    col.sortOrder -= 1;
                }
            }
            else {
                // Moving backward: Shift columns in the target range forward by 1
                if (col.sortOrder < currentSortOrder && col.sortOrder >= targetSortOrder) {
                    col.sortOrder += 1;
                }
            }
        });
        table.renderColumnTr();
        for (const row of table.rows)
            row.render();
        // for (const column of table.columns) {
        //     console.log(column.sortOrder);
        // }
    }
    destroy() {
        if (!this.#table)
            return;
        for (const td of this.cells ?? []) {
            td.remove();
        }
        this.#table.columnsObject[this.colId] = null;
        columnToTable.delete(this);
        this.th.remove();
        this.th = null;
    }
    #sortBy = null;
    get sortBy() {
        return this.#sortBy;
    }
    set sortBy(fn) {
        const isSortable = typeof fn === 'function' || fn === 'auto';
        if (isSortable) {
            this.#sortBy = fn;
        }
        else {
            this.#sortBy = null;
        }
        // Re-sort if we are already sorted by this column
        this.th.querySelector('button').onclick = isSortable ? () => this.sort() : null;
        //this.th.querySelector('button')!.disabled = !isSortable;
        this.th.dataset.isSortable = String(isSortable);
    }
    #isAscending = false;
    #isCurrentSort = false;
    sort(ascending = !this.#isAscending) {
        if (!this.#sortBy)
            return;
        if (!this.#table)
            return;
        for (const column of this.#table.columns) {
            column.#isCurrentSort = false;
            column.#isAscending = false;
            column.th.dataset.isAscending = 'false';
            column.th.dataset.isCurrentSort = 'false';
        }
        this.#table.rows.sort((a, b) => {
            if (this.#sortBy === 'auto') {
                // Automatically sort by the render function
                if (!this.#render)
                    throw new Error('swTable - auto sorting');
                let aVal = this.#render(a);
                let bVal = this.#render(b);
                // Convert element or number to string
                aVal = aVal instanceof HTMLElement ? aVal.innerText : String(aVal);
                bVal = bVal instanceof HTMLElement ? bVal.innerText : String(bVal);
                return !!ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            // Sort by custom parameter
            const aVal = String(this.#sortBy(a));
            const bVal = String(this.#sortBy(b));
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
    colId;
    constructor(type) {
        this.colId = type;
    }
    get #table() {
        return columnToTable.get(this);
    }
    destroy() {
        if (!this.#table)
            return;
        this.#table.columnsObject[this.colId] = null;
        columnToTable.delete(this);
        this.th = null;
        // this.#renderTheadTr();
    }
}
class CheckboxColumn extends BuiltInColumn {
    // Select all must determine whether to show,
    // and whether to be checked / indeterminate
    // Only shows when rowsFilterTrue has a checkbox
    selectAllCheckbox = document.createElement('input');
    constructor() {
        super('checkbox');
        this.selectAllCheckbox.type = 'checkbox';
        this.selectAllCheckbox.classList.add(css.checkbox);
        this.th.append(this.selectAllCheckbox);
    }
}
