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
        this.#tr.dataset.uuid = this.rowId;
    }
    get #table() {
        return rowToTable.get(this);
    }
    get index() {
        if (!this.#table)
            return -1;
        return this.#table.rows.indexOf(this);
    }
    moveTo(index) {
        // We wouldn't want this to work the same way as columns. SortOrder also doesn't exist
    }
    render() {
        if (!this.#table)
            return;
        this.#tr.replaceChildren();
        if (this.#table.columnsObject.detail) {
            this.cells.detail ??= document.createElement('td');
            this.renderDetail();
            this.#tr.append(this.cells.detail);
        }
        for (const column of this.#table.columns) {
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
        if (this.#table.columnsObject.actions) {
            this.cells.actions ??= document.createElement('td');
            this.renderActions();
            this.#tr.append(this.cells.actions);
        }
        if (this.#table.columnsObject.checkbox) {
            this.cells.checkbox ??= document.createElement('td');
            this.renderCheckbox();
            this.#tr.append(this.cells.checkbox);
        }
    }
    detail = null;
    detailButton = null;
    // These are rendering the contents, not the cells
    renderDetail() {
        if (!this.#table)
            return;
        const detailContents = this.#table.detailFn ? this.#table.detailFn(this) : null;
        if (detailContents === null) {
            this.detail?.tr.remove();
            this.detail = null;
            this.detailButton?.remove();
            this.detailButton = null;
        }
        else {
            this.detail ??= new Detail();
            this.detail.render(detailContents, this.#table.colSpan);
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
        if (!this.#table)
            return;
        if (typeof this.#table.checkboxFn === 'function' && this.#table.checkboxFn(this)) {
            this.checkbox ??= document.createElement('input');
            this.checkbox.classList.add('sw-table-checkbox');
            this.checkbox.type = 'checkbox';
            this.tr.dataset.isChecked = String(!!this.checkbox?.checked);
            this.checkbox.addEventListener('change', () => {
                this.#table?.updateSelectAllCheckbox();
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
        if (!this.#table)
            return;
        const actionsArray = typeof this.#table.actionsFn === 'function' ? this.#table.actionsFn(this) : null;
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
        if (!this.#table)
            return null;
        if (typeof this.#table.actionsFn !== 'function')
            return null;
        const actions = this.#table.actionsFn(this);
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
        this.#observable.callbacks = [];
        this.#observable.callbacks.push(this.render.bind(this), () => this.#table._renderSummary());
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
        if (!this.#table)
            return false;
        const searchInput = this.#table.searchInput;
        if (!searchInput)
            return true;
        const text = searchInput.value?.trim().toLowerCase();
        if (!text)
            return true;
        let els = [...this.tr.querySelectorAll('*:not(.sw-table-search-ignore *)')];
        if (this.detail?.tr)
            els = [...els, ...this.detail.tr.querySelectorAll('*:not(.sw-table-search-ignore *)')];
        return els.map(el => [...el.childNodes]
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent).join(' ')
            .toLowerCase())
            .some(str => str.includes(text));
    }
    ;
    get isFilterTrue() {
        if (!this.#table)
            return false;
        if (!this.isSearchMatch)
            return false;
        // Check filter boxes
        if (!this.#table.filters?.length)
            return true;
        return this.#table.filters.every((fn) => fn(this));
    }
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
        // Arrow function maintains "this" context
        if (this.cells.actions && this.cells.actions.contains(e.target))
            return;
        this.hideActions();
    };
    destroy() {
        this.#table?.rows.splice(this.index, 1);
        this.detail = null;
        if (this.checkbox)
            this.#table?.updateSelectAllCheckbox();
        this.checkbox = null;
        this.#tr.remove();
        this.#tr = null;
        this.#observable.destroy();
        this.#observable = null;
        this.detailButton = null;
        this.actionsButton = null;
        this.#table?.goToPage(this.#table.currentPage);
        rowToTable.delete(this);
    }
}
