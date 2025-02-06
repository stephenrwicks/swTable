import { Column } from "./column";
import { Row } from "./row";
import { SwTable } from "./table";

export { rowToTable, columnToTable };

// Difficult to type this correctly with the generic
const rowToTable = new WeakMap();
const columnToTable = new WeakMap();