import { SwTable } from './table.js';
import { Row } from './row.js'
import { Column, BuiltInColumn } from './column.js';
import { Actions } from './actions.js';
export { rowToTable, columnToTable, actionsToRow };

const rowToTable: WeakMap<Row, SwTable> = new WeakMap();
const columnToTable: WeakMap<Column | BuiltInColumn, SwTable> = new WeakMap();
const actionsToRow: WeakMap<Actions, Row> = new WeakMap();