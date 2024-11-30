
import { Column, ColumnSettings, BuiltInColumn, CheckboxColumn } from './column.js';
import { css } from './css.js';
import { Row } from './row.js';
import { rowToTable, columnToTable } from './weakMaps.js';
import { ActionSettings } from './actions.js';
import { icons } from './icons.js';
export { Table };

type TableSettings = {
    columns: Array<ColumnSettings>;
    theme?: 'mint' | 'ice';
    data?: Array<any>;
    showSearch?: boolean;
    pageLength?: number;
    detailFn?(row: Row): HTMLElement | string | null;
    checkboxFn?(row: Row): boolean | null;
    actionsFn?(row: Row): ActionSettings | null;
}

class Table {

    #headerDiv = document.createElement('div');
    #table = document.createElement('table');
    #thead = document.createElement('thead');
    #headerTd = document.createElement('td');
    #columnTr = document.createElement('tr');
    #tbody = document.createElement('tbody');
    #tfoot = document.createElement('tfoot');
    #tfootTr = document.createElement('tr');
    #tfootTd = document.createElement('td');

    columnsObject: { [key: string]: Column | BuiltInColumn | null } = {
        detail: null,
        checkbox: null,
        actions: null
    };
    // This object could also live outside the class in weakmaps, etc.

    constructor(settings: TableSettings) {
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
        if (settings.data?.length) {
            for (const datum of settings.data) {
                this.insertRow(datum);
            }
        }
        settings.showSearch ??= true;
        this.showSearch = !!settings.showSearch;
        const headerTr = document.createElement('tr');
        //this.#headerTd.classList.add('sw-table-header-td');
        this.#headerTd.append(this.#headerDiv);
        headerTr.append(this.#headerTd);
        this.#headerTd.colSpan = 999;
        this.#thead.append(headerTr, this.#columnTr);
        this.#tfootTr.append(this.#tfootTd);
        this.#tfoot.append(this.#tfootTr);
        this.#table.append(this.#thead, this.#tbody, this.#tfoot);
        this.#headerDiv.classList.add(css.header);
        this.#table.classList.add('sw-table');
        this.#table.dataset.swTableTheme = typeof settings.theme === 'string' ? settings.theme : '';
        if (typeof settings.pageLength === 'number') {
            this.pageLength = settings.pageLength;
        }
        else {
            this.goToPage(1);
        }
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

    get element() {
        return this.#table;
    }

    get colSpan(): number {
        return this.#columnTr.children.length;
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
            const searchIcon = icons.magnifyingGlass();
            this.searchInput ??= document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.classList.add('sw-table-search');
            this.searchInput.addEventListener('input', () => this.goToPage(1));
            searchWrapper.append(searchIcon, this.searchInput);
            this.#headerDiv.append(searchWrapper);
        }
        else if (this.#showSearch && !bool) {
            this.searchInput?.parentElement?.remove();
            this.searchInput?.remove();
            this.searchInput = null;
        }
        this.#showSearch = !!bool;
    }



    get columns() {
        return Object.values(this.columnsObject)
            .filter(column => column instanceof Column)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    insertColumn(settings: ColumnSettings, index: number) {
        if (!settings || typeof index !== 'number') throw new Error('SwTable insertColumn');
        const column = new Column(settings);
        column.sortOrder = index;
        columnToTable.set(column, this);
        this.columnsObject[column.colId] = column;
        this.renderColumnTr();
        for (const row of this.rows) row.render();
    }

    destroyColumn(index: number) {
    }

    #rows: Array<Row> = [];
    get rows() {
        return this.#rows;
    }

    insertRow(data: any, index?: number) {
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
    #detailFn: TableSettings['detailFn'] | null = null;
    get detailFn() {
        return this.#detailFn;
    }
    set detailFn(fn: TableSettings['detailFn'] | null) {
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

    #checkboxFn: TableSettings['checkboxFn'] | null = null;
    get checkboxFn() {
        return this.#checkboxFn;
    }
    set checkboxFn(fn: TableSettings['checkboxFn'] | null) {
        this.#checkboxFn = fn;
        if (typeof this.#checkboxFn === 'function') {
            this.columnsObject.checkbox ??= new CheckboxColumn();
        }
        else {
            this.columnsObject.checkbox?.destroy();
        }
        if (!this.rows.length) return;
        this.renderColumnTr();
        for (const row of this.rows) row.render();
    }

    #actionsFn: TableSettings['actionsFn'] | null = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn: TableSettings['actionsFn'] | null) {
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

    #filters: Array<(row: Row) => boolean> | null = null;
    get filters() {
        return this.#filters;
    }
    set filters(filters: Array<(row: Row) => boolean> | null) {
        this.#filters = filters;
        this.goToPage(1);
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

    get #rowsFilterTruePartitioned() {
        if (this.#pageLength === 0) return [this.rowsFilterTrue]; // If pageLength is 0, one page
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
        for (const row of this.rows) row.isChecked = true;
        //this.columnsObject.
    }

    uncheckAllRows() {
        for (const row of this.rows) row.isChecked = false;
    }

    toggleCheckAllRows() {
        if (this.rows.some(row => !!row.checkbox && !row.isChecked)) {
            this.checkAllRows()
        }
        else {
            this.uncheckAllRows();
        }
    }

    #pageLength = 15;
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
        this.#tbody.replaceChildren();
        this.#currentPage = n;
        const rowsToShow = this.rowsCurrentPage;
        rowsToShow.forEach((row, i) => {
            row.tr.className = i % 2 === 1 ? 'sw-table-tr-odd' : '';
            this.#tbody.append(row.tr);
            if (row.detail && row.detailIsVisible) this.#tbody.append(row.detail.tr);
        });

        const first = this.rows.indexOf(rowsToShow[0]) + 1;
        const last = this.rows.indexOf(rowsToShow[rowsToShow.length - 1]) + 1;
        this.#tfootTd.colSpan = this.colSpan;
        this.#tfootTd.textContent = `Showing ${first}-${last} of ${this.#rows.length}`;
    }

    renderColumnTr() {
        this.#columnTr.replaceChildren();
        if (this.columnsObject.detail) this.#columnTr.append(this.columnsObject.detail.th);
        for (const column of this.columns) {
            if (column === null) continue;
            this.#columnTr.append(column.th);
        }
        if (this.columnsObject.actions) this.#columnTr.append(this.columnsObject.actions.th);
        if (this.columnsObject.checkbox) this.#columnTr.append(this.columnsObject.checkbox.th);
    }
}

// Lazy render can't really work because it breaks search if search is checking text
// const data = [
//     {
//         id: 1,
//         name: 'Alice',
//         age: 28,
//         city: 'Boston',
//         address: {
//             street: '123 Main St',
//             zipCode: '02118',
//         },
//         hobbies: ['reading', 'cycling'],
//         employment: {
//             company: 'TechCorp',
//             role: 'Engineer',
//             tenure: 3, // years
//         },
//     },
//     {
//         id: 2,
//         name: 'Bob',
//         age: 34,
//         city: 'Los Angeles',
//         address: {
//             street: '456 Elm St',
//             zipCode: '90001',
//         },
//         hobbies: ['photography', 'cooking', 'hiking'],
//         employment: {
//             company: 'MediaHub',
//             role: 'Content Creator',
//             tenure: 5, // years
//         },
//     },
//     {
//         id: 3,
//         name: 'Charlie',
//         age: 25,
//         city: 'Chicago',
//         address: {
//             street: '789 Oak Ave',
//             zipCode: '60611',
//         },
//         hobbies: ['gaming', 'basketball'],
//         employment: {
//             company: 'AdSolutions',
//             role: 'Analyst',
//             tenure: 1, // years
//         },
//     },
//     {
//         id: 4,
//         name: 'Diana',
//         age: 29,
//         city: 'Houston',
//         address: {
//             street: '321 Pine Rd',
//             zipCode: '77002',
//         },
//         hobbies: ['painting', 'yoga'],
//         employment: {
//             company: 'HealthFirst',
//             role: 'Nurse',
//             tenure: 4, // years
//         },
//     },
// ];

const data = [
    {
        id: 1,
        revenue: 1200.50,
        expenses: 450.75,
        details: {
            category: "Retail",
            region: "North"
        }
    },
    {
        id: 2,
        revenue: 980.00,
        expenses: 300.50,
        details: {
            category: "Wholesale",
            region: "West"
        }
    },
    {
        id: 3,
        revenue: 1500.75,
        expenses: 700.25,
        details: {
            category: "Online",
            region: "East"
        }
    },
    {
        id: 4,
        revenue: 2000.00,
        expenses: 1200.00,
        details: {
            category: "Corporate",
            region: "South"
        }
    },
    {
        id: 5,
        revenue: 850.25,
        expenses: 400.50,
        details: {
            category: "Retail",
            region: "Central"
        }
    }
];

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
            name: 'Revenue',
            render(row) {
                return row.data.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            }
        },
        {
            name: 'Expenses',
            render(row) {
                return row.data.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            },
            sortBy: null
        },
        {
            name: 'Net',
            render(row) {
                return (row.data.revenue - row.data.expenses).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            }
        },
    ],
    data: data,
    detailFn(row) {
        return 'x';
    },
    checkboxFn(row) {
        return null;
    },
    actionsFn(row) {
        return [
            {
                text: 'Set Revenue',
                fn() {
                   row.data.revenue = Number(prompt('Revenue was:'));
                }
            }
        ]
    },
    showSearch: true,
    theme: 'ice',
});
//@ts-ignore

// Seems like every time data changes, you should re-sort and re-filter
window.q = new Table({
    pageLength: 10,
    columns: [
        {
            name: 'count',
            render(row) {
                return row.data.count;
            }
        },
        {
            name: 'button',
            render(row) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = `Increase count: ${row.data.count}`;
                btn.addEventListener('click', () => row.data.count++);
                return btn;
            }
        },
        {
            name: 'button',
            render(row) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = `Increase count by 10: ${row.data.count}`;
                btn.addEventListener('click', () => row.data.count = row.data.count + 10);
                return btn;
            }
        },

    ],
    data: [
        {
            count: 1
        },
        {
            count: 100
        }
    ],
    // showSearch: true,
    theme: 'ice',
});
//@ts-ignore
document.body.append(window.x.element);