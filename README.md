# FeedbackIQ — AI-Powered Customer Feedback Analysis

A beginner-friendly full-stack starter project for collecting customer feedback, analyzing sentiment and themes with Google's Gemini API, storing results in PostgreSQL, and exporting data for Power BI.

## Technology

- Frontend: Vite + TypeScript + HTML/CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- AI: Gemini API (REST)
- Analytics: dashboard summary + CSV export for Power BI

> This project uses the Vite + TypeScript approach from your earlier setup. It does not use Django. The app runs in demo mode without an API key; AI analysis requires a Gemini API key.

## 1. Requirements

Install:
- Node.js 20 or newer
- PostgreSQL
- Visual Studio Code

## 2. Open the project

1. Extract `FeedbackIQ_Project.zip`.
2. Open the extracted `FeedbackIQ` folder in VS Code.
3. Open Terminal → New Terminal.

## 3. Install packages

Run from the main `FeedbackIQ` folder:

```bash
npm install
npm run install:all
```

## 4. Configure PostgreSQL

Create a database named `feedbackiq` in pgAdmin or psql.

Example SQL:

```sql
CREATE DATABASE feedbackiq;
```

The backend creates its `feedback` table automatically when it starts.

## 5. Configure backend environment

1. Open `backend/.env.example`.
2. Make a copy named `backend/.env`.
3. Update `DATABASE_URL` with your PostgreSQL username and password.
4. Add your Gemini key to `GEMINI_API_KEY`.

Example for a local PostgreSQL installation:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/feedbackiq
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Get a Gemini API key from Google AI Studio: https://aistudio.google.com/app/apikey

Keep the key only in `backend/.env`. Never put it in frontend code or upload it to GitHub.

## 6. Start the application

From the main project folder:

```bash
npm run dev
```

Open the frontend URL printed by Vite (normally http://localhost:5173).

Backend health check: http://localhost:5000/api/health

## 7. How to use

1. Add a customer name and feedback message.
2. Select **Analyze with AI**.
3. The backend sends the message to Gemini and stores the returned sentiment, topic, summary and suggested action in PostgreSQL.
4. If the Gemini key is not configured, use **Demo analysis** to test the dashboard with a clearly labelled demo result.
5. Search and filter feedback records.
6. Export CSV and import it into Power BI.

## 8. Power BI

In Power BI Desktop:
1. Select **Get data → Text/CSV**.
2. Choose the CSV exported from FeedbackIQ.
3. Load the table and create visuals such as sentiment count, feedback by topic, and feedback trend.

## Troubleshooting

- **`npm` is blocked in PowerShell:** use `npm.cmd` instead of `npm`.
- **Database connection error:** confirm PostgreSQL is running, the `feedbackiq` database exists, and `DATABASE_URL` is correct.
- **AI unavailable:** confirm `GEMINI_API_KEY` is set in `backend/.env`, then restart the backend.
- **Port already in use:** change `PORT` in `backend/.env`, or stop the other process using port 5000.
- **CORS/network error:** keep the frontend and backend running using `npm run dev`.

## Project structure

```text
FeedbackIQ/
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   └── style.css
│   ├── index.html
│   └── package.json
├── backend/
│   ├── database/schema.sql
│   ├── src/server.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```
