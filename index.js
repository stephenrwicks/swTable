// import { SwTable } from "./table.js";
import { SwTable } from "./table";
const x = new SwTable({
    columns: [],
    data: [
        {
            id: 1,
            name: "Item One",
            details: {
                description: "This is the first item",
                createdAt: new Date("2023-01-01"),
            },
        },
        {
            id: 2,
            name: "Item Two",
            details: {
                description: "This is the second item",
                createdAt: new Date("2023-02-01"),
            },
        },
        {
            id: 3,
            name: "Item Three",
            details: {
                description: "This is the third item",
                createdAt: new Date("2023-03-01"),
            },
        },
    ],
});
document.body.append(x.element);
