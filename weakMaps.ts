import { Table } from './table.js';
import { Row } from './row.js'
import { Column, BuiltInColumn } from './column.js';
import { Actions } from './actions.js';
export { rowToTable, columnToTable, actionsToRow };

const rowToTable: WeakMap<Row, Table> = new WeakMap();
const columnToTable: WeakMap<Column | BuiltInColumn, Table> = new WeakMap();
const actionsToRow: WeakMap<Actions, Row> = new WeakMap();