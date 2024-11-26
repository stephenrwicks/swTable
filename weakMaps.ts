import { Table } from './table.js';
import { Row } from './row.js'
import { Column } from './column.js';
import { Detail } from './detail.js';
import { Actions } from './actions.js';
export { rowToTable, columnToTable, rowToDetail, rowToActions, actionDivToActionButton };

const rowToTable: WeakMap<Row, Table> = new WeakMap();
const columnToTable: WeakMap<Column, Table> = new WeakMap();
const rowToDetail: WeakMap<Row, Detail> = new WeakMap();
const rowToActions: WeakMap<Row, Actions> = new WeakMap();
const actionDivToActionButton: WeakMap<HTMLDivElement, HTMLButtonElement> = new WeakMap();
// const detailToTable: WeakMap<Detail, Table> = new WeakMap();