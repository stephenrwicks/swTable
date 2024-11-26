import { css } from './css.js';
import { Detail } from './detail.js';
import { Actions } from './actions.js';
import { icons } from './icons.js';
import { Observable } from './observable.js';
import { rowToTable, rowToDetail, rowToActions, actionDivToActionButton } from './weakMaps.js';
export { Row };
class Row {
    #observable = new Observable();
    detailButton = null;
    detailTd = null;
    checkboxTd = null;
    checkbox = null;
    actionsButton = null;
    actionsTd = null;
    constructor() {
        this.#tr.classList.add(css.tr);
    }
    get #table() {
        return rowToTable.get(this);
    }
    get index() {
        if (!this.#table)
            return -1;
        return this.#table.rows.indexOf(this);
    }
    #isRendered = false;
    render() {
        // Render all
        if (!this.#table)
            return;
        this.#isRendered = false;
        this.renderCells();
        this.renderDetail();
        this.renderCheckbox();
        this.renderActions();
        this.#isRendered = true;
    }
    renderCells() {
        if (!this.#table)
            return;
        //this.#tr.replaceChildren(); // Don't do this
        // Need something like this where we ignore the auto-cells.
        // However, this will get things out of order eventually, so I need a smarter idea
        // Need to group stuff
        const cells = [...this.#tr.cells].filter(cell => cell !== this.actionsTd && cell !== this.checkboxTd && cell !== this.detailTd);
        for (const cell of cells)
            cell.remove();
        for (const column of this.#table.columns) {
            const td = document.createElement('td');
            td.dataset.colId = column.colId;
            td.classList.add(css.td);
            if (column.render)
                td.append(column.render(this));
            this.#tr.append(td);
        }
    }
    renderDetail() {
        if (!this.#table)
            return;
        const detailContents = this.#table.detailFn ? this.#table.detailFn(this) : null;
        if (detailContents === null) {
            this.#detail?.tr.remove();
            this.#detail = null;
            this.detailButton?.remove();
            this.detailButton = null;
        }
        else {
            this.#detail ??= new Detail();
            this.#detail.render(detailContents, this.#table.colSpan);
            if (this.detailButton === null) {
                this.detailButton = document.createElement('button');
                this.detailButton.classList.add(css.detailButton);
                this.detailButton.append(icons.chevron());
                this.detailButton.addEventListener('click', () => this.toggleDetail());
            }
        }
    }
    renderCheckbox() {
        if (!this.#table)
            return;
        if (typeof this.#table.checkboxFn === 'function' && this.#table.checkboxFn(this)) {
            this.checkbox ??= document.createElement('input');
            this.checkbox.type = 'checkbox';
            this.checkboxTd?.append(this.checkbox);
        }
        else {
            this.checkbox?.remove();
            this.checkbox = null;
        }
    }
    renderActions() {
        if (!this.#table)
            return;
        const actionsArray = this.#table.actionsFn ? this.#table.actionsFn(this) : null;
        if (actionsArray === null) {
            if (this.#actions)
                actionDivToActionButton.delete(this.#actions.div);
            this.#actions?.div.remove();
            this.#actions = null;
            this.actionsButton?.remove();
            this.actionsButton = null;
        }
        else {
            this.#actions ??= new Actions();
            this.#actions.render(actionsArray);
            if (this.actionsButton === null) {
                this.actionsButton = document.createElement('button');
                this.actionsButton.classList.add(css.actionsButton);
                this.actionsButton.append(icons.ellipsis());
                this.actionsButton.addEventListener('click', () => this.toggleActions());
            }
            actionDivToActionButton.set(this.#actions.div, this.actionsButton);
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
        this.#observable.clearCallbacks();
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
        if (this.#detail?.tr)
            els = [...els, ...this.#detail.tr.querySelectorAll('*:not(.sw-table-search-ignore *)')];
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
    get #detail() {
        return rowToDetail.get(this) ?? null;
    }
    set #detail(instance) {
        if (instance instanceof Detail) {
            rowToDetail.set(this, instance);
        }
        else {
            rowToDetail.delete(this);
        }
    }
    get #actions() {
        return rowToActions.get(this) ?? null;
    }
    set #actions(instance) {
        if (instance instanceof Actions) {
            rowToActions.set(this, instance);
        }
        else {
            rowToActions.delete(this);
        }
    }
    #detailIsVisible = false;
    showDetail() {
        if (!this.#detail || this.#detailIsVisible)
            return;
        this.tr.after(this.#detail.tr);
        this.tr.classList.add(css.detailIsOpen);
        this.#detailIsVisible = true;
    }
    hideDetail() {
        if (!this.#detail || !this.#detailIsVisible)
            return;
        this.#detail.tr.remove();
        this.tr.classList.remove(css.detailIsOpen);
        this.#detailIsVisible = false;
    }
    toggleDetail() {
        this.#detailIsVisible ? this.hideDetail() : this.showDetail();
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
    }
    #actionsAreOpen = false;
    showActions() {
        if (!this.#actions || this.#actionsAreOpen)
            return;
        this.tr.classList.add('sw-table-tr-actions-open');
        this.#actionsAreOpen = true;
    }
    hideActions() {
        if (!this.#actions || !this.#actionsAreOpen)
            return;
        this.tr.classList.remove('sw-table-tr-actions-open');
        this.#actionsAreOpen = false;
    }
    toggleActions() {
        this.#actionsAreOpen ? this.hideActions() : this.showActions();
    }
    destroy() {
        rowToTable.delete(this);
        rowToActions.delete(this);
        rowToDetail.delete(this);
        this.#tr.remove();
        this.#tr = null;
        this.#observable.destroy();
        this.#observable = null;
    }
}