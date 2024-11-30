
import { css } from './css.js';
import { Detail } from './detail.js';
import { Actions } from './actions.js';
import { icons } from './icons.js';
import { Observable } from './observable.js';
import { rowToTable, rowToDetail, rowToActions, actionDivToActionButton } from './weakMaps.js';
export { Row };

class Row {

    #observable = new Observable();
    detailButton: HTMLButtonElement | null = null;
    checkbox: HTMLInputElement | null = null;
    actionsButton: HTMLButtonElement | null = null;
    rowId = crypto.randomUUID();
    cells: {[key: string]: HTMLTableCellElement | null} = {
        detail: null,
        checkbox: null,
        actions: null
    };
    

    get #table() {
        return rowToTable.get(this);
    }

    get index() {
        if (!this.#table) return -1;
        return this.#table.rows.indexOf(this);
    }

    render() {
        if (!this.#table) return;
        this.#tr.replaceChildren();
        if (this.#table.columnsObject.detail) {
            this.cells.detail ??= document.createElement('td');
            this.renderDetail();
            this.#tr.append(this.cells.detail);
        }
        for (const column of this.#table.columns) {
            if (!(column.colId in this.cells)) this.cells[column.colId] = document.createElement('td');
            const td = this.cells[column.colId];
            if (!td) throw new Error('SwTable row renderCells')
            if (column.render) td.replaceChildren(column.render(this));
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

    // These are rendering the contents, not the cells
    renderDetail() {
        if (!this.#table) return;
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
                this.detailButton.type = 'button';
                this.detailButton.classList.add(css.button, css.detailButton);
                this.detailButton.append(icons.chevron());
                this.detailButton.addEventListener('click', () => this.toggleDetail());
                this.cells.detail?.append(this.detailButton);
            }
        }
    }
    renderCheckbox() {
        if (!this.#table) return;
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
    renderActions() {
        if (!this.#table) return;
        const actionsArray = this.#table.actionsFn ? this.#table.actionsFn(this) : null;
        if (actionsArray === null) {
            if (this.#actions) actionDivToActionButton.delete(this.#actions.div);
            this.#actions?.div.remove();
            this.#actions = null;
            this.actionsButton?.remove();
            this.actionsButton = null
        }
        else {
            this.#actions ??= new Actions();
            this.#actions.render(actionsArray);
            if (this.actionsButton === null) {
                this.actionsButton = document.createElement('button');
                this.actionsButton.type = 'button';
                this.actionsButton.classList.add(css.button);
                this.actionsButton.append(icons.ellipsis());
                this.actionsButton.addEventListener('click', () => this.toggleActions());
                this.cells.actions?.append(this.actionsButton);
            }
            actionDivToActionButton.set(this.#actions.div, this.actionsButton);
        }
    }

    #tr = document.createElement('tr');
    get tr() {
        return this.#tr;
    }

    get data(): any {
        if (!this.#observable) return;
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

    get isSearchMatch(): boolean {
        if (!this.#table) return false;
        const searchInput = this.#table.searchInput;
        if (!searchInput) return true;
        const text = searchInput.value?.trim().toLowerCase();
        if (!text) return true;
        let els = [...this.tr.querySelectorAll('*:not(.sw-table-search-ignore *)') as any] as Array<Element>;
        if (this.#detail?.tr) els = [...els, ...this.#detail.tr.querySelectorAll('*:not(.sw-table-search-ignore *)') as any] as Array<Element>;
        return els.map(el => [...el.childNodes as any]
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent).join(' ')
            .toLowerCase())
            .some(str => str.includes(text));
    };

    get isFilterTrue() {
        if (!this.#table) return false;
        if (!this.isSearchMatch) return false;
        if (!this.#table.filters?.length) return true;
        return this.#table.filters.every(fn => fn(this));
    }


    get #detail() {
        return rowToDetail.get(this) ?? null;
    }
    set #detail(instance: Detail | null) {
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

    set #actions(instance: Actions | null) {
        if (instance instanceof Actions) {
            rowToActions.set(this, instance);
        }
        else {
            rowToActions.delete(this);
        }
    }

    #detailIsVisible = false;
    showDetail() {
        if (!this.#detail || this.#detailIsVisible) return;
        this.tr.after(this.#detail.tr);
        this.#detailIsVisible = true;
    }
    hideDetail() {
        if (!this.#detail || !this.#detailIsVisible) return;
        this.#detail.tr.remove();
        this.#detailIsVisible = false;
    }
    toggleDetail() {
        this.#detailIsVisible ? this.hideDetail() : this.showDetail();
    }
    // Could make this a method instead
    get isChecked() {
        if (!this.checkbox) return false;
        return this.checkbox.checked;
    }
    set isChecked(bool: boolean) {
        if (!this.checkbox) return;
        this.checkbox.checked = !!bool;
    }
    #actionsAreOpen = false;
    showActions() {
        if (!this.#actions || this.#actionsAreOpen) return;
        this.tr.classList.add('sw-table-tr-actions-open');
        this.#actionsAreOpen = true;
    }
    hideActions() {
        if (!this.#actions || !this.#actionsAreOpen) return;
        this.tr.classList.remove('sw-table-tr-actions-open');
        this.#actionsAreOpen = false;
    }
    toggleActions() {
        this.#actionsAreOpen ? this.hideActions() : this.showActions();
    }

    destroy() {
        // Need to update the page counter without re-rendering
        this.#table?.rows.splice(this.index, 1);
        rowToTable.delete(this);
        rowToActions.delete(this);
        rowToDetail.delete(this);
        this.#tr.remove();
        this.#tr = null as any;
        this.#observable.destroy();
        this.#observable = null as any;
    }

}