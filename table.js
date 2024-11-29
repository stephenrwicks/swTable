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
    // Store built ins alongside other cols, with order property
    #columnsObject = {
        detailTh: null,
        checkboxTh: null,
        actionsTh: null
    };
    #currentPage = 1;
    constructor(settings) {
        if (!settings?.columns)
            throw new Error('SwTable - no columns defined');
        // The order of things here is important
        for (const col of settings.columns) {
            const column = new Column(col);
            columnToTable.set(column, this);
            this.#columns.push(column); // Could assign to object by id
            this.#theadTr.append(column.th);
        }
        if (settings.data?.length) {
            for (const datum of settings.data) {
                this.insertRow(datum);
            }
        }
        this.showSearch = !!settings.showSearch;
        // this.#updateDetailColumn();
        // this.#updateCheckboxColumn();
        // this.#updateActionsColumn();
        if (typeof settings.detailFn === 'function') {
            this.detailFn = settings.detailFn;
        }
        ;
        if (typeof settings.checkboxFn === 'function') {
            this.checkboxFn = settings.checkboxFn;
        }
        ;
        if (typeof settings.actionsFn === 'function') {
            this.actionsFn = settings.actionsFn;
        }
        ;
        if (typeof settings.pageLength === 'number') {
            this.pageLength = settings.pageLength;
        }
        else {
            this.goToPage(1);
        }
        this.#thead.append(this.#theadTr);
        this.#tfootTr.append(this.#tfootTd);
        this.#tfoot.append(this.#tfootTr);
        this.#table.append(this.#thead, this.#tbody, this.#tfoot);
        this.#wrapper.append(this.#topDiv, this.#table);
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
        if (!settings || typeof index !== 'number')
            throw new Error('SwTable insertColumn');
        const column = new Column(settings);
        columnToTable.set(column, this);
        this.#columns[index].th.before(column.th);
        this.#columns.splice(index, 0, column);
        for (const row of this.rows)
            row.render();
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
        this.#updateDetailColumn();
        for (const row of this.rows) {
            row.renderCells();
            row.renderDetail();
        }
    }
    #checkboxFn = null;
    get checkboxFn() {
        return this.#checkboxFn;
    }
    set checkboxFn(fn) {
        this.#checkboxFn = fn;
        if (!this.rows.length)
            return;
        this.#updateCheckboxColumn();
        for (const row of this.rows) {
            row.renderCells();
            row.renderCheckbox();
        }
    }
    #actionsFn = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn) {
        this.#actionsFn = fn;
        if (!this.rows.length)
            return;
        this.#updateActionsColumn();
        for (const row of this.rows) {
            row.renderCells();
            row.renderActions();
        }
    }
    #updateDetailColumn() {
        if (typeof this.#detailFn === 'function') {
            this.#detailTh ??= document.createElement('th');
            this.#detailTh.classList.add('sw-table-detail-th');
            this.#theadTr.prepend(this.#detailTh);
            for (const row of this.rows) {
                row.cells.detailTd ??= document.createElement('td');
            }
        }
        else {
            this.#detailTh?.remove();
            this.#detailTh = null;
            for (const row of this.rows) {
                row.cells.detailTd?.remove();
                row.cells.detailTd = null;
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
            this.columns[this.columns.length - 1].th.after(this.#checkboxTh);
            this.#selectAllCheckbox.addEventListener('change', () => this.toggleCheckAllRows());
            for (const row of this.rows) {
                row.cells.checkboxTd ??= document.createElement('td');
            }
        }
        else {
            this.#selectAllCheckbox?.remove();
            this.#selectAllCheckbox = null;
            this.#checkboxTh?.remove();
            this.#checkboxTh = null;
            for (const row of this.rows) {
                row.cells.checkboxTd?.remove();
                row.cells.checkboxTd = null;
            }
        }
    }
    #updateActionsColumn() {
        if (typeof this.#actionsFn === 'function') {
            this.#actionsTh ??= document.createElement('th');
            this.#actionsTh.classList.add('sw-table-actions-th');
            this.columns[this.columns.length - 1].th.after(this.#actionsTh);
            for (const row of this.rows) {
                row.cells.actionsTd ??= document.createElement('td');
            }
        }
        else {
            this.#actionsTh?.remove();
            this.#actionsTh = null;
            for (const row of this.rows) {
                row.cells.actionsTd?.remove();
                row.cells.actionsTd = null;
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
    // This is the single DOM placement method
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
        const rowsCurrentPage = this.rowsCurrentPage;
        rowsCurrentPage.forEach((row, i) => {
            //if (!row.isRendered) row.render();
            // row.tr.classList.remove('sw-table-tr-even');
            // row.tr.classList.remove('sw-table-tr-odd');
            // row.tr.classList.add(i % 2 === 0 ? 'sw-table-tr-even' : 'sw-table-tr-odd');
            this.#tbody.append(row.tr);
            const detail = rowToDetail.get(row);
            // if (detail) { 
            //     // We can't determine if detail is open yet
            //     this.#tbody.append(detail.tr);
            // }
        });
        const first = this.rows.indexOf(rowsCurrentPage[0]) + 1;
        const last = this.rows.indexOf(rowsCurrentPage[rowsCurrentPage.length - 1]) + 1;
        this.#tfootTd.textContent = `Showing ${first}-${last} of ${this.#rows.length}`;
    }
}
const data = [
    {
        id: 1,
        name: 'Alice',
        age: 28,
        city: 'Boston',
        address: {
            street: '123 Main St',
            zipCode: '02118',
        },
        hobbies: ['reading', 'cycling'],
        employment: {
            company: 'TechCorp',
            role: 'Engineer',
            tenure: 3, // years
        },
    },
    {
        id: 2,
        name: 'Bob',
        age: 34,
        city: 'Los Angeles',
        address: {
            street: '456 Elm St',
            zipCode: '90001',
        },
        hobbies: ['photography', 'cooking', 'hiking'],
        employment: {
            company: 'MediaHub',
            role: 'Content Creator',
            tenure: 5, // years
        },
    },
    {
        id: 3,
        name: 'Charlie',
        age: 25,
        city: 'Chicago',
        address: {
            street: '789 Oak Ave',
            zipCode: '60611',
        },
        hobbies: ['gaming', 'basketball'],
        employment: {
            company: 'AdSolutions',
            role: 'Analyst',
            tenure: 1, // years
        },
    },
    {
        id: 4,
        name: 'Diana',
        age: 29,
        city: 'Houston',
        address: {
            street: '321 Pine Rd',
            zipCode: '77002',
        },
        hobbies: ['painting', 'yoga'],
        employment: {
            company: 'HealthFirst',
            role: 'Nurse',
            tenure: 4, // years
        },
    },
];
// Lazy rendering breaking dropdown and detail but not checkbox
//@ts-ignore
window.x = new Table({
    pageLength: 10,
    columns: [
        {
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
            name: 'Hobbies',
            render(row) {
                return row.data.hobbies.toString();
            }
        },
        {
            name: 'Age',
            render(row) {
                return row.data.age;
            },
            sortBy(row) {
                return row.data.age;
            },
        },
        {
            name: 'address',
            render(row) {
                return row.data.address.street + ' ' + row.data.address.zipCode;
            },
            sortBy(row) {
                return row.data.address.zipCode;
            }
        },
        {
            name: 'City',
            render(row) {
                const div = document.createElement('div');
                div.append(row.data.city);
                return div;
            },
            sortBy: 'auto'
        },
        {
            name: 'Computed',
            render(row) {
                return `This person's name is ${row.data.name} and s/he lives in ${row.data.city}`;
            },
            sortBy(row) {
                return row.data.city;
            },
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
    theme: 'ice',
});
//@ts-ignore
document.body.append(window.x.element);
