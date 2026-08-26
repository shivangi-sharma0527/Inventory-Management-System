# SmartStock – Inventory Management System

A full-stack inventory management web application designed for small and medium businesses. SmartStock helps users maintain product records, monitor stock levels, record stock-in/stock-out transactions, search and filter inventory, and review simple reports.

## Features

- Dashboard with total products, total units, low-stock items, out-of-stock items, and inventory value
- Add, edit, and delete products (CRUD)
- Stock In / Stock Out workflow with validation
- Low-stock and out-of-stock status detection
- Search by product, SKU, category, or supplier
- Category and status filters
- Stock movement history
- Category-wise inventory overview and reports
- Responsive UI for desktop and mobile
- Persistent local JSON data store (no database installation required)

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js (built-in HTTP server)
- Data storage: JSON file (`data/inventory.json`)
- API style: RESTful endpoints

## Run locally

Requirements: Node.js 18+ (npm is optional).

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## API Endpoints

- `GET /api/dashboard` – dashboard statistics
- `GET /api/products` – list/search/filter products
- `POST /api/products` – create product
- `PUT /api/products/:id` – update product
- `DELETE /api/products/:id` – delete product
- `POST /api/products/:id/movement` – record stock in/out
- `GET /api/movements` – stock movement history
- `GET /api/categories` – available categories

## Project Structure

```text
SmartStock-Inventory-Management-System/
├── data/
│   └── inventory.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Notes for GitHub

The project intentionally uses a local JSON data store so it can be cloned and run immediately without installing MySQL, PostgreSQL, or native database drivers. For a production deployment, the data layer can be replaced with PostgreSQL or another database without changing the main UI workflow.

## License

MIT
