# SwTable
document updated 2/21/2025

This is a work in progress.

[[_TOC_]]

## Overview

HTML table.

A reactive data grid utility for vanilla TS or JS.

No dependencies.

Automatically updates the DOM when data is modified, and automatically updates the DOM when settings are changed at any time.

Fully featured with
- object-oriented data access,
- paging, 
- customizable filtering,
- sorting (automatic or customizable sorting), 
- text searching,
- functional cell rendering,
- computed property display,
- show/hide columns,
- draggable, reorderable columns, 
- selectable rows,
- expandable detail rows, 
- custom actions on each row,
- customizable summary footer for totals, etc.,
- data snapshots,
- CSS theming,
- etc.

I have used some other grids like this and they didn't do everything I wanted and they were difficult to use so I made my own. 

The table object maintains each of its rows in state. Each row can be modified independently.

I think as a developer there is a lot of value in reinventing the wheel because I come up against and solve a lot of lower-level front-end issues that others might skip over.

The focus of this project is its internal Observable class. Each row's data is wrapped in Proxy objects that intercept _set_ operations to notify the DOM to update whenever data changes. The observed data for each row is accessed through the $data property for that row, like this:

```
table.rows[0].$data.name = 'Stephen' 

// Render callback for Row 0 is fired, and custom cell renderings are triggered.
```

This table makes use of many custom getters/setters. This allows for side effects when properties are modified. For example, updating a setting will update the DOM directly. In this documentation I make note of what uses getter/setter and what firing the setter does.

---

## Creating a table

Create an instance of the `SwTable` class. Pass in the settings object (SwTableSettings).

```
// 'settings' is a SwTableSettings object
const myTable = new SwTable(settings); 
```

Then append the .element to the DOM wherever you want.

```
// .element is a div wrapping an HTML table and its related UI
document.body.append(myTable.element); 
```
---
## SwTableSettings object
```
type SwTableSettings = {
    columns: Array<ColumnSettings>;
    data?: Array<any>;
    showSearch?: boolean;
    pageLength?: number;
    pageLengthOptions?: Array<number>;
    detailFn?(row: Row): HTMLElement | string | null;
    checkboxFn?(row: Row): boolean;
    actionsFn?(row: Row): ActionSettings | null;
    theme?: 'mint' | 'ice';
}
```
- `columns` (required):  

  An array of `ColumnSettings` that defines the columns to be displayed in the table.

  This is the most important setting because it defines how the table behaves.

  You can add or remove columns after initialization.

- `theme` (optional):  

  Available options:  
  - `'mint'`  
  - `'ice'`  

  Leaving this undefined will give you the default theme. All this does is initialize the data-sw-table-theme attribute, which is used in the CSS.

  ### The rest of the following options are just initial values of identical properties in the SwTable object. You can set them on initialization, or any time after:

- `data` (optional):  

  An array of objects that represent the data. Each object is a row.

  Each row's data object can have nested objects or arrays.

- `showSearch` (optional):  

  A boolean to enable or disable the search functionality. Defaults to `true`.

- `pageLength` (optional):  

  A number defining the number of rows displayed per page.  
  If set to `0`, all rows will be displayed.

- `pageLengthOptions` (optional):  

  An array of numbers representing the available page length options for pagination.

- `detailFn` (optional):  

  A function that takes a `Row` as a parameter and returns:  
  - An `HTMLElement`  
  - A string  
  - `null`  
  
  Return what you want to display in the detail row.

  Because you have the `Row` object in hand, you can conditionally display different details for each row.

  If you return null, the row will not have a detail row. 
  
  If the data for a row changes, the detail row will automatically update on the DOM.

  Leave this function undefined to leave out detail rows altogether.

- `checkboxFn` (optional):

  A function that takes a `Row` as a parameter and returns a boolean.  

  Return true if you want to show a checkbox for that row.

  Because you have the `Row` object in hand, you can conditionally display checkboxes on some rows and not others.

  If the data for a row changes, the display of a checkbox will be re-evaluated and automatically updated.

  Leave this function undefined to leave out checkboxes altogether.

- `actionsFn` (optional):  

  A function that takes a `Row` as a parameter and returns an `ActionSettings` object or `null`.  

  Defines custom actions for each row that appear in a dropdown.

  Leave this function undefined to leave out the actions dropdown altogether.

---

## ColumnSettings object

---

## ActionSettings object 

---



## SwTable Public Properties

### `$data: Array<any>`

_getter_

Array of observed, nested proxy objects for each row.

Collection of Row.$data.

You can modify the properties of these objects.

