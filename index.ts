// import { SwTable } from "./table.js";

import { SwTable } from "./table.js";

// //@ts-ignore
// document.body.append(window.x.element);

// type TestData = {
//     id: number;
//     name: string;
//     category: string;
//     price: number;
//     details: {
//         description: string;
//         createdAt: Date;
//         stock: number;
//     };
// };

// const x = new SwTable<TestData>({
//     pageLengthOptions: [5, 10, 20],
//     columns: [
//         {
//             name: 'ID',
//             render: row => String(row.data.id),
//         },
//         {
//             name: 'Name',
//             render: row => row.data.name,
//         },
//         {
//             name: 'Category',
//             render: row => row.data.category,
//         },
//         {
//             name: 'Price',
//             render: row => `$${row.data.price.toFixed(2)}`,
//         },
//         {
//             name: 'Stock',
//             render: row => String(row.data.details.stock),
//         },
//     ],
//     data: [
//         {
//             id: 1,
//             name: "Item 1",
//             category: "Electronics",
//             price: 49.99,
//             details: {
//                 description: "A high-quality electronic gadget.",
//                 createdAt: new Date(2023, 0, 5),
//                 stock: 15,
//             },
//         },
//         {
//             id: 2,
//             name: "Item 2",
//             category: "Clothing",
//             price: 29.99,
//             details: {
//                 description: "A comfortable cotton t-shirt.",
//                 createdAt: new Date(2023, 1, 10),
//                 stock: 30,
//             },
//         },
//         {
//             id: 3,
//             name: "Item 3",
//             category: "Books",
//             price: 15.99,
//             details: {
//                 description: "A thrilling mystery novel.",
//                 createdAt: new Date(2023, 2, 15),
//                 stock: 10,
//             },
//         },
//         {
//             id: 4,
//             name: "Item 4",
//             category: "Toys",
//             price: 19.99,
//             details: {
//                 description: "A fun and engaging board game.",
//                 createdAt: new Date(2023, 3, 20),
//                 stock: 25,
//             },
//         },
//         {
//             id: 5,
//             name: "Item 5",
//             category: "Electronics",
//             price: 99.99,
//             details: {
//                 description: "A premium wireless headset.",
//                 createdAt: new Date(2023, 4, 25),
//                 stock: 5,
//             },
//         },
//         {
//             id: 6,
//             name: "Item 6",
//             category: "Clothing",
//             price: 39.99,
//             details: {
//                 description: "A stylish leather jacket.",
//                 createdAt: new Date(2023, 5, 1),
//                 stock: 12,
//             },
//         },
//         {
//             id: 7,
//             name: "Item 7",
//             category: "Books",
//             price: 9.99,
//             details: {
//                 description: "A classic science fiction novel.",
//                 createdAt: new Date(2023, 6, 5),
//                 stock: 20,
//             },
//         },
//         {
//             id: 8,
//             name: "Item 8",
//             category: "Toys",
//             price: 14.99,
//             details: {
//                 description: "A set of building blocks for kids.",
//                 createdAt: new Date(2023, 7, 10),
//                 stock: 40,
//             },
//         },
//         {
//             id: 9,
//             name: "Item 9",
//             category: "Electronics",
//             price: 199.99,
//             details: {
//                 description: "A high-end smartphone.",
//                 createdAt: new Date(2023, 8, 15),
//                 stock: 8,
//             },
//         },
//         {
//             id: 10,
//             name: "Item 10",
//             category: "Clothing",
//             price: 49.99,
//             details: {
//                 description: "A pair of comfortable running shoes.",
//                 createdAt: new Date(2023, 9, 20),
//                 stock: 18,
//             },
//         },
//         {
//             id: 11,
//             name: "Item 11",
//             category: "Books",
//             price: 12.99,
//             details: {
//                 description: "A fascinating historical biography.",
//                 createdAt: new Date(2023, 10, 25),
//                 stock: 7,
//             },
//         },
//         {
//             id: 12,
//             name: "Item 12",
//             category: "Toys",
//             price: 29.99,
//             details: {
//                 description: "A remote-controlled car.",
//                 createdAt: new Date(2023, 11, 1),
//                 stock: 22,
//             },
//         },
//         {
//             id: 13,
//             name: "Item 13",
//             category: "Electronics",
//             price: 149.99,
//             details: {
//                 description: "A professional-grade microphone.",
//                 createdAt: new Date(2023, 0, 5),
//                 stock: 4,
//             },
//         },
//         {
//             id: 14,
//             name: "Item 14",
//             category: "Clothing",
//             price: 34.99,
//             details: {
//                 description: "A warm and cozy winter coat.",
//                 createdAt: new Date(2023, 1, 10),
//                 stock: 6,
//             },
//         },
//         {
//             id: 15,
//             name: "Item 15",
//             category: "Books",
//             price: 8.99,
//             details: {
//                 description: "A beginner's guide to programming.",
//                 createdAt: new Date(2023, 2, 15),
//                 stock: 16,
//             },
//         },
//         {
//             id: 16,
//             name: "Item 16",
//             category: "Toys",
//             price: 22.99,
//             details: {
//                 description: "A plush teddy bear.",
//                 createdAt: new Date(2023, 3, 20),
//                 stock: 35,
//             },
//         },
//         {
//             id: 17,
//             name: "Item 17",
//             category: "Electronics",
//             price: 299.99,
//             details: {
//                 description: "A powerful gaming laptop.",
//                 createdAt: new Date(2023, 4, 25),
//                 stock: 3,
//             },
//         },
//         {
//             id: 18,
//             name: "Item 18",
//             category: "Clothing",
//             price: 19.99,
//             details: {
//                 description: "A stylish baseball cap.",
//                 createdAt: new Date(2023, 5, 1),
//                 stock: 28,
//             },
//         },
//         {
//             id: 19,
//             name: "Item 19",
//             category: "Books",
//             price: 14.49,
//             details: {
//                 description: "A collection of poetry.",
//                 createdAt: new Date(2023, 6, 5),
//                 stock: 9,
//             },
//         },
//         {
//             id: 20,
//             name: "Item 20",
//             category: "Toys",
//             price: 39.99,
//             details: {
//                 description: "An interactive learning tablet for kids.",
//                 createdAt: new Date(2023, 7, 10),
//                 stock: 11,
//             },
//         },
//     ],
//     detailFn(row) {
//         const container = document.createElement('div');

