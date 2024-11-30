import { css } from './css.js';
import { Detail } from './detail.js';
import { Actions } from './actions.js';
import { icons } from './icons.js';
import { Observable } from './observable.js';
import { rowToTable, actionsToRow } from './weakMaps.js';
export { Row };
class Row {
    #observable = new Observable();
    detailButton = null;
    rowId = crypto.randomUUID();
    cells = {
        detail: null,
        checkbox: null,
        actions: null
    };
    get #table() {
        return rowToTable.get(this);
    }
    get index() {
        if (!this.#table)
            return -1;
        return this.#table.rows.indexOf(this);
    }
    render() {
        if (!this.#table)
            return;
        // The focused element is being completely re-rendered 
        this.#tr.replaceChildren();
        if (this.#table.columnsObject.detail) {
            this.cells.detail ??= document.createElement('td');
            this.renderDetail();
            this.#tr.append(this.cells.detail);
        }
        for (const column of this.#table.columns) {
            // const focusEl = document.querySelector(':focus');
            if (!(column.colId in this.cells))
                this.cells[column.colId] = document.createElement('td');
            const td = this.cells[column.colId];
            if (!td)
                throw new Error('SwTable row render');
            if (column.render)
                td.replaceChildren(column.render(this));
            // Somehow detect if the new re-rendered element in this cell is the same as the one that was focused
            // Losing focus is a huge challenge since there's no diffing 
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
                this.detailButton.type = 'button';
                this.detailButton.classList.add(css.button, css.detailButton);
                this.detailButton.append(icons.chevron());
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
            this.checkbox.classList.add(css.checkbox);
            this.checkbox.type = 'checkbox';
            this.cells.checkbox?.append(this.checkbox);
        }
        else {
            this.checkbox?.remove();
            this.checkbox = null;
        }
    }
    #actions = null;
    actionsButton = null;
    renderActions() {
        if (!this.#table)
            return;
        const actionsArray = this.#table.actionsFn ? this.#table.actionsFn(this) : null;
        if (actionsArray === null) {
            this.#actions?.div.remove();
            if (this.#actions)
                actionsToRow.delete(this.#actions);
            this.#actions = null;
            this.actionsButton?.remove();
            this.actionsButton = null;
        }
        else {
            if (!Array.isArray(actionsArray))
                throw new Error('swTable - Actions have to be an array.');
            this.#actions ??= new Actions();
            actionsToRow.set(this.#actions, this);
            this.#actions.render(actionsArray);
            if (this.actionsButton === null) {
                this.actionsButton = document.createElement('button');
                this.actionsButton.type = 'button';
                this.actionsButton.classList.add(css.button, 'sw-table-actions-button');
                this.actionsButton.append(icons.ellipsis());
                this.actionsButton.addEventListener('click', () => this.toggleActions());
                this.cells.actions?.append(this.actionsButton);
            }
        }
    }
    #tr = document.createElement('tr');
    get tr() {
        return this.#tr;
    }
    get data() {
        if (!this.#observable)
            return;
        return this.#observable.proxy;
    }
    set data(data) {
        this.#observable.target = data;
        this.#observable.callbacks = [];
        this.#observable.callbacks.push(this.render.bind(this));
        this.render();
    }
    get dataTarget() {
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
        if (!this.#table.filters?.length)
            return true;
        return this.#table.filters.every(fn => fn(this));
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
        if (!this.#actions || this.#actionsAreOpen || !this.actionsButton || !this.cells.actions)
            return;
        this.cells.actions.append(this.#actions.div);
        document.addEventListener('click', this.#dismissActionsEvent);
        this.#actionsAreOpen = true;
    }
    hideActions() {
        if (!this.#actions || !this.#actionsAreOpen)
            return;
        this.#actionsAreOpen = false;
        this.#actions.div.remove();
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
        // Need to update the page counter without re-rendering
        this.#table?.rows.splice(this.index, 1);
        this.detail = null;
        this.checkbox = null;
        if (this.#actions)
            actionsToRow.delete(this.#actions);
        this.#actions = null;
        rowToTable.delete(this);
        this.#tr.remove();
        this.#tr = null;
        this.#observable.destroy();
        this.#observable = null;
    }
}