Updating these will update the DOM.

### `data: Array<any>`

_getter_

Array of plain data objects that represent each row's data.

Collection of Row.data.

These are proxy targets, so they are live. If the table's data is updated (via .$data), these objects will update wherever they are used.

Don't modify these objects.

### `dataSnapshot: Array<any>`

_getter_

Array of clones of each row's data. These are unbound from the proxy setup, so they won't change if the table's data changes.

This is useful if you need to save the state of the table's data separately.

### `rows: Array<Row>`

_getter_

All the rows in state. See the description of the `Row` object.

### `rowsCurrentPage: Array<Row>`

_getter_

All the rows on the current page. This is what is actually on the DOM.

### `rowsFilterTrue: Array<Row>`

_getter_

All the rows that are on the current page or any other page, and aren't removed by filters.

### `rowsChecked: Array<Row>`

_getter_

All the rows in state that have a checkbox that is selected.

### `columns: Array<Column>`

_getter_

All the columns in state. See the description of the `Column` object.

Doesn't include built-in columns like the checkbox column, etc.


### `currentPage: number`

_getter / setter_

Current page number. You can change this to manually go to a different page, or you can use goToPage().

Page index starts at 1, not 0, to match the interface.

### `pageLength: number` 

_getter / setter_

Rows per page. You can set this manually to change it. fUse 0 to display all rows.

### `pageLengthOptions: Array<number>`

_getter / setter_

An array of numbers representing the available page length options. 

These will display in the page length dropdown. Setting this array will update the dropdown.

Include 0 for an "All" option.

Include just one option to hide the dropdown, e.g., [50].

---

## SwTable Public Methods

### `setData(data: Array<any>): void`

Sets the data for the table.

This completely destroys any current rows and initializes all new ones.

Ideally you use this very rarely because it rebuilds all Row objects.

The table will immediately render and go to page 1.

### `insertRow(data: any, index?: number): Row`

Pass in data that represents a single row. This creates the row and appends it to the table.

Optionally you can pass an index in which to place the row. If you don't include an index, it pushes it to the end of the row array.

Returns the Row object.

### `goToPage(pageNumber: number): void`

Use this to go to a page manually. It will go to the first or last page if the number is out of range.

---

## Row Public Properties


### `$data`

_getter_

Observed, nested proxy object representing the row's data. 

Modify this to update the data and trigger a render. Assume the `row` variable is assigned to a given row:

```
// Updates the row's data and renders
row.$data.name = 'Stephen';
```

(You should probably only use this to write changes. You can read from this object as well, but there is more overhead.)

### `data`

_getter_

Plain object for the row's data. Use this to read data. 

This is a proxy target, so it is live and will synchronize when $data is modified.

Do not modify this object.

### `dataSnapshot`

_getter_

Plain data object for the row that is unbound from the proxy setup.

This will not update when the $data changes.

Use this if you need to copy the row's data somewhere else.

### `tr: HTMLTableRowElement`

_getter_

tr element for the row, if you need to access the DOM directly.

### `rowId: string`

UUID for the row. This is also applied to the tr element on the data-uuid attribute.

### `index: number`

_getter_

### `isChecked: boolean`

_getter / setter_

Indicates if the row's checkbox is checked. If the row has no checkbox, it will be false.

Setting this to true will check the row if it has a checkbox.

---

## Row Public Methods

### `setData(data: Array<any>): void`

Sets the data for the row. This will rerender.


### 



### `destroy(): void`

Deletes the row and nulls out the instance.


---

## Column Public Properties

### `render: (row: Row) => HTMLElement | string`

_getter/setter_

Definition of the render function for this column. This is the same as ColumnSetting['render'].

Each Row object will pass through this function and display in its cell under this column whatever element or string is returned.

To simply display a property, return a string:

```
column.render = (row) => row.data.name;
```

To display something more custom, return elements:

```
column.render = (row) => {
  // Build up elements and return them in here, with row in context
  // ...
  return div;
};

```

You can update this at any time, which will trigger a rerender.

### `th: HTMLTableCellElement`

_getter_

th element for the column, if you need to access the DOM directly.


### `name: string`

_getter/setter_

### `colId: string`

UUID for the column. This is also applied to the col element on the data-id attribute. (Col element is not visible.)

---

## Column Public Methods

### `show(): void`

### `hide(): void`

### `toggle(): void` 

### `sort(ascending?: boolean)`

### `sortBy`

Configures the method by which the column sorts when sort() is fired

### `moveTo(index: number)`

### `moveRight()`

### `moveLeft()`

### `destroy()`