# Majed Group — مجموعة ماجد

A project management and pricing system for an aluminum and metalworks (ألمنيوم وحدادة) workshop. It runs in the browser with no server or build step. Open `index.html`, or host the folder on GitHub Pages. It works on phone and desktop, in Arabic (RTL) and English, with dark and light themes.

## Features
- **Projects**: client, phone, location, status (quote, in progress, completed, cancelled), payments, expenses, profit per project.
- **Pricing calculator**
  - Aluminum: sliding, casement, fixed, door. Enter the width, height, sashes, top fixed panel, color/finish, glass and insect net. It calculates the aluminum weight from the profiles (kg/m × price per kg), the glass area, accessories and labor, then gives the price, price per m² and cost breakdown.
  - Metalworks (حدادة): gate, steel door, railing, window guard, pergola. It calculates the steel weight from the profiles, sheet metal, consumables, labor and paint per kg, and roofing, then gives the price and price per kg.
- **Automatic technical drawing** for every item (SVG with dimensions, opening directions and bars). It appears in the editor, on the item cards and in the quotation.
- **Cut list (قائمة القص)**: every piece grouped by profile and nested onto stock bars to reduce waste. It shows the bars to buy and the weight.
- **Sketch pad (لوح الرسم)**: grid, lines and rectangles that show their length in cm automatically at the chosen scale, pen, text, eraser. Sketches are saved to a project.
- **Quotation (عرض سعر)**: printable / PDF with drawings.
- **Reports**: monthly and yearly sales, collected payments, expenses, net cash, estimated profit, split by section, a monthly chart, expenses by category, print and CSV export.
- **Settings**: every price is editable (aluminum finishes per kg, glass per m², profiles kg/m, opening systems, steel, sheet, labor, paint prices, roofing types). Includes JSON backup and restore.

### Accounting & management (v2)
- **Users and roles**: admin, accountant, sales, worker/viewer. Each user signs in with a password. Sales users cannot see costs or profit, and workers see no prices at all. Every add, edit, delete and sign-in is written to an audit log.
- **Quick entry**: one tap to record materials (بضاعة), worker wages (أجار شغيلة), fuel (بنزين), shop rent (أجار محل), generator/electricity, receive a customer payment, buy stock on credit, pay a supplier, give an advance. Amounts can be entered in USD or LBP, and LBP is converted at the configured rate.
- **Fixed monthly costs**: rent, generator subscription, internet and so on. The app reminds you each month and records the cost in one tap.
- **Customers**: every customer shows as paid in full (دفع كامل), partly paid (دفع جزء), not paid (ما دفع) or overdue (متأخر). Each has a statement with a running balance, printable receipts and a WhatsApp reminder link.
- **Suppliers**: purchases on credit or cash, supplier payments and the balance we owe.
- **Workers**: daily or monthly wages, advances (سلف) deducted from wages, and payment history.
- **Double-entry books**: every transaction is posted automatically as a balanced journal entry. Includes a treasury page (cash box and bank accounts, transfers, owner capital and drawings), journal, general ledger, trial balance, income statement (P&L with direct costs vs operating expenses), balance sheet and period close (locks a month once it has been reviewed).

Data is stored in the browser's localStorage on each device. Use **Settings → Export data** regularly to keep a backup.
