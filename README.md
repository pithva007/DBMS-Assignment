# Database Normalization Tool

A standalone React application for normalizing database schemas up to BCNF.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at http://localhost:5173

## Features

- Compute attribute closures
- Find all candidate keys
- Determine prime and non-prime attributes
- Check for 1NF, 2NF, 3NF, and BCNF violations
- Step-by-step normalization decomposition
- Interactive UI with examples
