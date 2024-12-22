import { SwTable } from "./table.js";

class FilterModal {
    table: SwTable;
    constructor(table: SwTable) {
        this.table = table;
        const dialog = document.createElement('dialog');
    }

    // Can probably persist one dialog rather than create / destroy. But maybe create / destroy is easier with dynamic settings
}