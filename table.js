import { Column } from './column.js';
import { css } from './css.js';
import { Row } from './row.js';
import { rowToTable, columnToTable, rowToDetail } from './weakMaps.js';
export { Table };
class Table {
    #wrapper = document.createElement('div');
    #topDiv = document.createElement('div');
    #table = document.createElement('table');
    #thead = document.createElement('thead');
    #theadTr = document.createElement('tr');
    #tbody = document.createElement('tbody');
    #tfoot = document.createElement('tfoot');
    #tfootTr = document.createElement('tr');
    #tfootTd = document.createElement('td');
    #detailTh = null;
    #checkboxTh = null;
    #selectAllCheckbox = null;
    #actionsTh = null;
    #currentPage = 1;
    constructor(settings) {
        if (!settings?.columns)
            throw new Error('SwTable - no columns defined');
        // The order of things here is important
        if (typeof settings.detailFn === 'function') {
            this.detailFn = settings.detailFn;
        }
        ;
        if (typeof settings.checkboxFn === 'function') {
            this.#checkboxFn = settings.checkboxFn;
        }
        ;
        if (typeof settings.actionsFn === 'function') {
            this.#actionsFn = settings.actionsFn;
        }
        ;
        for (const column of settings.columns) {
            this.insertColumn(column);
        }
        // this.columns = settings.columns;
        if (settings.data?.length) {
            for (const datum of settings.data) {
                this.insertRow(datum);
            }
        }
        this.showSearch = !!settings.showSearch;
        this.#updateDetailColumn();
        this.#updateCheckboxColumn();
        this.#updateActionsColumn();
        if (typeof settings.pageLength === 'number') {
            this.pageLength = settings.pageLength;
        }
        else {
            this.goToPage(1);
        }
        this.showSearch = !!settings.showSearch;
        this.#thead.append(this.#theadTr);
        this.#tfootTr.append(this.#tfootTd);
        this.#tfoot.append(this.#tfootTr);
        this.#table.append(this.#thead, this.#tbody, this.#tfoot);
        this.#wrapper.append(this.#topDiv, this.#table);
        this.#table.classList.add(css.table);
        this.#topDiv.classList.add(css.header);
        this.#wrapper.classList.add(css.wrapper);
        if (typeof settings.theme === 'string')
            this.#wrapper.dataset.swTableTheme = settings.theme;
    }
    get data() {
        return this.rows.map(row => row.data);
    }
    get dataTarget() {
        return this.rows.map(row => row.dataTarget);
    }
    get dataSnapshot() {
        return this.rows.map(row => row.dataSnapshot);
    }
    // get dataLive() {
    //     return this.rows.map(row => row.dataUnbound);
    // }
    // get dataCopy() {
    //     return this.rows.map(row => structuredClone(row.dataUnbound))
    // }
    get element() {
        return this.#wrapper;
    }
    get colSpan() {
        return this.#theadTr.children.length;
    }
    #showSearch = false;
    get showSearch() {
        return this.#showSearch;
    }
    set showSearch(bool) {
        this.#showSearch = !!bool;
        if (this.#showSearch) {
            if (this.#searchInput === null) {
                this.#searchInput ??= document.createElement('input');
                this.#searchInput.type = 'text';
                this.#searchInput.classList.add(css.searchInput);
                this.#searchInput.addEventListener('input', () => this.goToPage(1));
            }
            this.#topDiv.append(this.#searchInput);
        }
        else {
            this.#searchInput?.remove();
            this.#searchInput = null;
        }
    }
    #searchInput = null;
    get searchInput() {
        if (!this.#showSearch)
            return null;
        return this.#searchInput;
    }
    #columns = [];
    get columns() {
        return this.#columns;
    }
    insertColumn(settings, index) {
        const column = new Column(settings);
        columnToTable.set(column, this);
        if (typeof index === 'number' && this.#columns.length) {
            this.#columns[index].th.before(column.th);
            this.#columns.splice(index, 0, column);
        }
        else {
            this.#columns.push(column);
            this.#theadTr.append(column.th);
        }
    }
    destroyColumn(index) {
        this.columns[index].destroy();
    }
    #rows = [];
    get rows() {
        return this.#rows;
    }
    insertRow(data, index) {
        const row = new Row();
        rowToTable.set(row, this);
        row.data = data;
        if (typeof index === 'number' && this.#rows.length) {
            this.#rows[index].tr.before(row.tr);
            this.#rows.splice(index, 0, row);
        }
        else {
            this.#rows.push(row);
            this.#tbody.append(row.tr);
        }
    }
    // This is where the detailRow is defined
    #detailFn = null;
    get detailFn() {
        return this.#detailFn;
    }
    set detailFn(fn) {
        this.#detailFn = fn;
        if (!this.rows.length)
            return;
        for (const row of this.rows)
            row.renderDetail();
        this.#updateDetailColumn();
    }
    #checkboxFn = null;
    get checkboxFn() {
        return this.#checkboxFn;
    }
    set checkboxFn(fn) {
        this.#checkboxFn = fn;
        if (!this.rows.length)
            return;
        for (const row of this.rows)
            row.renderCheckbox();
        this.#updateCheckboxColumn();
    }
    #actionsFn = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn) {
        this.#actionsFn = fn;
        if (!this.rows.length)
            return;
        for (const row of this.rows)
            row.renderActions();
        this.#updateActionsColumn();
    }
    #updateDetailColumn() {
        if (typeof this.#detailFn === 'function') {
            this.#detailTh ??= document.createElement('th');
            this.#detailTh.classList.add('sw-table-detail-th');
            this.#theadTr.prepend(this.#detailTh);
            for (const row of this.rows) {
                row.detailTd ??= document.createElement('td');
                row.tr.prepend(row.detailTd);
                row.detailTd.append(row.detailButton ?? '');
            }
        }
        else {
            this.#detailTh?.remove();
            this.#detailTh = null;
            for (const row of this.rows) {
                row.detailTd?.remove();
                row.detailTd = null;
            }
        }
    }
    #updateCheckboxColumn() {
        if (typeof this.#checkboxFn === 'function') {
            this.#selectAllCheckbox = document.createElement('input');
            this.#selectAllCheckbox.type = 'checkbox';
            this.#checkboxTh ??= document.createElement('th');
            this.#checkboxTh.classList.add('sw-table-checkbox-th');
            this.#checkboxTh.append(this.#selectAllCheckbox);
            this.#theadTr.prepend(this.#checkboxTh);
            this.#selectAllCheckbox.addEventListener('change', () => this.toggleCheckAllRows());
            for (const row of this.rows) {
                row.checkboxTd ??= document.createElement('td');
                row.tr.prepend(row.checkboxTd);
                row.checkboxTd.append(row.checkbox ?? '');
            }
        }
        else {
            this.#selectAllCheckbox?.remove();
            this.#selectAllCheckbox = null;
            this.#checkboxTh?.remove();
            this.#checkboxTh = null;
            for (const row of this.rows) {
                row.checkboxTd?.remove();
                row.checkboxTd = null;
            }
        }
    }
    #updateActionsColumn() {
        if (typeof this.#actionsFn === 'function') {
            this.#actionsTh ??= document.createElement('th');
            this.#actionsTh.classList.add('sw-table-actions-th');
            this.#theadTr.prepend(this.#actionsTh);
            for (const row of this.rows) {
                row.actionsTd ??= document.createElement('td');
                row.tr.prepend(row.actionsTd);
                row.actionsTd.append(row.actionsButton ?? '');
            }
        }
        else {
            this.#actionsTh?.remove();
            this.#actionsTh = null;
            for (const row of this.rows) {
                row.actionsTd?.remove();
                row.actionsTd = null;
            }
        }
    }
    #filters = null;
    get filters() {
        return this.#filters;
    }
    set filters(filters) {
        this.#filters = filters;
        this.goToPage(1);
    }
    get numberOfPages() {
        if (this.#pageLength === 0)
            return 1;
        return Math.ceil(this.rowsFilterTrue.length / this.#pageLength);
    }
    get rowsFilterTrue() {
        return this.rows.filter(row => row.isFilterTrue);
    }
    get #rowsFilterTruePartitioned() {
        if (this.#pageLength === 0)
            return [this.rowsFilterTrue]; // If pageLength is 0, one page
        return Array.from({ length: this.numberOfPages }, (_, i) => {
            return this.rowsFilterTrue.slice(i * this.#pageLength, (i + 1) * this.#pageLength);
        });
    }
    get rowsCurrentPage() {
        return this.#rowsFilterTruePartitioned[this.#currentPage - 1] ?? [];
    }
    get rowsChecked() {
        return this.rows.filter(row => row.isChecked);
    }
    checkAllRows() {
        for (const row of this.rows)
            row.isChecked = true;
    }
    uncheckAllRows() {
        for (const row of this.rows)
            row.isChecked = false;
    }
    toggleCheckAllRows() {
        if (this.rows.some(row => !!row.checkbox && !row.isChecked)) {
            this.checkAllRows();
        }
        else {
            this.uncheckAllRows();
        }
    }
    #pageLength = 15;
    get pageLength() {
        return this.#pageLength;
    }
    set pageLength(n) {
        this.#pageLength = n;
        this.goToPage(1);
    }
    goToPage(n) {
        if (typeof n !== 'number')
            return;
        n = Math.floor(n);
        if (n < 1)
            n = 1;
        if (n > this.numberOfPages)
            n = this.numberOfPages;
        this.#tbody.replaceChildren();
        this.#currentPage = n;
        this.rowsCurrentPage.forEach((row, i) => {
            row.tr.classList.remove('sw-table-tr-even');
            row.tr.classList.remove('sw-table-tr-odd');
            row.tr.classList.add(i % 2 === 0 ? 'sw-table-tr-even' : 'sw-table-tr-odd');
            this.#tbody.append(row.tr);
            const detail = rowToDetail.get(row);
            // if (detail) { 
            //     // We can't determine if detail is open yet
            //     this.#tbody.append(detail.tr);
            // }
        });
    }
}
const data = [
    { id: 1, name: 'Alice', age: 28, city: 'Boston' },
    { id: 2, name: 'Bob', age: 34, city: 'Los Angeles' },
    { id: 3, name: 'Charlie', age: 25, city: 'Chicago' },
    { id: 4, name: 'Diana', age: 29, city: 'Houston' },
];
//@ts-ignore
window.x = new Table({
    pageLength: 10,
    columns: [{
            name: 'ID',
            render(row) {
                return row.data.id;
            }
        },
        {
            name: 'Name',
            render(row) {
                return row.data.name;
            }
        },
        {
            name: 'Age',
            render(row) {
                return row.data.age;
            }
        },
        {
            name: 'City',
            render(row) {
                return row.data.city;
            }
        },
        {
            name: 'Computed',
            render(row) {
                return `This person's name is ${row.data.name} and s/he lives in ${row.data.city}`;
            }
        }
    ],
    data: data,
    detailFn(row) {
        return 'x';
    },
    checkboxFn(row) {
        return row.data.age < 30;
    },
    actionsFn(row) {
        return [
            {
                text: 'aaa',
                fn() {
                    alert('x');
                }
            }
        ];
    },
    showSearch: true,
    theme: 'ice'
});
//@ts-ignore
document.body.append(window.x.element);
