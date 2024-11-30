export { rowToTable, columnToTable, rowToDetail, rowToActions, actionDivToActionButton };
const rowToTable = new WeakMap();
const columnToTable = new WeakMap();
const rowToDetail = new WeakMap();
const rowToActions = new WeakMap();
const actionDivToActionButton = new WeakMap();
// const columnsObject: { [key: string]: Column | BuiltInColumn | null } = {
//     detail: null,
//     checkbox: null,
//     actions: null
// };
// const detailToTable: WeakMap<Detail, Table> = new WeakMap();
