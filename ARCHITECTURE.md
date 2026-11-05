# Regional Sales Intelligence: System Architecture

Regional Sales Intelligence is an executive decision-support dashboard designed to transform raw transaction records into strategic revenue insights. The application automates the ingestion and data-cleaning of sales order CSV files—reconciling text inconsistencies, typos, and formatting discrepancies—while dynamically aggregating quarterly revenue totals, unit volumes, and discount metrics across geographic territories. Through interactive comparative charts, financial pivot tables, and product/channel drilldown views, leadership teams can immediately identify growth patterns and risk areas. In addition, the platform synthesizes complex financial movements into a verified, three-sentence executive summary powered by Google Gemini (supported by a deterministic calculation fallback engine) that pinpoints the sales territory with the largest quarter-over-quarter variance and highlights the primary product and channel drivers behind the change.

## File Directory & Purpose

| File Path | Description |
| :--- | :--- |
| `.env.example` | Provides a template for required environment variables, specifically the Google Gemini API key used for generating executive narratives. |
| `.gitignore` | Specifies files and directories that Git version control should ignore, such as build outputs and local dependencies. |
| `bun.lock` | Records exact package versions and dependency trees from Bun package management. |
| `index.html` | Serves as the primary HTML webpage entry point, defining SEO metadata, viewport settings, and the root element for the user interface. |
| `metadata.json` | Defines platform application metadata, capabilities, and permissions for the AI Studio cloud runtime environment. |
| `package.json` | Manages Node.js project configuration, startup and build scripts, and external library dependencies. |
| `public/assets/aistudio/Lab_1_-_Regional_Sales__1__de1de499.csv` | Provides a default historical regional sales dataset containing orders, revenue, discount rates, and regional dimensions for instant demonstration. |
| `server.ts` | Runs the Node.js Express backend server that serves the web application, exposes the sample sales data endpoint, and generates AI-powered or deterministic financial variance summaries. |
| `src/App.tsx` | Acts as the central React application controller, coordinating data intake, regional calculations, executive KPI displays, AI summary generation, and interactive drilldowns. |
| `src/components/AISummaryCard.tsx` | Displays an executive-ready, three-sentence narrative explaining which sales region experienced the greatest variance between Q2 and Q3 and the operational drivers behind that shift. |
| `src/components/DataCleaningAuditModal.tsx` | Displays an audit report modal detailing all automated text normalization and error reconciliations performed on raw CSV order data. |
| `src/components/ExecutiveMetrics.tsx` | Presents high-level financial KPI cards, including total revenue, order volume, average discount percentage, and key quarterly trends. |
| `src/components/RawOrdersDrawer.tsx` | Provides a slide-out inspection drawer allowing users to search, filter, and review individual sanitized order records. |
| `src/components/RegionalDrilldown.tsx` | Offers a detailed analytical view for a selected sales territory, breaking down revenue performance by product category and sales channel. |
| `src/components/RevenueChart.tsx` | Renders visual bar and trend charts comparing quarterly revenue performance across all geographic regions. |
| `src/components/RevenueTable.tsx` | Displays a financial pivot table summarizing quarter-over-quarter revenue totals, dollar differences, and percentage changes across regions. |
| `src/components/UploadDropzone.tsx` | Enables business users to drag and drop or browse for new sales order CSV files to update reports and calculations dynamically. |
| `src/index.css` | Sets up global stylesheet styles and imports Tailwind CSS utility classes across the application. |
| `src/main.tsx` | Boots the React client application by mounting the root component into the browser Document Object Model (DOM). |
| `src/types.ts` | Defines TypeScript data contracts and interfaces for sales orders, regional summaries, variance analytics, and API payloads. |
| `src/utils/salesAnalytics.ts` | Contains the business logic engine for parsing raw CSVs, correcting text anomalies, calculating quarterly revenue pivots, and computing territory variance drivers. |
| `tsconfig.json` | Configures TypeScript compiler rules, path aliases, and ECMAScript compilation targets for the codebase. |
| `vite.config.ts` | Configures the Vite development and build tooling, bundling plugins, and development server behaviors. |
