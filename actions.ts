import { Row } from './row.js';
import { actionsToRow } from './weakMaps.js';
import { DataObject } from './table.js';
export { Actions, ActionSettings };

type ActionSettings<T extends DataObject> = Array<{
    text: string;
    fn(row: Row<T>): any;
    disabled?(row: Row<T>): boolean;
}>

class Actions<T extends DataObject>  {

    div = document.createElement('div');

    constructor() {
        this.div.classList.add('sw-table-actions-div');
    }

    render(settings: ActionSettings<T>) {
        const row = actionsToRow.get(this);
        if (!row) throw new Error('SwTable - actions render');
        this.div.replaceChildren();
        for (const s of settings) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('sw-table-button');
            if (typeof s.disabled === 'function') btn.disabled = !!s.disabled(row);
            btn.addEventListener('click', () => s.fn(row));
            btn.textContent = s.text ?? '';
            this.div.append(btn);
        }
    }
}

