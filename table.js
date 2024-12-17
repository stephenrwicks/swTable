// Paging buttons, paging dropdown
// Filters, FilterBox, FilterModal? -- Use sliders icon
// show/hide column options
// Fix colspan issues
// CSS Themes and additions, icon hovers
// Horizontal scroll + resizable
// Generic typed data
// Functional actions button disabled
// Row actions setter
// Move / drag row
// Lazy render
// Editable, crud modal, etc.
// Preserving focus
// Improve column drag
// Automatic init
// Init from html
import { Column, BuiltInColumn } from './column.js';
import { Row } from './row.js';
import { rowToTable, columnToTable } from './weakMaps.js';
import { icons } from './icons.js';
export { Table };
class Table {
    #els = {
        wrapper: document.createElement('div'),
        table: document.createElement('table'),
        thead: document.createElement('thead'),
        headerTd: document.createElement('td'),
        headerDiv: document.createElement('div'),
        columnTr: document.createElement('tr'),
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
    columnsObject = {
        detail: null,
        checkbox: null,
        actions: null
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
        this.renderColumnTr();
        if (settings.data?.length) {
            for (const datum of settings.data) {
                this.insertRow(datum);
            }
        }
        this.pageLengthOptions = settings.pageLengthOptions ?? [0];
        this.pageLength = Array.isArray(this.pageLengthOptions) ? this.pageLengthOptions[0] : 0;
        settings.showSearch ??= true;
        this.showSearch = !!settings.showSearch;
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
        this.#els.prevPageButton.classList.add('sw-table-button', 'sw-table-prev-page-button', 'sw-table-button-circle');
        this.#els.nextPageButton.classList.add('sw-table-button', 'sw-table-next-page-button', 'sw-table-button-circle');
        this.#els.nextPageButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.#els.prevPageButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.#els.nextPageButton.append(icons.chevron());
        this.#els.prevPageButton.append(icons.chevron());
    }
    setData(data) {
        this.data = data;
    }
    get data() {
        return this.rows.map(row => row.data);
    }
    set data(data) {
        while (this.rows.length) {
            this.rows[0].destroy();
        }
        for (const datum of data) {
            this.insertRow(datum);
        }
        this.goToPage(1);
    }
    get dataTarget() {
        return this.rows.map(row => row.dataTarget);
    }
    get dataSnapshot() {
        return this.rows.map(row => row.dataSnapshot);
    }
    get element() {
        return this.#els.wrapper;
    }
    get colSpan() {
        return this.#els.columnTr.children.length;
    }
    get columns() {
        // The compiler was complaining a lot about this method until I broke it up into 3 lines
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
    #rows = [];
    get rows() {
        return this.#rows;
    }
    renderPage(targetPage) {
        // To optimize, each row could have a "state" object
        for (const row of this.rowsCurrentPage) {
        }
        // Fewer loops
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
            this.#els.tbody.append(row.tr);
        }
    }
    // This is where the detailRow is defined
    #detailFn = null;
    get detailFn() {
        return this.#detailFn;
    }
    set detailFn(fn) {
        this.#detailFn = fn;
        if (typeof this.#detailFn === 'function') {
            this.columnsObject.detail ??= new BuiltInColumn('detail');
        }
        else {
            this.columnsObject.detail?.destroy();
        }
        if (!this.rows.length)
            return;
        this.renderColumnTr();
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
        if (typeof this.#checkboxFn === 'function') {
            this.columnsObject.checkbox ??= new BuiltInColumn('checkbox');
            this.columnsObject.checkbox.th.append(this.#els.selectAllCheckbox);
        }
        else {
            this.columnsObject.checkbox?.destroy();
        }
        if (!this.rows.length)
            return;
        this.renderColumnTr();
        for (const row of this.rows)
            row.render();
    }
    #actionsFn = null;
    get actionsFn() {
        return this.#actionsFn;
    }
    set actionsFn(fn) {
        this.#actionsFn = fn;
        if (typeof this.#actionsFn === 'function') {
            this.columnsObject.actions ??= new BuiltInColumn('actions');
        }
        else {
            this.columnsObject.actions?.destroy();
        }
        if (!this.rows.length)
            return;
        this.renderColumnTr();
        for (const row of this.rows)
            row.render();
    }
    #filters = null;
    get filters() {
        return this.#filters;
    }
    set filters(filters) {
        this.#filters = filters;
        this.goToPage(1);
    }
    #pageLengthOptions = null;
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
        console.log('x');
    }
    #showSearch = false;
    searchInput = null;
    get showSearch() {
        return this.#showSearch;
    }
    set showSearch(bool) {
        bool = !!bool;
        if (!this.#showSearch && bool) {
            const searchWrapper = document.createElement('div');
            searchWrapper.classList.add('sw-table-search-wrapper');
            const searchIcon = icons.magnifyingGlass();
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
    set currentPage(n) {
        this.goToPage(n);
    }
    get numberOfPages() {
        if (this.#pageLength === 0)
            return 1;
        return Math.ceil(this.rowsFilterTrue.length / this.#pageLength);
    }
    get rowsFilterTrue() {
        return this.rows.filter(row => row.isFilterTrue);
    }
    get #rowsFilterTruePartitionedByPage() {
        if (this.#pageLength === 0)
            return [this.rowsFilterTrue]; // If pageLength is 0, one page
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
        for (const row of this.rowsFilterTrue)
            row.isChecked = true;
    }
    uncheckAllRows() {
        for (const row of this.rowsFilterTrue)
            row.isChecked = false;
    }
    toggleCheckAllRows() {
        if (this.rowsFilterTrue.filter(row => !!row.checkbox).some(row => !row.isChecked)) {
            this.checkAllRows();
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
        this.#els.tbody.replaceChildren();
        this.#currentPage = n;
        const rowsToShow = this.rowsCurrentPage;
        rowsToShow.forEach((row, i) => {
            row.tr.className = i % 2 === 1 ? 'sw-table-tr-odd' : '';
            this.#els.tbody.append(row.tr);
            if (row.detail && row.detailIsVisible)
                this.#els.tbody.append(row.detail.tr);
        });
        const first = this.rowsFilterTrue.indexOf(rowsToShow[0]) + 1;
        const last = this.rowsFilterTrue.indexOf(rowsToShow[rowsToShow.length - 1]) + 1;
        this.#els.tfootTd.colSpan = this.colSpan;
        this.#els.pageNumberDiv.textContent = `Showing ${first}-${last} of ${this.rowsFilterTrue.length}`;
        this.#els.nextPageButton.style.visibility = this.currentPage < this.numberOfPages ? 'visible' : 'hidden';
        this.#els.prevPageButton.style.visibility = this.currentPage > 1 ? 'visible' : 'hidden';
    }
    renderColumnTr() {
        this.#els.columnTr.replaceChildren();
        if (this.columnsObject.detail)
            this.#els.columnTr.append(this.columnsObject.detail.th);
        for (const column of this.columns) {
            if (column === null)
                continue;
            this.#els.columnTr.append(column.th);
        }
        if (this.columnsObject.actions)
            this.#els.columnTr.append(this.columnsObject.actions.th);
        if (this.columnsObject.checkbox)
            this.#els.columnTr.append(this.columnsObject.checkbox.th);
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
    },
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
    },
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
    },
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
    },
];
//@ts-ignore
window.x = new Table({
    // pageLength: 4,
    pageLengthOptions: [5, 10],
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
        return row.data.id > 2;
    },
    actionsFn(row) {
        return [
            {
                text: 'Set Revenue',
                fn() {
                    row.data.revenue = Number(prompt('Revenue was:'));
                }
            },
            {
                text: 'Delete Row',
                fn() {
                    row.destroy();
                }
            }
        ];
    },
    showSearch: true,
    theme: 'ice',
});
//@ts-ignore
// Seems like every time data changes, you should re-sort and re-filter
window.q = new Table({
    pageLength: 10,
    pageLengthOptions: [5, 12],
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