//         const title = document.createElement('h4');
//         title.textContent = `Details for ${row.data.name}`;
//         title.style.marginBottom = '5px';

//         const desc = document.createElement('p');
//         desc.textContent = row.data.details.description;

//         const date = document.createElement('p');
//         date.textContent = `Created on: ${row.data.details.createdAt.toLocaleDateString()}`;

//         const stock = document.createElement('p');
//         stock.textContent = `Stock: ${row.data.details.stock}`;

//         container.append(title, desc, date, stock);
//         return container;
//     },
//     actionsFn(row) {
//         return [
//             {
//                 text: 'Increase Price',
//                 fn() {
//                     row.$data.price += 5;
//                 },
//                 disabled: () => true
//             },
//             {
//                 text: 'Decrease Stock',
//                 fn() {
//                     if (row.$data.details.stock > 0) {
//                         row.$data.details.stock--;
//                     }
//                 },
//             },
//             {
//                 text: 'Rename',
//                 fn() {
//                     row.$data.name = `Updated ${row.$data.name}`;
//                 },
//             },
//         ];
//     },
//     checkboxFn(row) {
//         return true;
//     },
// });

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
            render: row => String(row.data.id),
        },
        {
            name: "Name",
            render: row => row.data.name,
        },
        {
            name: "Quantity",
            render: row => String(row.data.quantity),
        },
        {
            name: "Price",
            render: row => `$${row.data.price.toFixed(2)}`,
        },
        {
            name: "Discount",
            render: row => (row.data.discount ? "Yes" : "No"),
        },
        {
            name: "Total",
            render: row => `$${(row.data.quantity * row.data.price).toFixed(2)}`,
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
                disabled: () => row.data.price > 100,
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
    summaryFn(table) {
        let total = 0;
        for (const row of table.rowsFilterTrue) {
            total += row.data.quantity * row.data.price;
        }
        return `Total: ${total.toFixed(2)}`;
    },
});


document.body.append(x.element);
//@ts-ignore
window.x = x;
