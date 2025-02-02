// Introduce the concept of the Cell class. It seems like maintaining state of every cell is correct
// 
// Figure out data vs $data api
// Paging buttons, paging dropdown - placement?
// Filters, FilterBox, FilterModal -- Use sliders icon - slide-out div overlapping
// show/hide column options
// Fix colspan issues
// CSS Themes and additions, icon hovers
// Horizontal scroll + resizable
// Resizable columns - Programmatically update <col> on drag
// non-reactive columns to allow inputs and stuff to be placed
// Functional actions button disabled


// aria-live

// make dragover have one listener that is applied to the entire table / thead + tbody. locates column to swap

// onRender() callback on row, onDataChange()
// onOpenDetails()

// Introduce the <colgroup> and <col> elements
// Introduce caption element

// Add row button, add row dialog (Would need a create modal built in)
// observable oldvalue newvalue stuff - This is probably not necessary in this context
// Improve column draginsert
// Automatic init
// Init from html
// Preserving focus
// Move / drag row
// Lazy render
// Editable, crud modal, etc.
// Row actions setter

import { Column, ColumnSettings, BuiltInColumn } from './column.js';
import { Row } from './row.js';
import { rowToTable, columnToTable } from './weakMaps.js';
import { ActionSettings } from './actions.js';
export { SwTable, DataObject };

type DataObject = Record<string, unknown>;

type SwTableSettings<T extends DataObject = DataObject> = {
    columns: Array<ColumnSettings<T>>;
    theme?: 'mint' | 'ice';
    data?: Array<T>;
    showSearch?: boolean;
    pageLength?: number;
    pageLengthOptions?: Array<number>;
    draggableColumns?: boolean;
    detailFn?(row: Row<T>): HTMLElement | string | null;
    checkboxFn?(row: Row<T>): boolean;
    actionsFn?(row: Row<T>): ActionSettings<T> | null;
    resizable?: 'both' | 'horizontal' | 'vertical';
}

class SwTable<T extends DataObject = DataObject> {

