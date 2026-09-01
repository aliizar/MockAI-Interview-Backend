# AI Mock Interview — Backend

Backend API for the **AI Mock Interview Practice App**.

This project provides authentication, email verification, interview management, AI-generated interview questions, interview answers, evaluation, preferences, and interview history.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt
- Zod
- Resend
- Gemini AI API
- OpenRouter AI API

---

## Prerequisites

Make sure the following are installed on your system:

- **Node.js** (LTS recommended)
- **npm**
- **PostgreSQL** database or a PostgreSQL-compatible cloud database such as Neon
- Git

You can check your Node.js and npm versions with:

```bash
node -v
npm -v
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aliizar/MockAI-Interview-Backend.git
```

Move into the project directory:

```bash
cd <BACKEND_PROJECT_FOLDER>
```

---

### 2. Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root of the backend project.

### Environment Variable Description

| Variable         | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `PORT`           | Port on which the backend server runs                        |
| `DATABASE_URL`   | PostgreSQL database connection string                        |
| `JWT_SECRET`     | Secret used to sign JWT authentication tokens                |
| `RESEND_API_KEY` | API key used for sending verification emails                 |
| `EMAIL_FROM`     | Sender email address used by Resend                          |
| `GEMINI_API_KEY` | API key used for AI-generated interview questions/evaluation |
| `FRONTEND_URL`   | Frontend application URL                                     |

> **Important:** Never commit your `.env` file or expose API keys/secrets publicly.

---

## Database Setup

This project uses **Prisma** with PostgreSQL.

After adding your database connection string to `.env`, generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev
```

If you are setting up the project for the first time and migrations are already included in the repository, Prisma will apply them to your database.

---

## Start the Development Server

Run:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:5000
```

---

## Production Build

To create a production build:

```bash
npm run build
```

Then start the compiled application:

```bash
npm start
```

> If your `package.json` uses different script names, use the scripts defined in your project.

---

## API

The backend exposes APIs for the following features:

### Authentication

```text
POST /api/auth/v1/register
POST /api/auth/v1/login
GET  /api/auth/v1/verify-email
```

Authentication uses JWT tokens.

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

### Interview

```text
POST /api/interviews/v1/start
POST /api/interviews/v1/:interviewId/answer
POST /api/interviews/v1/:id/evaluate
GET  /api/interviews/v1/history
GET  /api/interviews/v1/:id
```

The interview flow is:

```text
Start Interview
      ↓
Generate First AI Question
      ↓
Submit Answer
      ↓
Generate Next AI Question
      ↓
Continue Until Interview Ends
      ↓
Evaluate Interview
      ↓
View Interview Details
```

---

### Interview Preferences

Preferences are stored per user and can be used to automatically populate the interview setup.

The frontend can retrieve and update the user's saved interview preferences through the preferences API.

---

## Project Structure

A simplified project structure looks like this:

```text
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── interview.controller.ts
│   └── interview-evaluation.controller.ts
│
├── middleware/
│   └── auth.middleware.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── interview.routes.ts
│   └── preferences.routes.ts
│
├── services/
│   ├── ai/
│   │   └── ai.service.ts
│   ├── auth.service.ts
│   ├── interview.service.ts
│   └── ...
│
├── lib/
│   ├── prisma.ts
│   └── interview-timer.ts
│
├── app.ts
└── server.ts

prisma/
└── schema.prisma

.env
.gitignore
package.json
tsconfig.json
README.md
```

---

## Authentication Flow

The authentication system uses:

- bcrypt for password hashing
- JWT for authentication
- Email verification using Resend
- Protected routes using authentication middleware

Basic flow:

```text
Register
   ↓
Password Hashing
   ↓
User Created
   ↓
Verification Email Sent
   ↓
User Verifies Email
   ↓
Login
   ↓
JWT Token
   ↓
Access Protected APIs
```

---

## Interview Flow

When a user starts an interview, the backend receives:

```json
{
  "role": "Frontend Developer",
  "difficulty": "Intermediate",
  "interviewType": "Technical",
  "duration": 20
}
```

The backend:

1. Creates an interview record.
2. Generates the first AI question.
3. Saves the question in the database.
4. Returns the interview and question to the frontend.

When the candidate submits an answer:

1. The answer is saved.
2. The backend checks the interview timer.
3. The current interview context is retrieved.
4. AI generates the next question.
5. The new question is saved.
6. The question is returned to the frontend.

After the interview ends, the evaluation endpoint analyzes the completed interview and stores the evaluation results.

---

## Database

The application uses PostgreSQL with Prisma ORM.

Important entities include:

- User
- EmailVerificationToken
- Interview
- InterviewQuestion
- InterviewAnswer
- InterviewEvaluation
- InterviewPreferences

The database schema can be found at:

```text
prisma/schema.prisma
```

---

## Useful Prisma Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Create and apply a migration:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Troubleshooting

### Server does not start

Make sure dependencies are installed:

```bash
npm install
```

Also check that the `.env` file exists and contains the required variables.

---

### Database connection error

Check:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Make sure the database is accessible and the connection string is correct.

Then run:

```bash
npx prisma generate
```

and:

```bash
npx prisma migrate dev
```

---

### Authentication errors

Make sure `JWT_SECRET` is configured correctly:

```env
JWT_SECRET="your_secret"
```

---

### Email verification is not working

Check:

```env
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="onboarding@resend.dev"
```

Also make sure the frontend URL is configured correctly:

```env
FRONTEND_URL="http://localhost:5173"
```

---

### AI questions are not generated

Check that your Gemini API key is configured:

```env
GEMINI_API_KEY="your_gemini_api_key"
```

Also verify that the configured AI model/API is available.

---

## Development

Start the backend in development mode:

```bash
npm run dev
```

The frontend should run separately, for example:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5000
```

---

## Important Security Notes

Do not commit the following to GitHub:

```text
.env
API keys
JWT secrets
Database passwords
Private credentials
```

Make sure `.env` is included in `.gitignore`.

---

## Author

**Ali Haider**

AI Mock Interview Practice App — Backend
