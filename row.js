import { Detail } from './detail.js';
import { Observable } from './observable.js';
import { rowToTable } from './weakMaps.js';
export { Row };
class Row {
    // Force initialization with an empty object that is typed as T
    #observable = new Observable({});
    rowId = crypto.randomUUID();
    cells = {
        detail: null,
        checkbox: null,
        actions: null
    };
    constructor() {
        this.#tr.dataset.id = this.rowId;
    }
    #getTable() {
        return rowToTable.get(this);
    }
    get index() {
        const t = this.#getTable();
        if (!t)
            return -1;
        return t.rows.indexOf(this);
    }
    moveTo(index) {
        // We wouldn't want this to work the same way as columns. SortOrder also doesn't exist
    }
    render() {
        const t = this.#getTable();
        if (!t)
            return;
        this.#tr.replaceChildren();
        if (t.columnsObject.detail) {
            this.cells.detail ??= document.createElement('td');
            this.renderDetail();
            this.#tr.append(this.cells.detail);
        }
        for (const column of t.columns) {
            if (!column.isShowing)
                continue; // Skip hidden columns
            this.cells[column.colId] ??= document.createElement('td');
            const td = this.cells[column.colId];
            if (!td)
                throw new Error('SwTable row render');
            if (column.render)
                td.replaceChildren(column.render(this));
            this.#tr.append(td);
        }
        if (t.columnsObject.actions) {
            this.cells.actions ??= document.createElement('td');
            this.renderActions();
            this.#tr.append(this.cells.actions);
        }
        if (t.columnsObject.checkbox) {
            this.cells.checkbox ??= document.createElement('td');
            this.renderCheckbox();
            this.#tr.append(this.cells.checkbox);
        }
    }
    detail = null;
    detailButton = null;
    // These are rendering the contents, not the cells
    renderDetail() {
        const t = this.#getTable();
        if (!t)
            return;
        const detailContents = t.detailFn ? t.detailFn(this) : null;
        if (detailContents === null) {
            this.detail?.tr.remove();
            this.detail = null;
            this.detailButton?.remove();
            this.detailButton = null;
        }
        else {
            this.detail ??= new Detail();
            this.detail.render(detailContents, t.colSpan);
            if (this.detailButton === null) {
                this.detailButton = document.createElement('button');
                const icon = document.createElement('div');
                icon.className = 'sw-table-icon sw-table-chevron';
                this.detailButton.type = 'button';
                this.detailButton.title = 'Toggle Details';
                this.detailButton.classList.add('sw-table-button', 'sw-table-detail-button', 'sw-table-button-circle');
                this.detailButton.append(icon);
                this.detailButton.addEventListener('click', () => this.toggleDetail());
                this.cells.detail?.append(this.detailButton);
            }
        }
    }
    checkbox = null;
    renderCheckbox() {
        const t = this.#getTable();
        if (!t)
            return;
        if (typeof t.checkboxFn === 'function' && t.checkboxFn(this)) {
            this.checkbox ??= document.createElement('input');
            this.checkbox.classList.add('sw-table-checkbox');
            this.checkbox.type = 'checkbox';
            this.tr.dataset.isChecked = String(!!this.checkbox?.checked);
            this.checkbox.addEventListener('change', () => {
                t?.updateSelectAllCheckbox();
                this.tr.dataset.isChecked = String(!!this.checkbox?.checked);
            });
            this.cells.checkbox?.append(this.checkbox);
        }
        else {
            this.checkbox?.remove();
            this.checkbox = null;
        }
    }
    actionsButton = null;
    renderActions() {
        const t = this.#getTable();
        if (!t)
            return;
        const actionsArray = typeof t.actionsFn === 'function' ? t.actionsFn(this) : null;
        if (!Array.isArray(actionsArray) || !actionsArray.length) {
            this.actionsButton?.remove();
            this.actionsButton = null;
        }
        else if (this.actionsButton === null) {
            this.actionsButton = document.createElement('button');
            const icon = document.createElement('div');
            icon.className = 'sw-table-icon sw-table-ellipsis';
            this.actionsButton.type = 'button';
            this.actionsButton.title = 'Toggle Actions';
            this.actionsButton.className = 'sw-table-button sw-table-actions-button sw-table-button-circle';
            this.actionsButton.addEventListener('click', () => this.toggleActions());
            this.actionsButton.append(icon);
            this.cells.actions?.append(this.actionsButton);
        }
    }
    #buildActionsDiv() {
        const t = this.#getTable();
        if (!t)
            return null;
        if (typeof t.actionsFn !== 'function')
            return null;
        const actions = t.actionsFn(this);
        if (!actions)
            return null;
        if (!actions.length)
            return null;
        const div = document.createElement('div');
        div.classList.add('sw-table-actions-div');
        for (const item of actions) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('sw-table-button');
            if (typeof item.disabled === 'function')
                btn.disabled = !!item.disabled();
            btn.addEventListener('click', () => {
                item.fn();
                this.hideActions();
            });
            btn.textContent = item.text ?? '';
            div.append(btn);
        }
        return div;
    }
    #tr = document.createElement('tr');
    get tr() {
        return this.#tr;
    }
    // The table should be displaying the target, not the proxied data.
    // Displaying proxied data will work, but requires more overhead
    setData(data) {
        this.#observable.target = data;
        this.#observable.callbacks = [
            () => this.render(),
            () => this.#getTable()?._renderSummaries()
        ];
        this.render();
    }
    get $data() {
        // We return the Proxy as type T so that regular type inference can be useful
        return this.#observable.proxy;
    }
    get data() {
        return this.#observable.target;
    }
    get dataSnapshot() {
        return structuredClone(this.#observable.target);
    }
    get isSearchMatch() {
        // Gets all text nodes at the top level of each element in the row and detail row.
        // This prevents false positives due to nested elements.
        // Therefore we can exclude certain elements by giving them an "ignore" class
        // 3-15-25 I tried to make this efficient by removing spreads, filters, maps, etc
        // and just using for...of with as much short circuiting as possible
        const t = this.#getTable();
        if (!t)
            return false;
        const searchInput = t.searchInput;
        if (!searchInput.value)
            return true;
        const searchText = searchInput.value?.trim().toLowerCase();
        if (!searchText)
            return true;
        for (const el of this.tr.querySelectorAll('*:not(.sw-table-search-ignore *)')) {
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent?.toLowerCase().includes(searchText))
                    return true;
            }
        }
        if (!this.detail?.tr)
            return false;
        for (const el of this.detail?.tr.querySelectorAll('*:not(.sw-table-search-ignore *)')) {
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent?.toLowerCase().includes(searchText))
                    return true;
            }
        }
        return false;
    }
    ;
    get isFilterTrue() {
        console.log('isFilterTrue fired');
        const t = this.#getTable();
        if (!t)
            return false;
        if (!this.isSearchMatch)
            return false;
        if (t.uiFilters?.length && t.uiFilters?.some(filter => filter.isActive && !filter.fn(this)))
            return false;
        if (t.filters?.length && t.filters?.some(fn => !fn(this)))
            return false;
        return true;
    }
    // I don't get why this is 3 methods but then other things are just get/set
    detailIsVisible = false;
    showDetail() {
        if (!this.detail || this.detailIsVisible)
            return;
        this.tr.after(this.detail.tr);
        this.detailIsVisible = true;
    }
    hideDetail() {
        if (!this.detail || !this.detailIsVisible)
            return;
        this.detail.tr.remove();
        this.detailIsVisible = false;
    }
    toggleDetail() {
        this.detailIsVisible ? this.hideDetail() : this.showDetail();
    }
    // Could make this a method instead
    get isChecked() {
        if (!this.checkbox)
            return false;
        return this.checkbox.checked;
    }
    set isChecked(bool) {
        if (!this.checkbox)
            return;
        this.checkbox.checked = !!bool;
        this.tr.dataset.isChecked = String(!!bool);
    }
    #actionsAreOpen = false;
    showActions() {
        if (this.#actionsAreOpen || !this.actionsButton || !this.cells.actions)
            return;
        const actionsDiv = this.#buildActionsDiv();
        if (!actionsDiv)
            return;
        this.cells.actions.append(actionsDiv);
        document.addEventListener('click', this.#dismissActionsEvent);
        this.#actionsAreOpen = true;
    }
    hideActions() {
        if (!this.#actionsAreOpen)
            return;
        this.#actionsAreOpen = false;
        this.cells.actions?.querySelector('.sw-table-actions-div')?.remove();
        document.removeEventListener('click', this.#dismissActionsEvent);
    }
    toggleActions() {
        this.#actionsAreOpen ? this.hideActions() : this.showActions();
    }
    #dismissActionsEvent = (e) => {
        // Arrow to preserve this context
        if (this.cells.actions && this.cells.actions.contains(e.target))
            return;
        this.hideActions();
    };
    destroy() {
        const t = this.#getTable();
        t?.rows.splice(this.index, 1);
        this.detail = null;
        if (this.checkbox)
            t?.updateSelectAllCheckbox();
        this.checkbox = null;
        this.#tr.remove();
        this.#tr = null;
        this.#observable.destroy();
        this.#observable = null;
        this.detailButton = null;
        this.actionsButton = null;
        t?.goToPage(t.currentPage);
        rowToTable.delete(this);
    }
}
