import { SwTable } from "./table.js";
type SwTableData = {
    id: number;
    name: string;
    quantity: number;
    price: number;
    discount: boolean;
};

const x = new SwTable<SwTableData>({
    pageLengthOptions: [5, 10, 20],
    columns: [
        {
            name: "ID",
            render(row) {
                return String(row.data.id);
            }
        },
        {
            name: "Name",
            render(row) {
                return row.data.name;
            }
        },
        {
            name: "Quantity",
            render(row) {
                return String(row.data.quantity);
            },
            summary(table) {
                let totalQ = 0;
                // This is maybe a little too verbose. Should an implementation need to know about the entire table
                for (const row of table.rowsFilterTrue) {
                    totalQ += row.data.quantity;
                }
                return `${totalQ}`;
            }
        },
        {
            name: "Price",
            render(row) {
                return row.data.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            },
        },
        {
            name: "Discount",
            render(row)  {
                return String(row.data.discount);
            }
        },
        {
            name: "Total",
            render(row) {
                // Maybe some floating point inaccuracy
                const total = row.data.quantity * row.data.price;
                return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            } 
        },
    ],
    data: [
        { id: 1, name: "Item 1", quantity: 3, price: 10.99, discount: true },
        { id: 2, name: "Item 2", quantity: 5, price: 15.49, discount: false },
        { id: 3, name: "Item 3", quantity: 2, price: 7.89, discount: true },
        { id: 4, name: "Item 4", quantity: 8, price: 12.99, discount: false },
        { id: 5, name: "Item 5", quantity: 6, price: 20.5, discount: true },
        { id: 6, name: "Item 6", quantity: 10, price: 5.25, discount: false },
        { id: 7, name: "Item 7", quantity: 4, price: 8.75, discount: true },
        { id: 8, name: "Item 8", quantity: 7, price: 14.99, discount: false },
        { id: 9, name: "Item 9", quantity: 1, price: 99.99, discount: true },
        { id: 10, name: "Item 10", quantity: 12, price: 3.5, discount: false },
        { id: 11, name: "Item 11", quantity: 9, price: 25.0, discount: true },
        { id: 12, name: "Item 12", quantity: 3, price: 18.75, discount: false },
        { id: 13, name: "Item 13", quantity: 6, price: 9.49, discount: true },
        { id: 14, name: "Item 14", quantity: 15, price: 2.99, discount: false },
        { id: 15, name: "Item 15", quantity: 11, price: 6.79, discount: true },
        { id: 16, name: "Item 16", quantity: 4, price: 50.0, discount: false },
        { id: 17, name: "Item 17", quantity: 13, price: 22.49, discount: true },
        { id: 18, name: "Item 18", quantity: 2, price: 30.0, discount: false },
        { id: 19, name: "Item 19", quantity: 7, price: 17.99, discount: true },
        { id: 20, name: "Item 20", quantity: 5, price: 11.25, discount: false },
    ],
    detailFn(row) {
        const container = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = `Details for ${row.data.name}`;
        title.style.marginBottom = "5px";
        const quantity = document.createElement("p");
        quantity.textContent = `Quantity: ${row.data.quantity}`;
        const price = document.createElement("p");
        price.textContent = `Price: $${row.data.price.toFixed(2)}`;
        const discount = document.createElement("p");
        discount.textContent = `Discount: ${row.data.discount ? "Yes" : "No"}`;
        container.append(title, quantity, price, discount);
        return container;
    },
    actionsFn(row) {
        return [
            {
                text: "Increase Price",
                fn() {
                    row.$data.price += 5;
                },
                disabled: () => row.data.price > 100
            },
            {
                text: "Change Quantity",
                fn() {
                    let q = prompt('Quantity:');
                    if (!q) return;
                    if (isNaN(Number(q))) return;
                    row.$data.quantity = Number(q);
                },
            },
            {
                text: "Toggle Discount",
                fn() {
                    row.$data.discount = !row.$data.discount;
                },
            },
        ];
    },
    checkboxFn(row) {
        return row.data.quantity > 3;
    },
    overallSummaryFn(table) {
        let total = 0;
        for (const row of table.rowsFilterTrue) {
            total += row.data.quantity * row.data.price;
        }
        return `Total: ${total.toFixed(2)}`;
    },
    uiFilters: [
        {
            text: 'Price is over $5',
            fn(row) {
                return row.data.price > 10;
            },
            isActive: false
        }
    ]
});


document.body.append(x.element);
(window as any).x = x;
