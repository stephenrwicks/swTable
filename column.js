import { columnToTable } from './weakMaps.js';
export { Column, BuiltInColumn };
class Column {
    th = document.createElement('th');
    summaryTd = document.createElement('td');
    col = document.createElement('col');
    colId = crypto.randomUUID();
    sortOrder = -1;
    constructor(settings) {
        const thButton = document.createElement('button');
        const span = document.createElement('span');
        const icon = document.createElement('div');
        icon.className = 'sw-table-icon sw-table-chevron';
        thButton.type = 'button';
        thButton.classList.add('sw-table-button');
        thButton.append(span, icon);
        this.th.append(thButton);
        this.th.scope = 'col';
        this.th.classList.add('sw-table-th');
        this.th.dataset.isAscending = 'false';
        this.th.dataset.isCurrentSort = 'false';
        this.th.dataset.id = this.colId;
        this.col.dataset.id = this.colId;
        //this.isReactive = typeof settings.isReactive === 'boolean' ? settings.isReactive : true;
        this.#render = typeof settings.render === 'function' ? settings.render : null;
        this.#summary = typeof settings.summary === 'function' ? settings.summary : null;
        if (typeof settings.sortBy === 'undefined')
            settings.sortBy = 'auto';
        this.sortBy = settings.sortBy;
        this.name = settings.name ?? '';
        this.th.draggable = true;
        this.summaryTd.classList.add('sw-table-col-summary-td');
        //if (typeof settings.width === 'string') this.col.style.width = settings.width;
        this.th.addEventListener('dragstart', (e) => {
            const table = this.#table;
            if (!table)
                return;
            // Make the dragged column as wide as the widest column. Prevents flickering
            const largestWidth = table.columns
                .filter(col => col.isShowing)
                .map(col => parseFloat(getComputedStyle(col.th).width))
                .reduce((max, width) => Math.max(max, width), 0);
            this.th.style.width = `${largestWidth}px`;
            this.th.classList.add('sw-table-dragging');
            e.dataTransfer.setDragImage(document.createElement('div'), 0, 0); // Hides default drag placeholder
            table.element.dataset.dragColId = this.colId; // Use table dataset to track dragged col
            this.cellsCurrentPage.forEach(td => td.classList.add('sw-table-dragging'));
        });
        this.th.addEventListener('dragover', (e) => {
            e.preventDefault();
            const colId = this.#table.element.dataset.dragColId;
            if (colId === this.colId)
                return;
            const draggingColumn = this.#table?.columnsObject[colId];
            if (!draggingColumn)
                return;
            draggingColumn.moveTo(this.sortOrder);
        });
        this.th.addEventListener('dragend', (e) => {
            if (!this.#table)
                return;
            e.preventDefault();
            delete this.#table.element.dataset.dragColId;
            this.th.classList.remove('sw-table-dragging');
            this.th.style.width = '';
            this.cellsCurrentPage.forEach(td => td.classList.remove('sw-table-dragging'));
        });
        // Bug in chrome, I think drag is conflicting with hover highlight
        // this.th.addEventListener('mouseover', () => {
        //     this.th.style.backgroundColor = 'var(--color2)';
        //     this.cells.forEach(el => el.style.backgroundColor = 'var(--color2)');
        // });
        // this.th.addEventListener('mouseout', () => {
        //     this.th.style.backgroundColor = '';
        //     this.cells.forEach(el => el.style.backgroundColor = '');
        // });
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
            // We get here when the render function of a column is changed post-init
            // Probably a cheaper way to do this. Can we target down the cells only?
            row.render();
        }
    }
    #summary;
    get summary() {
        return this.#summary;
    }
    set summary(fn) {
        this.#summary = typeof fn === 'function' ? fn : null;
        const table = this.#table;
        if (!table)
            return;
        this.#table._renderSummaries();
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
            return [];
        return this.#table.rows.map((row) => row.cells[this.colId]);
    }
    get cellsCurrentPage() {
        if (!this.#table)
            return [];
        return this.#table.rowsCurrentPage.map((row) => row.cells[this.colId]);
    }
    moveLeft() {
        return this.moveTo(this.sortOrder - 1);
    }
    moveRight() {
        return this.moveTo(this.sortOrder + 1);
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
        for (const col of table.columns) {
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
        }
        ;
        table.renderColumnTr();
        for (const row of table.rows)
            row.render();
        return this.sortOrder;
    }
    destroy() {
        if (!this.#table)
            return;
        for (const td of this.cells ?? []) {
            td.remove();
        }
        this.#table.columnsObject[this.colId] = null;
        columnToTable.delete(this);
        this.col.remove();
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
        this.th.querySelector('button').onclick = isSortable ? () => this.sort() : null;
        //this.th.querySelector('button')!.disabled = !isSortable;
        this.th.dataset.isSortable = String(isSortable);
        // Re-sort if we are already sorted by this column
        if (this.#isCurrentSort)
            this.sort(this.#isAscending);
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
            // Sort by custom function
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
    isShowing = true;
    show() {
        if (this.isShowing)
            return;
        this.isShowing = true;
        this.#table.renderColumnTr();
        for (const row of this.#table.rows)
            row.render();
    }
    hide() {
        if (!this.isShowing)
            return;
        this.isShowing = false;
        this.#table.renderColumnTr();
        for (const row of this.#table.rows)
            row.render();
    }
    toggle() {
        if (this.isShowing)
            this.hide();
        else
            this.show();
    }
}
class BuiltInColumn {
    th = document.createElement('th');
    colId;
    col = document.createElement('col');
    constructor(type) {
        this.colId = type;
        this.th.classList.add('sw-table-th-built-in', `sw-table-th-built-in-${type}`);
        this.col.dataset.id = this.colId;
    }
}
