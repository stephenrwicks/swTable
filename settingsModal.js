"use strict";
// import { ColumnSettings } from "./column.js";
// import { Row } from "./row.js";
// import { SwTable } from "./table.js";
// class FilterModal {
//     table: SwTable;
//     constructor(table: SwTable) {
//         this.table = table;
//         const dialog = document.createElement('dialog');
//     }
//     // Can probably persist one dialog rather than create / destroy. But maybe create / destroy is easier with dynamic settings
// }
// type FilterInit = {
//     label: string;
//     fn(row: Row): boolean;
// }
// class FilterBox {
//     div = document.createElement('div');
//     filters: Array<{
//         fn(row: Row): boolean;
//         checkbox: HTMLInputElement;
//     }> = [];
//     constructor(filters: Array<FilterInit>) {
//         this.div.classList.add('sw-table-filter-box');
//         // this.#filter = filter;
//         // this needs to return the objects that can be referenced later
//         for (const f of filters) {
//             const label = document.createElement('label');
//             const checkbox = document.createElement('input');
//             const span = document.createElement('span');
//             checkbox.classList.add('sw-table-checkbox');
//             label.classList.add('sw-table-filter-label');
//             span.textContent = f.label;
//             label.append(checkbox, span);
//             this.div.append(label);
//             this.filters.push({
//                 fn: f.fn, 
//                 checkbox
//             });
//         }
//     }
//     // This is the one filter that is passed into the aggregate SwTable.filters
//     evalulate(row: Row) {
//         const selectedFilters = this.filters.filter(f => f.checkbox.checked);
//         if (!selectedFilters.length) return true;
//         return selectedFilters.every(f => f.fn(row));
//     }
// }
