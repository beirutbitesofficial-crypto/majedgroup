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

Data is stored in the browser's localStorage on each device. Use **Settings → Export data** regularly to keep a backup.
