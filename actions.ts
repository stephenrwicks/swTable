import { Row } from './row.js';
import { actionsToRow } from './weakMaps.js';

export { Actions, ActionSettings };

type ActionSettings = Array<{
    text: string;
    fn(row: Row): any;
    disabled?(row: Row): boolean;
}>

class Actions {

    div = document.createElement('div');

    constructor() {
        this.div.classList.add('sw-table-actions-div');
    }

    render(settings: ActionSettings) {
        const row = actionsToRow.get(this);
        if (!row) throw new Error('SwTable - actions render');
        this.div.replaceChildren();
        for (const s of settings) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('sw-table-button');
            if (typeof s.disabled === 'function') btn.disabled = s.disabled(row);
            btn.addEventListener('click', async () => await s.fn(row));
            btn.textContent = s.text ?? '';
            this.div.append(btn);
        }
    }
}

