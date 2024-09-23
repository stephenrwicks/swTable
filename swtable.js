"use strict";
// Stuff to work on
// Sorting
// Get option dropdown working
// Get checkbox working
// FilterBox built in somewhere
// Show/Hide Column Box built in somewhere - This just adds and removes columns based on properties, would need to be configurable
// Draggable rows / draggable columns or buttons that implement move up / move down / move right / move left which already work
// Add / delete row buttons automatic (Altho these can be placed in dropdown)
// Editable fields
// Auto-Crud Form (this is extreme and would be very slow but doable. Possibly the property types could be inferred in an async manner so it's not slow)
// Configurable crud form
function swTable(initOptions) {
    // Consolidate all css classes assigned
    const css = {
        wrapper: 'sw-table',
        table: 'sw-table-table',
        theadTr: 'sw-table-thead-tr',
        tbody: 'sw-table-tbody',
        th: 'sw-table-th',
        tr: 'sw-table-tr',
        trEven: 'sw-table-tr-even',
        trOdd: 'sw-table-tr-odd',
        td: 'sw-table-td',
        detailTr: 'sw-table-detail-tr',
        checkbox: 'sw-table-checkbox',
        dropdownButton: 'sw-table-dropdown-button',
        detailButton: 'sw-table-detail-button',
        detailIsOpen: 'sw-table-detail-tr-open',
        tfoot: 'sw-table-tfoot',
        searchInputWrapper: 'sw-table-search-wrapper',
        searchInput: 'sw-table-search',
        icon: 'sw-table-icon',
        searchIgnore: 'sw-table-search-ignore',
        header: 'sw-table-header',
    };
    const totalNumberOfColumns = () => _theadTrElement.cells.length;
    const checkboxToRowWeakMap = new WeakMap();
    const detailToRowWeakMap = new WeakMap();
    const dropdownToRowWeakMap = new WeakMap();
    const icons = {
        magnifyingGlass() {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '24');
            svg.setAttribute('height', '24');
            circle.setAttribute('cx', '10');
            circle.setAttribute('cy', '10');
            circle.setAttribute('r', '7');
            circle.setAttribute('stroke', 'black');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('fill', 'none');
            line.setAttribute('x1', '14');
            line.setAttribute('y1', '14');
            line.setAttribute('x2', '20');
            line.setAttribute('y2', '20');
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '2');
            svg.append(circle, line);
            svg.classList.add(css.icon);
            return svg;
        },
        ellipsis() {
            const svg = document.createElement('svg');
            return svg;
        },
        chevron() {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '24');
            svg.setAttribute('height', '24');
            svg.setAttribute('fill', 'black');
            path.setAttribute('d', 'M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z');
            svg.append(path);
            svg.classList.add(css.icon);
            return svg;
        },
    };
    // Put this inside the class
    const proxyWithChangeCallback = (obj, callback) => {
        const createHandler = (path = []) => ({
            get: (target, property, receiver) => {
                const value = Reflect.get(target, property, receiver);
                if (typeof value === 'object' && value !== null) {
                    return new Proxy(value, createHandler([...path, property]));
                }
                return value;
            },
            set: (target, property, value, receiver) => {
                const success = Reflect.set(target, property, value, receiver);
                if (success)
                    callback();
                return success;
            }
        });
        // In this context, I don't think returning the callback is ever necessary
        return new Proxy(obj, createHandler());
    };
    const unwrapProxy = (proxy) => {
        if (typeof proxy !== 'object' || proxy === null)
            return proxy;
        if (Array.isArray(proxy))
            return proxy.map(item => unwrapProxy(item));
        const result = {};
        for (const key in proxy) {
            if (Object.prototype.hasOwnProperty.call(proxy, key)) {
                result[key] = unwrapProxy(proxy[key]);
            }
        }
        return result;
    };
    class Row {
        #element;
        #detailCell;
        #dropdownCell;
        #checkboxCell;
        #checkbox;
        #detailRow;
        //#dropdown: TDropdown;
        #data; // Proxy;
        #detailButton;
        constructor(data) {
            this.#element = document.createElement('tr');
            this.#element.className = css.tr;
            this.#dropdownCell = document.createElement('td');
            this.#detailCell = document.createElement('td');
            this.#checkboxCell = document.createElement('td');
            //this.#checkbox = new Checkbox();
            this.#detailButton = document.createElement('button');
            this.#detailCell.className = 'sw-table-detail-td';
            this.#detailButton.className = css.detailButton;
            this.#detailButton.append(icons.chevron());
            this.#detailButton.addEventListener('click', () => this.#detailRow?.toggleVisibility());
            // this.#dropdown = new Dropdown();
            // this.initDetailRow();
            if (data) {
                this.data = data;
                //this.setData(data);
            }
        }
        get element() {
            return this.#element;
        }
        get detailRow() {
            return this.#detailRow;
        }
        get checkbox() {
            return this.#checkbox;
        }
        // get dropdown(): TDropdown {
        //     return this.#dropdown;
        // }
        get index() {
            return _rows.indexOf(this);
        }
        get isFilterTrue() {
            return isSearchMatch(this) && _filters.every((fn) => fn(this));
        }
        dataUnbound() {
            return unwrapProxy(this.#data);
        }
        get data() {
            return this.#data;
        }
        set data(data) {
            this.setData(data);
        }
        // If I decide to just use setters I will remove this method
        setData(data) {
            // Have to use .bind() to define the callback on the instance, rather than prototype
            this.#data = proxyWithChangeCallback(data, this.render.bind(this));
            this.render();
        }
        moveTo(index) {
            _rows.splice(_rows.indexOf(this), 1);
            _rows.splice(index, 0, this);
            putCurrentPageOnDom();
        }
        moveUp() {
            if (this.index === 0)
                return;
            this.moveTo(this.index - 1);
        }
        moveDown() {
            if (this.index === _rows.length - 1)
                return;
            this.moveTo(this.index + 1);
        }
        clone() {
            return new Row(this.dataUnbound());
        }
        destroy() {
            _rows.splice(_rows.indexOf(this), 1);
            this.#element = null;
            //this.#detailRow.destroy();
            for (const key of Object.keys(this)) {
                (this[key]) = null;
            }
            putCurrentPageOnDom();
        }
        render() {
            // Clear the row, then render each cell based on rules from columns
            this.#element.innerHTML = '';
            if (_isShowingDetailColumn)
                this.#element.append(this.#detailCell);
            for (const column of _columns) {
                const td = document.createElement('td');
                td.className = css.td;
                td.append(column.render(this));
                this.#element.append(td);
            }
            if (_isShowingDropdownColumn)
                this.#element.append(this.#dropdownCell);
            if (_isShowingCheckboxColumn) {
                this.#element.append(this.#checkboxCell);
                const shouldShowCheckbox = typeof _showCheckboxCondition === 'function' && _showCheckboxCondition(this);
                if (shouldShowCheckbox && !this.#checkbox) {
                    this.#checkbox = new Checkbox();
                    checkboxToRowWeakMap.set(this.#checkbox, this);
                    this.#checkboxCell.append(this.#checkbox.element);
                }
                this.element.append(this.#checkboxCell);
            }
            else {
                if (this.#checkbox)
                    checkboxToRowWeakMap.delete(this.#checkbox);
                this.#checkbox = undefined;
                this.#checkboxCell.remove();
            }
            // Need to make sure unsetting detail condition unsets all details
            const detailContent = getDetailContent(this);
            if (!this.#detailRow && !!detailContent) {
                this.#detailRow = new DetailRow();
                detailToRowWeakMap.set(this.#detailRow, this);
            }
            if (!detailContent) {
                if (this.#detailRow)
                    detailToRowWeakMap.delete(this.#detailRow);
                this.#detailRow = undefined;
                this.#detailButton.remove();
            }
            if (this.#detailRow) {
                this.#detailRow.setContent(detailContent);
                this.#detailCell.append(this.#detailButton);
            }
            // Row callback
        }
    }
    class DetailRow {
        #element;
        #td;
        #isOpen;
        constructor() {
            this.#element = document.createElement('tr');
            this.#td = document.createElement('td');
            this.#element.className = css.detailTr;
            this.#element.append(this.#td);
            this.#isOpen = false;
        }
        get parent() {
            return detailToRowWeakMap.get(this);
        }
        get element() {
            return this.#element;
        }
        setContent(content) {
            this.#td.innerHTML = '';
            this.#td.colSpan = totalNumberOfColumns();
            if (content)
                this.#td.append(content);
        }
        get isOpen() {
            return this.#isOpen;
        }
        show() {
            if (this.#isOpen)
                return;
            this.parent?.element.classList.add(css.detailIsOpen);
            this.parent?.element.after(this.#element);
            this.#isOpen = true;
        }
        hide() {
            if (!this.#isOpen)
                return;
            this.parent?.element.classList.remove(css.detailIsOpen);
            this.#element.remove();
            this.#isOpen = false;
        }
        toggleVisibility() {
            if (this.#isOpen)
                this.hide();
            else
                this.show();
        }
        destroy() {
            throw new Error("Method not implemented.");
        }
    }
    class Dropdown {
        constructor(options) {
            this.element = document.createElement('div');
            this.options = Array.isArray(options) ? options : [];
        }
        element;
        options;
        get isOpen() {
            return false;
        }
        get parent() {
            return dropdownToRowWeakMap.get(this);
        }
        setOptions(options) {
            this.options = options;
        }
        addOption(option) {
            throw new Error("Method not implemented.");
        }
        removeOption(index) {
            throw new Error("Method not implemented.");
        }
    }
    class Checkbox {
        #element;
        #isShowing;
        constructor() {
            this.#element = document.createElement('input');
            this.#element.type = 'checkbox';
            this.#element.className = css.checkbox;
            this.#isShowing = false;
        }
        get parent() {
            return checkboxToRowWeakMap.get(this);
        }
        get element() {
            return this.#element;
        }
        get isChecked() {
            return this.element.checked;
        }
        get isShowing() {
            return this.#isShowing;
        }
        show() {
            this.#isShowing = true;
            this.element.style.display = '';
        }
        hide() {
            this.#isShowing = false;
            this.element.style.display = 'none';
        }
        toggleVisibility() {
            if (this.#isShowing)
                this.hide();
            else
                this.show();
        }
        check() {
            this.#element.checked = true;
        }
        uncheck() {
            this.#element.checked = false;
        }
        toggleChecked() {
            this.#element.checked = !this.#element.checked;
        }
    }
    class Column {
        #element;
        name;
        sortKey;
        isSortable;
        isReactive;
        #render;
        constructor(options) {
            this.#element = document.createElement('th');
            this.#render = options.render;
            this.name = options.name ?? '';
            this.sortKey = options.sortKey ?? '';
            this.isSortable = options.isSortable ?? true;
            this.isReactive = options.isReactive ?? true;
        }
        setIsReactive(reactive) {
            throw new Error("Method not implemented.");
        }
        setIsSortable(sortable) {
            throw new Error("Method not implemented.");
        }
        setRender(render) {
            throw new Error("Method not implemented.");
        }
        get element() {
            return this.#element;
        }
        get index() {
            return _columns.indexOf(this);
        }
        get render() {
            return this.#render;
        }
        setName(name) {
            throw new Error("Method not implemented.");
        }
        setSortKey(key) {
            throw new Error("Method not implemented.");
        }
        setRenderFn(render) {
            this.#render = render;
            // Do something to update all rows
        }
        moveTo(index) {
            TABLE.columns.all.splice(TABLE.columns.all.indexOf(this), 1);
            TABLE.columns.all.splice(index, 0, this);
            drawTheadTr();
            rerenderAllRows();
        }
        moveLeft() {
            if (this.index === 0)
                return;
            this.moveTo(this.index - 1);
        }
        moveRight() {
            if (this.index === TABLE.columns.all.length - 1)
                return;
            this.moveTo(this.index + 1);
        }
        destroy() {
            throw new Error("Method not implemented.");
        }
    }
    const _tableWrapper = document.createElement('div');
    const _tableElement = document.createElement('table');
    const _theadElement = document.createElement('thead');
    const _theadTrElement = document.createElement('tr');
    const _tbodyElement = document.createElement('tbody');
    const _tfootElement = document.createElement('tfoot');
    const _tfootTrElement = document.createElement('tr');
    const _tfootTdElement = document.createElement('td');
    const _header = document.createElement('div');
    const _searchInputWrapper = document.createElement('div');
    const _searchInput = document.createElement('input');
    const _magnifyingGlassIcon = icons.magnifyingGlass();
    const _pageLengthSelect = document.createElement('select');
    const _selectAllCheckbox = document.createElement('input');
    _searchInput.type = 'search';
    _selectAllCheckbox.type = 'checkbox';
    _searchInput.setAttribute('form', '');
    _pageLengthSelect.setAttribute('form', '');
    _searchInputWrapper.append(_searchInput, _magnifyingGlassIcon);
    _theadElement.append(_theadTrElement);
    _tfootTrElement.append(_tfootTdElement);
    _tfootElement.append(_tfootTrElement);
    _tableElement.append(_theadElement, _tbodyElement, _tfootElement);
    _searchInputWrapper.append(_searchInput, _magnifyingGlassIcon);
    _header.append(_searchInputWrapper, _pageLengthSelect);
    _tableWrapper.append(_header, _tableElement);
    _theadTrElement.className = css.theadTr;
    _tableWrapper.className = css.wrapper;
    _tableElement.className = css.table;
    _tfootElement.className = css.tfoot;
    _searchInputWrapper.className = css.searchInputWrapper;
    _searchInput.className = css.searchInput;
    _header.className = css.header;
    _searchInput.addEventListener('input', () => {
        TABLE.filter.fireFilters();
    });
    _pageLengthSelect.addEventListener('change', () => {
        TABLE.page.setCurrentPage(0); // This seems wrong
        TABLE.page.setPageLength(Number(_pageLengthSelect.value));
    });
    let _columns = [];
    let _rows = [];
    let _filters = [];
    let _pageLength = 15;
    let _currentPageNumber = 0;
    let _isShowingDetailColumn = false;
    let _isShowingCheckboxColumn = false;
    let _isShowingDropdownColumn = false;
    let _pageLengthOptions = [0, 15, 50, 100];
    // We want to show the detail button if a single row has a detail row.
    // How do we know if a row has a detail row?
    // Is it based on whether definition exists?
    // Do we have to pass every row through the detail render function in order to check if it's blank? Yes
    // If the content is blank, do not create a detail row
    const updateIsShowingDetailColumn = () => {
        const shouldShowDetailColumn = _rows.some(row => !!row.detailRow);
        if (_isShowingDetailColumn === shouldShowDetailColumn)
            return; // Do nothing if we haven't updated anything
        _isShowingDetailColumn = shouldShowDetailColumn;
        drawTheadTr();
        rerenderAllRows();
    };
    const updateIsShowingCheckboxColumn = () => {
        const shouldShowCheckboxColumn = _rows.some(row => !!row.checkbox);
        if (_isShowingCheckboxColumn === shouldShowCheckboxColumn)
            return;
    };
    const updateSelectAll = () => {
        const every = TABLE.rows.currentPage.every(row => row.checkbox?.isChecked);
        if (every) {
            _selectAllCheckbox.checked = true;
            return;
        }
        const some = TABLE.rows.currentPage.some(row => row.checkbox?.isChecked);
        if (some) {
            _selectAllCheckbox.indeterminate = true;
            return;
        }
        _selectAllCheckbox.checked = false;
    };
    // These are the default higher order functions for rendering this stuff.
    // They can be changed after init so we store them like this.
    let _showCheckboxCondition = null;
    let _setDetailRowContent = null;
    let _setDropdownOptions = null;
    let TABLE = {
        element: _tableWrapper,
        clone: function () {
            throw new Error("Function not implemented.");
        },
        destroy: function () {
            // Setting this to null does nothing because once it's assigned to another variable there's still a reference
            throw new Error("Function not implemented.");
        },
        data: {
            get all() {
                return _rows.map(row => row.dataUnbound());
            },
            get currentPage() {
                return TABLE.rows.currentPage.map(row => row.dataUnbound());
            },
            get filterTrue() {
                return TABLE.rows.filterTrue.map(row => row.dataUnbound());
            },
            get checked() {
                return TABLE.rows.all.filter(row => row.checkbox?.isChecked);
            },
            init(dataArray) {
                destroyAllRows();
                _rows = dataArray.map(data => new Row(data));
                putCurrentPageOnDom();
            },
            initFromHtml(HTMLTableElementOrSelector) {
                throw new Error("Function not implemented.");
            }
        },
        rows: {
            get all() {
                return _rows;
            },
            get currentPage() {
                return rowsFilterTruePartitionedByPage()[_currentPageNumber] || [];
            },
            get checked() {
                return _rows.filter(row => row.checkbox?.isShowing && row.checkbox?.isChecked);
            },
            get filterTrue() {
                return _rows.filter(row => row.isFilterTrue);
            },
            insert(data, index) {
                const row = new Row(data);
                _rows.splice(index, 0, row);
                putCurrentPageOnDom();
                return row;
            },
            append(data) {
                return this.insert(data, _rows.length - 1);
            },
            prepend(data) {
                return this.insert(data, 0);
            },
            remove(index) {
                if (_rows[index])
                    _rows[index].destroy();
            },
            destroyAll() {
                return destroyAllRows();
            },
            sortByKey(key) {
                return null;
            }
        },
        columns: {
            get all() {
                return _columns;
            },
            init(columnInitArray) {
                _columns = columnInitArray.map(column => new Column(column));
                drawTheadTr();
                rerenderAllRows();
                putCurrentPageOnDom();
            },
            // If columns show/hide so easily you can make a property show/hide factory as a piece of ui
            append(options) {
                return this.insert(options, _columns.length);
            },
            prepend(options) {
                return this.insert(options, 0);
            },
            insert(options, index) {
                // Will need to rerender every row
                // Can probably leverage setcolumns here instead
                const column = new Column(options);
                _columns.splice(index, 0, column);
                drawTheadTr();
                rerenderAllRows();
                putCurrentPageOnDom();
                return column;
            },
            remove(index) {
                _columns.splice(index, 1);
                drawTheadTr();
                rerenderAllRows();
                putCurrentPageOnDom();
            }
        },
        page: {
            get currentPageNumber() {
                return _currentPageNumber;
            },
            get numberOfPages() {
                if (_pageLength === 0)
                    return 0;
                return Math.ceil(TABLE.rows.filterTrue.length / _pageLength);
            },
            get pageLength() {
                return _pageLength;
            },
            setCurrentPage(n) {
                _currentPageNumber = n;
                putCurrentPageOnDom();
                return n;
            },
            setPageLength(n) {
                _pageLength = n;
                putCurrentPageOnDom();
                //this.setCurrentPage(0);
            },
            setPageLengthOptions(numArray) {
                _pageLengthSelect.innerHTML = '';
                for (const o of _pageLengthOptions) {
                    _pageLengthSelect.add(new Option(String(o == 0 ? 'All' : o), String(o)));
                }
            }
        },
        search: {
            ignoreSelectors: [],
            method: 'includes',
            show() {
                throw new Error("Function not implemented.");
            },
            hide() {
                throw new Error("Function not implemented.");
            },
            toggle() {
                throw new Error("Function not implemented.");
            },
            setMethod: function (method) {
                throw new Error("Function not implemented.");
            },
            setIgnoreSelectors: function (ignore) {
                throw new Error("Function not implemented.");
            },
            clear: function () {
                throw new Error("Function not implemented.");
            }
        },
        filter: {
            setFilters(fns) {
                _filters = fns ? fns : [];
            },
            fireFilters() {
                putCurrentPageOnDom();
            },
            get currentFilters() {
                return _filters;
            }
        },
        builtInCheckboxColumn: {
            setShowCheckboxCondition: function (condition) {
                throw new Error("Function not implemented.");
            },
            show: function () {
                throw new Error("Function not implemented.");
            },
            hide: function () {
                throw new Error("Function not implemented.");
            },
            toggle: function () {
                throw new Error("Function not implemented.");
            },
            selectAll: function () {
                throw new Error("Function not implemented.");
            },
            deselectAll: function () {
                throw new Error("Function not implemented.");
            },
            toggleSelectAll: function () {
                throw new Error("Function not implemented.");
            }
        },
        builtInDetailRowColumn: {
            setShowDetailButtonCondition: function (condition) {
                // We shouldn't need this because the button will show based on whether there is a detail row
                throw new Error("Function not implemented.");
            },
            setDetailRowContent(setContent) {
                _setDetailRowContent = setContent;
                rerenderAllRows();
                updateIsShowingDetailColumn();
            },
            show() {
                throw new Error("Function not implemented.");
            },
            hide() {
                throw new Error("Function not implemented.");
            },
            toggle() {
                throw new Error("Function not implemented.");
            }
        },
        builtInDropdownColumn: {
            setShowDropdownButtonCondition: function (condition) {
                throw new Error("Function not implemented.");
            },
            setDropdownOptions: function (setOptions) {
                throw new Error("Function not implemented.");
            },
            show() {
                // _dropdownTh.style.display = 'table-cell';
                // for (const row of _rows) {
                //     row.drop
                // }
                throw new Error("Function not implemented.");
            },
            hide: function () {
                throw new Error("Function not implemented.");
            },
            toggle: function () {
                throw new Error("Function not implemented.");
            }
        }
    };
    const getTopLevelText = (el) => [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(' ');
    const destroyAllRows = () => {
        // For loop won't work here because destroy() nulls out the row
        while (_rows.length) {
            _rows[0].destroy();
        }
    };
    const getDetailContent = (row) => {
        if (typeof _setDetailRowContent !== 'function')
            return null;
        return _setDetailRowContent(row) || null;
    };
    const rowsFilterTruePartitionedByPage = () => {
        // 2D array of rows that meet the filter criteria, representing paging
        if (_pageLength === 0)
            return [TABLE.rows.filterTrue]; // If pageLength is 0, one page
        return Array.from({ length: TABLE.page.numberOfPages }, (_, i) => {
            return TABLE.rows.filterTrue.slice(i * _pageLength, (i + 1) * _pageLength);
        });
        // Make this return an empty array sometimes if it needs to
    };
    const anyCheckboxes = () => _rows.some(row => row.checkbox?.isShowing);
    const putCurrentPageOnDom = () => {
        // Currently doesn't rerender all rows, just places current page on DOM
        _tbodyElement.innerHTML = '';
        TABLE.rows.currentPage.forEach((row, i) => {
            row.element.classList.remove('sw-table-tr-even');
            row.element.classList.remove('sw-table-tr-odd');
            row.element.classList.add(i % 2 === 0 ? 'sw-table-tr-even' : 'sw-table-tr-odd');
            _tbodyElement.append(row.element);
            if (row.detailRow?.isOpen)
                _tbodyElement.append(row.detailRow.element);
        });
        drawTfootTd();
    };
    const rerenderAllRows = () => {
        for (const row of TABLE.rows.all)
            row.render();
    };
    const drawTheadTr = () => {
        _theadTrElement.innerHTML = '';
        if (_isShowingDetailColumn)
            _theadTrElement.append(document.createElement('th'));
        for (const column of TABLE.columns.all) {
            const th = document.createElement('th');
            th.className = css.th;
            th.append(column.name ?? '');
            _theadTrElement.append(th);
        }
        if (_isShowingCheckboxColumn)
            _theadTrElement.append(document.createElement('th'));
    };
    const drawTfootTd = () => {
        _tfootTdElement.colSpan = totalNumberOfColumns();
        if (TABLE.rows.filterTrue?.length) {
            const i = TABLE.rows.filterTrue.indexOf(TABLE.rows.currentPage[0]);
            _tfootTdElement.textContent = `Showing ${i + 1} - ${i + TABLE.rows.currentPage.length} of ${TABLE.rows.filterTrue.length}`;
        }
        else {
            _tfootTdElement.textContent = 'No data to display.';
        }
    };
    const filterRow = (row) => {
        return _filters.every(f => f(row));
    };
    const isSearchMatch = (row) => {
        //if (!_showSearch) return true;
        const text = _searchInput.value?.trim().toLowerCase();
        if (!text)
            return true;
        let els = [...row.element.querySelectorAll('*:not(.sw-table-search-ignore *)')];
        if (row.detailRow?.element)
            els = [...els, ...row.detailRow.element.querySelectorAll('*')];
        //if (options.search?.exclude?.length) {
        //    const excludeSelector = options.search?.exclude.toString();
        //    let excludedEls = [...row.element.querySelectorAll(excludeSelector)];
        //    if (row.detailRow.element) excludedEls = [...excludedEls, ...row.detailRow.element.querySelectorAll(excludeSelector)];
        //    els = els.filter(el => !excludedEls.includes(el) && !excludedEls.some(excludedEl => excludedEl.contains(el)));
        //}
        // Use top level text nodes only, so that excluded nested elements are not false positives
        return els.map(el => getTopLevelText(el).toLowerCase()).some(str => str.includes(text));
    };
    if (typeof initOptions?.checkbox === 'function')
        _showCheckboxCondition = initOptions.checkbox;
    if (typeof initOptions?.details === 'function')
        _setDetailRowContent = initOptions.details;
    if (typeof initOptions?.dropdown === 'function')
        _setDropdownOptions = initOptions.dropdown;
    if (Array.isArray(initOptions?.data))
        TABLE.data.init(initOptions.data);
    if (typeof initOptions?.pageLength === 'number')
        _pageLength = initOptions.pageLength;
    if (Array.isArray(initOptions?.pageLengthOptions))
        _pageLengthOptions = initOptions.pageLengthOptions;
    TABLE.page.setPageLengthOptions(initOptions?.pageLengthOptions || [0, 15, 50, 100]);
    TABLE.page.setPageLength(_pageLengthOptions[0] ?? 0);
    if (initOptions?.theme === 'mint' || initOptions?.theme === 'ice') {
        _tableWrapper.classList.add(`sw-table-${initOptions.theme}-theme`);
    }
    // if (initOptions) {
    //     TABLE.data.init(initOptions.dataArray || []);
    //     _pageLength = initOptions.pageLength || 15;
    // }
    // Need to decide which options are available on a row basis, vs entire table, vs init, or all.
    // For example we can set checkbox at the row level, and on table basis on init, but not entire table after init - why?
    Object.freeze(TABLE);
    return TABLE;
}
