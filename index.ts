import { SwTable } from "./table.js";

const data = [
    {
        id: 1,
        revenue: 1200.50,
        expenses: 450.75,
        details: {
            category: "Retail",
            region: "North"
        }
    },
    {
        id: 2,
        revenue: 980.00,
        expenses: 300.50,
        details: {
            category: "Wholesale",
            region: "West"
        }
    },
    {
        id: 3,
        revenue: 1500.75,
        expenses: 700.25,
        details: {
            category: "Online",
            region: "East"
        }
    },
    {
        id: 4,
        revenue: 2000.00,
        expenses: 1200.00,
        details: {
            category: "Corporate",
            region: "South"
        }
    },
    {
        id: 5,
        revenue: 850.25,
        expenses: 400.50,
        details: {
            category: "Retail",
            region: "Central"
        }
    },
    {
        id: 1,
        revenue: 1200.50,
        expenses: 450.75,
        details: {
            category: "Retail",
            region: "North"
        }
    },
    {
        id: 2,
        revenue: 980.00,
        expenses: 300.50,
        details: {
            category: "Wholesale",
            region: "West"
        }
    },
    {
        id: 3,
        revenue: 1500.75,
        expenses: 700.25,
        details: {
            category: "Online",
            region: "East"
        }
    },
    {
        id: 4,
        revenue: 2000.00,
        expenses: 1200.00,
        details: {
            category: "Corporate",
            region: "South"
        }
    },
    {
        id: 5,
        revenue: 850.25,
        expenses: 400.50,
        details: {
            category: "Retail",
            region: "Central"
        }
    },
    {
        id: 1,
        revenue: 1200.50,
        expenses: 450.75,
        details: {
            category: "Retail",
            region: "North"
        }
    },
    {
        id: 2,
        revenue: 980.00,
        expenses: 300.50,
        details: {
            category: "Wholesale",
            region: "West"
        }
    },
    {
        id: 3,
        revenue: 1500.75,
        expenses: 700.25,
        details: {
            category: "Online",
            region: "East"
        }
    },
    {
        id: 4,
        revenue: 2000.00,
        expenses: 1200.00,
        details: {
            category: "Corporate",
            region: "South"
        }
    },
    {
        id: 5,
        revenue: 850.25,
        expenses: 400.50,
        details: {
            category: "Retail",
            region: "Central"
        }
    },
    {
        id: 1,
        revenue: 1200.50,
        expenses: 450.75,
        details: {
            category: "Retail",
            region: "North"
        }
    },
    {
        id: 2,
        revenue: 980.00,
        expenses: 300.50,
        details: {
            category: "Wholesale",
            region: "West"
        }
    },
    {
        id: 3,
        revenue: 1500.75,
        expenses: 700.25,
        details: {
            category: "Online",
            region: "East"
        }
    },
    {
        id: 4,
        revenue: 2000.00,
        expenses: 1200.00,
        details: {
            category: "Corporate",
            region: "South"
        }
    },
    {
        id: 5,
        revenue: 850.25,
        expenses: 400.50,
        details: {
            category: "Retail",
            region: "Central"
        }
    },
];

//@ts-ignore
window.xx = new SwTable({
    // pageLength: 4,
    pageLengthOptions: [5, 10],
    columns: [
        {
            name: 'ID',
            render(row) {
                return row.$data.id;
            }
        },
        {
            name: 'Revenue',
            render(row) {
                return row.$data.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            }
        },
        {
            name: 'Expenses',
            render(row) {
                return row.$data.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            },
            sortBy: null
        },
        {
            name: 'Net',
            render(row) {
                return (row.$data.revenue - row.$data.expenses).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            }
        },
    ],
    data: data,
    detailFn(row) {
        return 'x';
    },
    checkboxFn(row) {
        return row.$data.id > 2;
    },
    actionsFn(row) {
        return [
            {
                text: 'Set Revenue',
                fn() {
                    row.$data.revenue = Number(prompt('Revenue was:'));
                }
            },
            {
                text: 'Delete Row',
                fn() {
                    row.destroy();
                }
            }
        ]
    },
    showSearch: true,
    theme: 'ice',
});
//@ts-ignore

