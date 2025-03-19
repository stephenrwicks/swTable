// Functional footer
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
// Event delegation to the parent element. Would require searching for the row on click, which is a bit weird
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
import { Column, BuiltInColumn } from './column.js';
import { Row } from './row.js';
import { rowToTable, columnToTable } from './weakMaps.js';
export { SwTable };
class SwTable {
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
        overallSummaryTr: document.createElement('tr'),
        overallSummaryTd: document.createElement('td'),
        colSummaryTr: document.createElement('tr'),
        tfootTr: document.createElement('tr'),
        tfootTd: document.createElement('td'),
        pagingDiv: document.createElement('div'),
        nextPageButton: document.createElement('button'),
        prevPageButton: document.createElement('button'),
        pageNumberDiv: document.createElement('div'),
        pageLengthSelect: document.createElement('select'),
        selectAllCheckbox: document.createElement('input'),
        filterButton: document.createElement('button'),
        searchInput: document.createElement('input'),
        searchWrapper: document.createElement('div'),
    };
    columnsObject = {
        builtInDetail: null,
        builtInCheckbox: null,
        builtInActions: null
    };
    constructor(settings) {
        if (!settings?.columns)
            throw new Error('SwTable - no columns defined');
        settings.columns.forEach((colSetting, index) => {
            const column = new Column(colSetting);
            column.sortOrder = index;
            columnToTable.set(column, this);
            this.columnsObject[column.colId] = column;
        });
        if (typeof settings.detailFn === 'function')
            this.detailFn = settings.detailFn;
        if (typeof settings.actionsFn === 'function')
            this.actionsFn = settings.actionsFn;
        if (typeof settings.checkboxFn === 'function')
            this.checkboxFn = settings.checkboxFn;
        if (typeof settings.overallSummaryFn === 'function')
            this.overallSummaryFn = settings.overallSummaryFn;
        this.renderColumnTr();
        this.draggableColumns = !!settings.draggableColumns;
        this.pageLengthOptions = settings.pageLengthOptions ?? [0];
        this.#els.headerDiv.append(this.#els.pageLengthSelect);
        settings.showSearch ??= true;
        this.showSearch = !!settings.showSearch;
        this.#els.searchWrapper.classList.add('sw-table-search-wrapper');
        const searchIcon = document.createElement('div');
        searchIcon.className = 'sw-table-icon sw-table-magnifying-glass';
        this.#els.searchInput.type = 'text';
        this.#els.searchInput.title = 'Search';
        this.#els.searchInput.classList.add('sw-table-search');
        this.#els.searchInput.addEventListener('input', () => {
            // could debounce this
            this.goToPage(1);
            this.updateSelectAllCheckbox();
        });
        this.#els.searchWrapper.append(searchIcon, this.#els.searchInput);
        this.#els.headerDiv.append(this.#els.searchWrapper);
        this.#els.table.append(this.#els.colgroup);
        const headerTr = document.createElement('tr');
        this.#els.headerTd.append(this.#els.headerDiv);
        headerTr.append(this.#els.headerTd);
        this.#els.headerTd.colSpan = 999;
        this.#els.overallSummaryTd.colSpan = 999;
        this.#els.thead.append(headerTr, this.#els.columnTr);
        this.#els.pagingDiv.append(this.#els.pageNumberDiv, this.#els.prevPageButton, this.#els.nextPageButton);
        this.#els.tfootTd.append(this.#els.pagingDiv);
        this.#els.tfootTr.append(this.#els.tfootTd);
        this.#els.tfoot.append(this.#els.tfootTr);
        this.#els.table.append(this.#els.thead, this.#els.tbody, this.#els.tfoot);
        this.#els.wrapper.append(this.#els.table);
        this.#els.overallSummaryTr.append(this.#els.overallSummaryTd);
        this.#els.headerDiv.classList.add('sw-table-header');
        this.#els.headerTd.classList.add('sw-table-header-td');
        this.#els.table.classList.add('sw-table');
        this.#els.wrapper.classList.add('sw-table-wrapper');
        this.#els.pagingDiv.classList.add('sw-table-paging-div');
        this.#els.pageNumberDiv.classList.add('sw-table-page-number-div');
        this.#els.selectAllCheckbox.classList.add('sw-table-checkbox');
        this.#els.pageLengthSelect.classList.add('sw-table-page-length-select');
        this.#els.overallSummaryTr.classList.add('sw-table-overall-summary-tr');
        this.#els.colSummaryTr.classList.add('sw-table-col-summary-tr');
        this.#els.selectAllCheckbox.title = 'Toggle All';
        this.#els.pageLengthSelect.addEventListener('change', () => this.pageLength = Number(this.#els.pageLengthSelect.value));
        this.#els.table.dataset.swTableTheme = typeof settings.theme === 'string' ? settings.theme : '';
        if (typeof settings.pageLength === 'number')
            this.#pageLength = settings.pageLength;
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
        this.#els.filterButton.type = 'button';
        this.#els.filterButton.title = 'Filters';
        this.#els.filterButton.className = 'sw-table-button sw-table-filter-button sw-table-button-circle';
        const filterIcon = document.createElement('div');
        filterIcon.className = 'sw-table-icon sw-table-filter-icon';
        this.#els.filterButton.append(filterIcon);
        this.#els.filterButton.addEventListener('click', () => this.filtersDialog());
        this.#uiFilters = settings.uiFilters;
        this.#els.headerDiv.append(this.#els.filterButton);
        if (Array.isArray(settings.data) && settings.data.length)
            this.setData(settings.data);
    }
    /**
     *  Sets data and creates instances of all Row objects
    */
    setData(data) {
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
    #stateRecords = {};
    saveState(str) {
        this.#stateRecords[str] = this.dataSnapshot;
    }
    loadState(str) {
        if (!(str in this.#stateRecords))
            throw new Error(`SwTable - State ${str} doesn't exist`);
        this.setData(structuredClone(this.#stateRecords[str]));
    }
    get element() {
        return this.#els.wrapper;
    }
    get colSpan() {
        return this.#els.columnTr.children.length;
    }
    get columns() {
        const columnVals = Object.values(this.columnsObject);
        const customCols = columnVals.filter(column => column instanceof Column);
        const sortedCustomCols = customCols.sort((a, b) => a.sortOrder - b.sortOrder);
        return sortedCustomCols;
    }
    insertColumn(settings, index) {
        if (!settings || typeof index !== 'number')
            throw new Error('SwTable insertColumn');
        const column = new Column(settings);
        column.sortOrder = index;
        columnToTable.set(column, this);
        this.columnsObject[column.colId] = column;
        this.renderColumnTr();
        for (const row of this.rows)
            row.render();
    }
    #draggableColumns = true;
    get draggableColumns() {
        return this.#draggableColumns;
    }
    set draggableColumns(bool) {
    }
    #rows = [];
    get rows() {
        return this.#rows;
    }
    insertRow(data, index) {
        const row = new Row();
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
    sortCustom(customSortFn) {
        // Has to be some comparison fn
    }
    // This is where the detailRow is defined
    #detailFn = null;
    get detailFn() {
        return this.#detailFn;
    }
    set detailFn(fn) {
        this.#detailFn = fn;
        this.columnsObject.detail = typeof this.#detailFn === 'function' ? new BuiltInColumn('detail') : null;
        if (!this.rows.length)
            return;
        this.renderColumnTr();
        this._renderSummaries();
        for (const row of this.rows) {
            row.hideDetail();
            row.render();
        }
    }
    #checkboxFn = null;
    get checkboxFn() {
        return this.#checkboxFn;
    }
    set checkboxFn(fn) {
        this.#checkboxFn = fn;
        this.columnsObject.checkbox = typeof this.#checkboxFn === 'function' ? new BuiltInColumn('checkbox') : null;
        if (this.columnsObject.checkbox)
            this.columnsObject.checkbox.th.append(this.#els.selectAllCheckbox);
        if (!this.rows.length)
            return;
        this.renderColumnTr();
        this._renderSummaries();
        for (const row of this.rows)
            row.render();
    }
    #actionsFn = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn) {
        this.#actionsFn = fn;
        this.columnsObject.actions = typeof this.#actionsFn === 'function' ? new BuiltInColumn('actions') : null;
        if (!this.rows.length)
            return;
        this.renderColumnTr();
        this._renderSummaries();
        for (const row of this.rows)
            row.render();
    }
    #overallSummaryFn = null;
    get overallSummaryFn() {
        return this.#overallSummaryFn;
    }
    set overallSummaryFn(fn) {
        this.#overallSummaryFn = fn;
        this._renderSummaries();
    }
    #filters = null;
    get filters() {
        return this.#filters;
    }
    set filters(filters) {
        this.#filters = filters;
        this.goToPage(1);
    }
    #uiFilters = null;
    get uiFilters() {
        return this.#uiFilters;
    }
    set uiFilters(filters) {
        this.#uiFilters = filters;
    }
    #pageLengthOptions = null;
    get pageLengthOptions() {
        return this.#pageLengthOptions;
    }
    set pageLengthOptions(options) {
        if (!Array.isArray(options) || !options.length || options.some(n => typeof n !== 'number')) {
            this.#pageLengthOptions = [0];
        }
        else {
            this.#pageLengthOptions = options;
        }
        this.#els.pageLengthSelect.replaceChildren();
        if (this.#pageLengthOptions.length === 1) {
            this.#els.pageLengthSelect.style.display = 'none';
        }
        else {
            for (const n of this.#pageLengthOptions.sort((a, b) => a - b)) {
                this.#els.pageLengthSelect.add(new Option(n === 0 ? 'All' : String(n), String(n)));
            }
            this.#els.pageLengthSelect.style.display = '';
        }
        this.pageLength = this.#pageLengthOptions[0];
    }
    #showSearch = false;
    get searchInput() {
        return this.#els.searchInput;
    }
    get showSearch() {
        return this.#showSearch;
    }
    set showSearch(bool) {
        this.#showSearch = !!bool;
        this.#els.searchWrapper.style.display = this.#showSearch ? '' : 'none';
    }
    #currentPage = 1;
    get currentPage() {
        return this.#currentPage;
    }
    set currentPage(n) {
        this.goToPage(n);
    }
    get numberOfPages() {
        if (this.#pageLength === 0)
            return 1;
        return Math.ceil(this.rowsFilterTrue.length / this.#pageLength);
    }
    get rowsFilterTrue() {
        // This can get pretty expensive fast
        return this.rows.filter(row => row.isFilterTrue);
    }
    // Probably this entire method should be removed
    #getRowsFilterTruePartitionedByPage() {
        const rowsFilterTrue = this.rowsFilterTrue;
        if (this.#pageLength === 0)
            return [rowsFilterTrue];
        return Array.from({ length: this.numberOfPages }, (_, i) => {
            return rowsFilterTrue.slice(i * this.#pageLength, (i + 1) * this.#pageLength);
        });
    }
    get rowsCurrentPage() {
        return this.#getRowsFilterTruePartitionedByPage()[this.#currentPage - 1] ?? [];
    }
    get rowsChecked() {
        return this.rowsFilterTrue.filter(row => row.isChecked);
    }
    checkAllRows() {
        for (const row of this.rowsFilterTrue)
            row.isChecked = true;
    }
    uncheckAllRows() {
        for (const row of this.rowsFilterTrue)
            row.isChecked = false;
    }
    toggleCheckAllRows() {
        if (this.rowsFilterTrue.some(row => row.checkbox && !row.isChecked)) {
            this.checkAllRows();
        }
        else {
            this.uncheckAllRows();
        }
    }
    updateSelectAllCheckbox() {
        console.log('updateSelectAllCheckbox');
        let visibility = 'hidden';
        let someChecked = false;
        let allChecked = true;
        for (const row of this.rowsFilterTrue) {
            if (!row.checkbox)
                continue;
            visibility = '';
            if (row.isChecked) {
                someChecked = true;
            }
            else {
                allChecked = false;
            }
        }
        this.#els.selectAllCheckbox.style.visibility = visibility;
        this.#els.selectAllCheckbox.checked = allChecked;
        this.#els.selectAllCheckbox.indeterminate = !allChecked && someChecked;
    }
    #pageLength = 0;
    get pageLength() {
        return this.#pageLength;
    }
    set pageLength(n) {
        this.#pageLength = n;
        this.#els.pageLengthSelect.value = String(n);
        this.goToPage(1);
    }
    // This is the single DOM placement method
    goToPage(n) {
        if (typeof n !== 'number')
            return;
        // Updated this 3-18-25
        // Should only filter rows once on render
        const rowsFilterTrue = this.rowsFilterTrue;
        const numberOfPages = this.#pageLength ? Math.ceil(rowsFilterTrue.length / this.#pageLength) : 1;
        // Use a classic for loop for efficiency
        const rowsFilterTruePartitionedByPage = [];
        if (numberOfPages === 0) {
            rowsFilterTruePartitionedByPage.push(rowsFilterTrue);
        }
        else {
            for (let i = 0; i < numberOfPages; i++) {
                rowsFilterTruePartitionedByPage.push(rowsFilterTrue.slice(i * this.#pageLength, (i + 1) * this.#pageLength));
            }
        }
        n = Math.floor(n);
        if (n < 1)
            n = 1;
        if (n > numberOfPages)
            n = numberOfPages;
        this.#currentPage = n;
        const documentFragment = document.createDocumentFragment();
        const rowsToShow = rowsFilterTruePartitionedByPage[n - 1] ?? [];
        rowsToShow.forEach((row, i) => {
            row.tr.className = i % 2 === 1 ? 'sw-table-tr-odd' : '';
            documentFragment.append(row.tr);
            if (row.detail && row.detailIsVisible)
                documentFragment.append(row.detail.tr);
        });
        this._renderSummaries();
        const firstOfPage = rowsFilterTrue.indexOf(rowsToShow[0]) + 1;
        const lastOfPage = rowsFilterTrue.indexOf(rowsToShow[rowsToShow.length - 1]) + 1;
        this.#els.pageNumberDiv.textContent = `Showing ${firstOfPage}-${lastOfPage} of ${rowsFilterTrue.length}`;
        this.#els.nextPageButton.style.visibility = n < numberOfPages ? 'visible' : 'hidden';
        this.#els.prevPageButton.style.visibility = n > 1 ? 'visible' : 'hidden';
        //this.updateSelectAllCheckbox();
        this.#els.tbody.replaceChildren(documentFragment);
        // TODO:
        // Fix all colspans here
        const colSpan = this.colSpan;
        this.#els.tfootTd.colSpan = colSpan;
    }
    renderColumnTr() {
        this.#els.colgroup.replaceChildren();
        this.#els.columnTr.replaceChildren();
        if (this.columnsObject.detail) {
            this.#els.columnTr.append(this.columnsObject.detail.th);
            this.#els.colgroup.append(this.columnsObject.detail.col);
        }
        for (const column of this.columns) {
            if (column === null || !column.isShowing)
                continue;
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
    _renderSummaries() {
        // We potentially have an overall summary cell for the table
        // and/or a summary cell for each column
        // Overall summary
        if (typeof this.#overallSummaryFn === 'function') {
            const contents = this.#overallSummaryFn(this);
            this.#els.overallSummaryTd.replaceChildren(contents ?? '');
            this.#els.tfoot.prepend(this.#els.overallSummaryTr);
        }
        else {
            this.#els.overallSummaryTr.remove();
        }
        // Col-by-col summary
        // Must rerender on column change, delete, move
        // Should be able to change summary fn for each col
        if (this.columns.some(col => typeof col.summary === 'function')) {
            this.#els.colSummaryTr.replaceChildren();
            if (this.columnsObject.detail) {
                this.#els.colSummaryTr.append(document.createElement('td'));
            }
            for (const col of this.columns) {
                col.summaryTd.replaceChildren(col.summary?.(this) ?? '');
                this.#els.colSummaryTr.append(col.summaryTd);
            }
            if (this.columnsObject.actions) {
                this.#els.colSummaryTr.append(document.createElement('td'));
            }
            if (this.columnsObject.checkbox) {
                this.#els.colSummaryTr.append(document.createElement('td'));
            }
            this.#els.tfoot.prepend(this.#els.colSummaryTr);
        }
    }
    settingsDialog() {
        const dialog = document.createElement('dialog');
        dialog.classList.add('sw-table-column-dialog');
        this.#els.wrapper.append(dialog);
        const labels = this.columns.map(col => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.checked = col.isShowing;
            checkbox.type = 'checkbox';
            checkbox.className = 'sw-table-checkbox';
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked)
                    col.show();
                else
                    col.hide();
            });
            label.append(checkbox, col.name);
            return label;
        });
        dialog.append(...labels);
        dialog.show();
        dialog.style.left = '0px';
        // Cancel only applies to showModal, not show()
        dialog.addEventListener('cancel', (e) => {
            e.target.remove();
        });
    }
    filtersDialog() {
        if (!this.#uiFilters?.length)
            return;
        let dialog = document.createElement('dialog');
        dialog.classList.add('sw-table-filters-dialog');
        this.#els.wrapper.append(dialog);
        // Need some way to track which UIFilter is in "active" state
        let labels = this.#uiFilters.map(f => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'sw-table-checkbox';
            checkbox.checked = !!f.isActive;
            label.append(checkbox, f.text);
            return label;
        });
        dialog.append(...labels);
        dialog.showModal();
        // Cancel only applies to showModal, not show()
        dialog.addEventListener('cancel', (e) => {
            e.target.remove();
            dialog = null;
            labels = null;
        });
        dialog.addEventListener('change', () => {
        });
    }
    #buildModal() {
        // return some kind of modal with event listeners on it
    }
    destroy() {
    }
}