    #els = {
        wrapper: document.createElement('div'),
        table: document.createElement('table'),
        thead: document.createElement('thead'),
        headerTd: document.createElement('td'),
        headerDiv: document.createElement('div'),
        columnTr: document.createElement('tr'),
        colgroup: document.createElement('colgroup'),
        tbody: document.createElement('tbody'),
        tfoot: document.createElement('tfoot'),
        tfootTr: document.createElement('tr'),
        tfootTd: document.createElement('td'),
        tfootDiv: document.createElement('div'),
        nextPageButton: document.createElement('button'),
        prevPageButton: document.createElement('button'),
        pageNumberDiv: document.createElement('div'),
        pageLengthSelect: document.createElement('select'),
        selectAllCheckbox: document.createElement('input'),
    };

    columnsObject: Record<string, Column<T> | BuiltInColumn | null> = {
        detail: null,
        checkbox: null,
        actions: null
    };

    constructor(settings: SwTableSettings<T>) {
        if (!settings?.columns) throw new Error('SwTable - no columns defined');
        settings.columns.forEach((colSetting, index) => {
            const column = new Column(colSetting);
            column.sortOrder = index;
            columnToTable.set(column, this);
            this.columnsObject[column.colId] = column;
        });

        if (typeof settings.detailFn === 'function') this.detailFn = settings.detailFn;
        if (typeof settings.actionsFn === 'function') this.actionsFn = settings.actionsFn;
        if (typeof settings.checkboxFn === 'function') this.checkboxFn = settings.checkboxFn;
        this.renderColumnTr();

        this.draggableColumns = !!settings.draggableColumns;

        this.pageLengthOptions = settings.pageLengthOptions ?? [0];

        this.pageLength = Array.isArray(this.pageLengthOptions) ? this.pageLengthOptions[0] : 0;

        settings.showSearch ??= true;
        this.showSearch = !!settings.showSearch;

        this.#els.table.append(this.#els.colgroup);

        const headerTr = document.createElement('tr');
        this.#els.headerTd.append(this.#els.headerDiv);
        headerTr.append(this.#els.headerTd);
        this.#els.headerTd.colSpan = 999;
        this.#els.thead.append(headerTr, this.#els.columnTr);
        this.#els.tfootDiv.append(this.#els.pageNumberDiv, this.#els.prevPageButton, this.#els.nextPageButton);
        this.#els.tfootTd.append(this.#els.tfootDiv);
        this.#els.tfootTr.append(this.#els.tfootTd);
        this.#els.tfoot.append(this.#els.tfootTr);
        this.#els.table.append(this.#els.thead, this.#els.tbody, this.#els.tfoot);
        this.#els.wrapper.append(this.#els.table);
        this.#els.headerDiv.classList.add('sw-table-header');
        this.#els.headerTd.classList.add('sw-table-header-td');
        this.#els.table.classList.add('sw-table');
        this.#els.wrapper.classList.add('sw-table-wrapper');
        this.#els.tfootDiv.classList.add('sw-table-tfoot-div');
        this.#els.pageNumberDiv.classList.add('sw-table-page-number-div');
        this.#els.selectAllCheckbox.classList.add('sw-table-checkbox');
        this.#els.pageLengthSelect.classList.add('sw-table-page-length-select');
        this.#els.selectAllCheckbox.title = 'Toggle All';

        this.#els.pageLengthSelect.addEventListener('change', () => this.pageLength = Number(this.#els.pageLengthSelect.value));

        this.#els.table.dataset.swTableTheme = typeof settings.theme === 'string' ? settings.theme : '';
        if (typeof settings.pageLength === 'number') {
            this.pageLength = settings.pageLength;
        }
        else {
            this.goToPage(1);
        }

        this.#els.selectAllCheckbox.type = 'checkbox';
        this.#els.selectAllCheckbox.addEventListener('change', () => this.toggleCheckAllRows());
        this.#els.nextPageButton.type = 'button';
        this.#els.prevPageButton.type = 'button';
        this.#els.nextPageButton.title = 'Next Page';
        this.#els.prevPageButton.title = 'Previous Page';
        this.#els.prevPageButton.className = 'sw-table-button sw-table-prev-page-button sw-table-button-circle';
        this.#els.nextPageButton.className = 'sw-table-button sw-table-next-page-button sw-table-button-circle';
        this.#els.nextPageButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.#els.prevPageButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        const nextIcon = document.createElement('div');
        const prevIcon = document.createElement('div');
        nextIcon.className = 'sw-table-icon sw-table-chevron';
        prevIcon.className = 'sw-table-icon sw-table-chevron';
        this.#els.nextPageButton.append(nextIcon);
        this.#els.prevPageButton.append(prevIcon);

        if (settings.resizable) {
            this.#els.wrapper.style.overflow = 'auto';
            this.#els.wrapper.style.resize = settings.resizable;
        }


        if (Array.isArray(settings.data) && settings.data.length) this.setData(settings.data);

    }



    setData(data: Array<T>) {
        if (!Array.isArray(data)) {
            console.error('setData');
            return;
        }
        this.clearData();
        for (const datum of data) {
            this.insertRow(datum);
        }
        this.goToPage(1);
    }

    clearData() {
        while (this.rows.length) {
            this.rows[0].destroy();
        }
    }

    get $data() {
        return this.rows.map(row => row.$data);
    }

    get data() {
        return this.rows.map(row => row.data);
    }
    get dataSnapshot() {
        return this.rows.map(row => row.dataSnapshot);
    }

    #stateRecords: Record<string, Array<T>> = {};
    saveState(str: string) {
        this.#stateRecords[str] = this.dataSnapshot;
    }
    loadState(str: string) {
        if (!(str in this.#stateRecords)) throw new Error(`SwTable - State ${str} doesn't exist`);
        this.setData(structuredClone(this.#stateRecords[str]));
    }

    get element() {
        return this.#els.wrapper;
    }

    get colSpan(): number {
        return this.#els.columnTr.children.length;
    }

    get columns(): Array<Column<T>> {
        const columnVals = Object.values(this.columnsObject);
        const customCols = columnVals.filter(column => column instanceof Column) as Array<Column<T>>;
        const sortedCustomCols = customCols.sort((a, b) => a.sortOrder - b.sortOrder);
        return sortedCustomCols;
    }

    insertColumn(settings: ColumnSettings<T>, index: number) {
        if (!settings || typeof index !== 'number') throw new Error('SwTable insertColumn');
        const column = new Column(settings);
        column.sortOrder = index;
        columnToTable.set(column, this);
        this.columnsObject[column.colId] = column;
        this.renderColumnTr();
        for (const row of this.rows) row.render();
    }

    #draggableColumns = true;
    get draggableColumns() {
        return this.#draggableColumns;
    }
    set draggableColumns(bool: boolean) {

    }

    #rows: Array<Row<T>> = [];
    get rows() {
        return this.#rows;
    }

    renderPage(targetPage: number) {
        // To optimize, each row could have a "state" object
        for (const row of this.rowsCurrentPage) {

        }
        // Fewer loops
    }

    insertRow(data: T, index?: number): Row<T> {
        const row = new Row<T>();
        rowToTable.set(row, this);
        row.setData(data);
        if (typeof index === 'number' && this.#rows.length) {
            this.#rows[index].tr.before(row.tr);
            this.#rows.splice(index, 0, row);
        }
        else {
            this.#rows.push(row);
            this.#els.tbody.append(row.tr);
        }
        return row;
    }

    // This is where the detailRow is defined
    #detailFn: SwTableSettings<T>['detailFn'] | null = null;
    get detailFn() {
        return this.#detailFn;
    }
    set detailFn(fn: SwTableSettings<T>['detailFn'] | null) {
        this.#detailFn = fn;
        if (typeof this.#detailFn === 'function') {
            this.columnsObject.detail ??= new BuiltInColumn('detail');
        }
        else {
            this.columnsObject.detail?.destroy();
        }
        if (!this.rows.length) return;
        this.renderColumnTr();
        for (const row of this.rows) {
            row.hideDetail();
            row.render();
        }

    }

    #checkboxFn: SwTableSettings<T>['checkboxFn'] | null = null;
    get checkboxFn() {
        return this.#checkboxFn;
    }
    set checkboxFn(fn: SwTableSettings<T>['checkboxFn'] | null) {
        this.#checkboxFn = fn;
        if (typeof this.#checkboxFn === 'function') {
            this.columnsObject.checkbox ??= new BuiltInColumn('checkbox');
            this.columnsObject.checkbox.th.append(this.#els.selectAllCheckbox);

        }
        else {
            this.columnsObject.checkbox?.destroy();
        }
        if (!this.rows.length) return;
        this.renderColumnTr();
        for (const row of this.rows) row.render();
    }

    #actionsFn: SwTableSettings<T>['actionsFn'] | null = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn: SwTableSettings<T>['actionsFn'] | null) {
        this.#actionsFn = fn;
        if (typeof this.#actionsFn === 'function') {
            this.columnsObject.actions ??= new BuiltInColumn('actions');
        }
        else {
            this.columnsObject.actions?.destroy();
        }
        if (!this.rows.length) return;
        this.renderColumnTr();
        for (const row of this.rows) row.render();
    }

    #filters: Array<(row: Row<T>) => boolean> | null = null;
    get filters() {
        return this.#filters;
    }
    set filters(filters: Array<(row: Row<T>) => boolean> | null) {
        this.#filters = filters;
        this.goToPage(1);
    }


    #pageLengthOptions: Array<number> | null = null;
    get pageLengthOptions() {
        return this.#pageLengthOptions;
    }
    set pageLengthOptions(options) {
        if (!Array.isArray(options) || !options.length) {
            this.#pageLengthOptions = [0];
        }
        else {
            this.#pageLengthOptions = options;
        }
        this.#els.pageLengthSelect.replaceChildren();
        if (this.#pageLengthOptions.length > 1) {
            for (const n of this.#pageLengthOptions.sort((a, b) => a - b)) {
                this.#els.pageLengthSelect.add(new Option(n === 0 ? 'All' : String(n), String(n)));
            }
            this.#els.headerDiv.append(this.#els.pageLengthSelect);
        }
    }

    #showSearch = false;
    searchInput: HTMLInputElement | null = null;
    get showSearch() {
        return this.#showSearch;
    }
    set showSearch(bool: boolean) {
        bool = !!bool;
        if (!this.#showSearch && bool) {
            const searchWrapper = document.createElement('div');
            searchWrapper.classList.add('sw-table-search-wrapper');
            const searchIcon = document.createElement('div');
            searchIcon.className = 'sw-table-icon sw-table-magnifying-glass';
            this.searchInput ??= document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.title = 'Search';
            this.searchInput.classList.add('sw-table-search');
            this.searchInput.addEventListener('input', () => {
                this.goToPage(1);
                this.updateSelectAllCheckbox();
            });
            searchWrapper.append(searchIcon, this.searchInput);
            this.#els.headerDiv.append(searchWrapper);
        }
        else if (this.#showSearch && !bool) {
            this.searchInput?.parentElement?.remove();
            this.searchInput?.remove();
            this.searchInput = null;
        }
        this.#showSearch = !!bool;
    }


    #currentPage = 1;
    get currentPage() {
        return this.#currentPage;
    }
    set currentPage(n: number) {
        this.goToPage(n);
    }

    get numberOfPages() {
        if (this.#pageLength === 0) return 1;
        return Math.ceil(this.rowsFilterTrue.length / this.#pageLength);
    }

    get rowsFilterTrue() {
        return this.rows.filter(row => row.isFilterTrue);
    }

    get #rowsFilterTruePartitionedByPage() {
        if (this.#pageLength === 0) return [this.rowsFilterTrue]; // If pageLength is 0, one page
        return Array.from({ length: this.numberOfPages }, (_, i) => {
            return this.rowsFilterTrue.slice(i * this.#pageLength, (i + 1) * this.#pageLength);
        });
    }

    get rowsCurrentPage() {
        return this.#rowsFilterTruePartitionedByPage[this.#currentPage - 1] ?? [];
    }

    get rowsChecked() {
        return this.rowsFilterTrue.filter(row => row.isChecked);
    }

    checkAllRows() {
        for (const row of this.rowsFilterTrue) row.isChecked = true;
    }

    uncheckAllRows() {
        for (const row of this.rowsFilterTrue) row.isChecked = false;
    }

    toggleCheckAllRows() {
        if (this.rowsFilterTrue.filter(row => !!row.checkbox).some(row => !row.isChecked)) {
            this.checkAllRows()
        }
        else {
            this.uncheckAllRows();
        }
    }

    updateSelectAllCheckbox() {
        this.#els.selectAllCheckbox.style.visibility = this.rowsFilterTrue.some(row => !!row.checkbox) ? 'visible' : 'hidden';
        const allChecked = this.rowsFilterTrue.filter(row => !!row.checkbox).every(row => row.isChecked);
        const someChecked = this.rowsFilterTrue.filter(row => !!row.checkbox).some(row => row.isChecked);
        this.#els.selectAllCheckbox.checked = allChecked;
        this.#els.selectAllCheckbox.indeterminate = !allChecked && someChecked;
    }

    #pageLength = 0;
    get pageLength() {
        return this.#pageLength;
    }
    set pageLength(n: number) {
        this.#pageLength = n;
        this.goToPage(1);
    }

    // This is the single DOM placement method
    goToPage(n: number) {
        if (typeof n !== 'number') return;
        n = Math.floor(n);
        if (n < 1) n = 1;
        if (n > this.numberOfPages) n = this.numberOfPages;
        this.#els.tbody.replaceChildren();
        this.#currentPage = n;
        const rowsToShow = this.rowsCurrentPage;
        rowsToShow.forEach((row, i) => {
            row.tr.className = i % 2 === 1 ? 'sw-table-tr-odd' : '';
            this.#els.tbody.append(row.tr);
            if (row.detail && row.detailIsVisible) this.#els.tbody.append(row.detail.tr);
        });

        const first = this.rowsFilterTrue.indexOf(rowsToShow[0]) + 1;
        const last = this.rowsFilterTrue.indexOf(rowsToShow[rowsToShow.length - 1]) + 1;
        this.#els.tfootTd.colSpan = this.colSpan;
        this.#els.pageNumberDiv.textContent = `Showing ${first}-${last} of ${this.rowsFilterTrue.length}`;
        this.#els.nextPageButton.style.visibility = this.currentPage < this.numberOfPages ? 'visible' : 'hidden';
        this.#els.prevPageButton.style.visibility = this.currentPage > 1 ? 'visible' : 'hidden';
    }

    renderColumnTr() {
        this.#els.colgroup.replaceChildren();
        this.#els.columnTr.replaceChildren();
        if (this.columnsObject.detail) {
            this.#els.columnTr.append(this.columnsObject.detail.th);
            this.#els.colgroup.append(this.columnsObject.detail.col);
        }
        for (const column of this.columns) {
            if (column === null || !column.isShowing) continue;
            this.#els.columnTr.append(column.th);
            this.#els.colgroup.append(column.col);
        }
        if (this.columnsObject.actions) {
            this.#els.columnTr.append(this.columnsObject.actions.th);
            this.#els.colgroup.append(this.columnsObject.actions.col);
        }
        if (this.columnsObject.checkbox) {
            this.#els.columnTr.append(this.columnsObject.checkbox.th);
            this.#els.colgroup.append(this.columnsObject.checkbox.col);
        }
    }

    columnModal() {

        const modal = document.createElement('dialog');
        this.#els.wrapper.append(modal);
        for (const col of this.columns) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            label.append(checkbox, col.name);
            checkbox.value = col.colId;
            modal.append(label);
        }
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            // calling show() hide() on each individually is a lot of renders
            modal.querySelectorAll('input').forEach(checkbox => {
                const col = this.columnsObject[checkbox.value];
                if (col instanceof Column && checkbox.checked) col.show();
                if (col instanceof Column && !checkbox.checked) col.hide();
                modal.remove();
            });
        });
        modal.showModal();


    }

}