// Seems like every time data changes, you should re-sort and re-filter
window.q = new SwTable({
    pageLength: 10,
    pageLengthOptions: [5, 12],
    columns: [
        {
            name: 'count',
            render(row) {
                return row.$data.count;
            }
        },
        {
            name: 'button',
            render(row) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = `Increase count: ${row.$data.count}`;
                btn.addEventListener('click', () => row.$data.count++);
                return btn;
            }
        },
        {
            name: 'button',
            render(row) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = `Increase count by 10: ${row.$data.count}`;
                btn.addEventListener('click', () => row.$data.count = row.$data.count + 10);
                return btn;
            }
        },

    ],
    data: [
        {
            count: 1
        },
        {
            count: 100
        }
    ],
    // showSearch: true,
    theme: 'ice',
});
//@ts-ignore
window.x = new SwTable({
    pageLength: 5,
    pageLengthOptions: [5, 10, 15],
    columns: [
        {
            name: 'Name',
            render: (row) => {
                if (row.data.isActive) {
                    return row.data.profile.name;
                }
                const el = document.createElement('span');
                el.style.textDecoration = 'line-through';
                el.textContent = row.data.profile.name;
                return el;
            }
        },
        {
            name: 'Age',
            render: (row) => row.data.isActive ? row.data.profile.age.toString() : 'N/A'
        },
        {
            name: 'City',
            render: (row) => {
                if (row.data.isActive) {
                    const el = document.createElement('span');
                    el.textContent = `${row.data.location.city}, ${row.data.location.state}`;
                    return el;
                }
                return 'Hidden';
            }
        },
        {
            name: 'Occupation',
            render: (row) => row.data.isActive ? row.data.profile.occupation : 'Inactive'
        },
        {
            name: 'Status',
            render: (row) => {
                const el = document.createElement('button');
                el.textContent = row.data.isActive ? 'Active' : 'Inactive';
                el.style.backgroundColor = row.data.isActive ? 'green' : 'red';
                el.style.color = 'white';
                el.onclick = () => row.$data.isActive = !row.$data.isActive;
                return el;
            }
        }
    ],
    data: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        profile: {
            name: [
                'Alice Johnson',
                'Bob Smith',
                'Charlotte Brown',
                'Daniel Wilson',
                'Ella Martinez',
                'Frank Garcia',
                'Grace Thompson',
                'Henry White',
                'Isla Clark',
                'Jack Lewis',
                'Kylie Hall',
                'Liam Adams',
                'Mia Baker',
                'Noah Nelson',
                'Olivia Perez'
            ][i],
            age: Math.floor(Math.random() * 40 + 20),
            occupation: i % 2 === 0 ? 'Engineer' : 'Designer'
        },
        location: {
            city: i % 3 === 0 ? 'New York' : i % 3 === 1 ? 'Los Angeles' : 'Chicago',
            state: i % 3 === 0 ? 'NY' : i % 3 === 1 ? 'CA' : 'IL'
        },
        isActive: i % 2 === 0
    })),
    detailFn: (row) => {
        const container = document.createElement('div');
        container.style.padding = '10px';
        container.style.backgroundColor = '#f9f9f9';
        container.style.border = '1px solid #ddd';

        const title = document.createElement('h4');
        title.textContent = `Details for ${row.$data.profile.name}`;
        container.appendChild(title);

        const detailsList = document.createElement('ul');
        detailsList.innerHTML = `
            <li>Age: ${row.data.isActive ? row.data.profile.age : 'N/A'}</li>
            <li>Occupation: ${row.data.isActive ? row.data.profile.occupation : 'Inactive'}</li>
            <li>City: ${row.data.isActive ? `${row.data.location.city}, ${row.data.location.state}` : 'Hidden'}</li>
            <li>Status: ${row.data.isActive ? 'Active' : 'Inactive'}</li>
        `;
        container.appendChild(detailsList);

        return container;
    },
    checkboxFn: (row) => row.data.profile.age > 30,
    actionsFn: (row) => [
        {
            text: 'Change Name',
            fn: () => {
                const newName = prompt(`Enter new name for ${row.data.profile.name}:`, row.data.profile.name);
                if (newName) row.$data.profile.name = newName;
            }
        },
        {
            text: 'Delete',
            fn: () => row.destroy()
        }
    ],
    showSearch: true,

});


//@ts-ignore
document.body.append(window.x.element);