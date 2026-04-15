<div align="center">

<img width="276" height="94" alt="Screenshot 2026-04-15 at 12 26 30 AM" src="https://github.com/user-attachments/assets/58f58689-c33b-4e74-bdb3-fe46a8c3b1ca" />


**AI-powered assignment grading for instructors, powered by a rubric-aware agentic workflow.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

</div>

---

## Overview

GradeGenius is a full-stack web application that helps instructors grade student assignments — essays, code submissions, and short-answer responses — in a fraction of the time. Instructors upload a rubric and one or more submissions; a rubric-aware grading agent evaluates each submission criterion-by-criterion, retrieves similar graded examples for context, cites evidence from the student's work, and returns a structured grade with actionable feedback.

The goal is simple: keep the instructor in control of the rubric and the final call, but remove the tedious first pass of grading.

## Key Features

- **Rubric-driven grading** — Upload or author a rubric once and reuse it across assignments.
- **Multi-format submissions** — Supports essays, code, DOCX files, and free-form short answers.
- **Agentic grading pipeline** — A planning-and-tool-calling agent scores each rubric criterion individually, retrieves supporting context via RAG, and self-critiques before finalizing.
- **Evidence-grounded feedback** — Every score is tied back to a quoted span from the submission.
- **Analytics dashboard** — Class-level and per-assignment performance insights.
- **Token-based usage model** — Transparent per-grade cost, billed through Stripe.
- **Secure authentication** — Clerk-managed sessions, email verification, and protected routes.
- **Demo mode** — Try the grading flow without signing up.

## Tech Stack

**Frontend**
- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Lucide + FontAwesome icons · react-markdown · react-syntax-highlighter

**Backend / API**
- Next.js Route Handlers (Node runtime)
- Clerk (authentication and session management)
- Stripe (billing and token purchases)
- Nodemailer (contact + notification email)

**AI / Agentic Layer**
- LangChain + OpenAI (tool-calling agents, classification, grading)
- Pinecone (vector store for Retrieval-Augmented Generation)
- Custom classification and content-analysis modules

**Data & Storage**
- AWS S3 (submission files, rubrics, graded outputs)
- AWS DynamoDB (users, token balances, grade records, agent run traces)
- Vercel Postgres (auxiliary structured data)

**Infrastructure**
- Vercel (hosting, edge, CI/CD)
- AWS SDK v3 (S3 + DynamoDB clients, presigned URLs)

## Architecture at a Glance

```
 ┌────────────────────┐      ┌──────────────────────┐      ┌────────────────────┐
 │  Next.js Frontend  │ ───▶ │  API Route Handlers  │ ───▶ │  Grading Agent     │
 │  (App Router, RSC) │      │  (Auth, Upload, etc.)│      │  (LangChain + RAG) │
 └────────────────────┘      └──────────────────────┘      └─────────┬──────────┘
           ▲                           │                             │
           │                           ▼                             ▼
           │               ┌──────────────────────┐      ┌────────────────────┐
           │               │  AWS S3 / DynamoDB   │      │  Pinecone (RAG)    │
           │               └──────────────────────┘      └────────────────────┘
           │                           │
           └───────────────────────────┘
               Stripe · Clerk · Vercel
```

The grading agent plans a run, calls discrete tools (`detect_submission_type`, `fetch_rubric`, `retrieve_similar_examples`, `score_rubric_criterion`, `finalize_grade`), scores each criterion individually with a strict JSON schema, and runs a self-critique pass before persisting results.

## Screenshots

### Dashboard
<img width="1512" height="824" alt="Screenshot 2026-04-15 at 12 16 30 AM" src="https://github.com/user-attachments/assets/5356894a-5765-483a-8744-938702f96a90" />

### Assignments & Uploads
<img width="1509" height="816" alt="Screenshot 2026-04-15 at 12 16 38 AM" src="https://github.com/user-attachments/assets/c6885ba3-0314-4676-b814-4b49961a3191" />

### Rubrics
<img width="1503" height="822" alt="Screenshot 2026-04-15 at 12 16 56 AM" src="https://github.com/user-attachments/assets/ed72c3de-b9b1-4def-9ebe-3611de2a724c" />

### Grade / Feedback View
<img width="1510" height="818" alt="Screenshot 2026-04-15 at 12 20 12 AM" src="https://github.com/user-attachments/assets/ce47c2a0-80c8-4ea6-8536-a59b62242365" />

## Project Structure

```
app/
├── analytics/         # Class-level performance dashboards
├── api/               # Route handlers (grade, upload, rubrics, tokens, etc.)
├── assignments/       # Assignment management UI
├── components/        # Shared React components
├── context/           # React context providers
├── dashboard/         # Main instructor dashboard
├── demo/              # Public demo flow
├── grade/             # Per-submission grade view
├── lib/               # Agent, RAG, S3, DynamoDB, prompts
│   └── rag/           # RAG service + types
├── rubrics/           # Rubric authoring and library
├── settings/          # Account and preferences
├── tokens/            # Stripe-backed token purchases
├── login/ · signup/ · verify/   # Auth flows (Clerk)
└── privacy/ · terms/ · help/    # Static content
scripts/               # DynamoDB setup + migration scripts
```

## Getting Started

### Prerequisites
- Node.js 20+
- An AWS account (S3 + DynamoDB)
- Clerk, OpenAI, Pinecone, and Stripe accounts
- A Vercel account (optional, for deployment)

### Installation

```bash
git clone https://github.com/<your-username>/GradeGenius.git
cd GradeGenius
npm install
```

### Environment Variables

Create a `.env.local` file in the project root with the following keys:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenAI
OPENAI_API_KEY=

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX=

# AWS
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
DYNAMODB_TABLE=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Database Setup

```bash
node scripts/setup-dynamodb.js
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Deployment

GradeGenius is designed to deploy on **Vercel** with zero configuration. Push to your connected Git repository and Vercel will build and deploy automatically. AWS and Pinecone credentials should be configured as Vercel environment variables.

## Agentic Workflow

The grading endpoint does not rely on a single monolithic prompt. Instead, a LangChain tool-calling agent orchestrates the run:

1. **Plan** — The agent drafts a plan for which rubric criteria to evaluate and what context to retrieve.
2. **Retrieve** — It queries Pinecone for similar graded examples, scoped to each criterion.
3. **Score** — A dedicated tool scores one criterion at a time and returns a strict JSON object (`score`, `evidence`, `justification`), validated with Zod.
4. **Critique** — A self-review pass checks evidence grounding and rubric coverage, and re-scores any low-confidence criteria.
5. **Finalize** — The agent persists the grade to S3/DynamoDB, deducts tokens, and returns the result.

Guardrails include `maxIterations`, a wall-clock timeout, per-call token-budget checks, strict schema validation on tool outputs, and a deterministic fallback to the linear pipeline if the agent cannot converge.

## Scripts

| Script                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the development server                  |
| `npm run build`        | Build the production bundle                   |
| `npm run build:no-lint`| Production build skipping ESLint              |
| `npm start`            | Start the production server                   |
| `npm run lint`         | Run ESLint                                     |

## Roadmap

- LMS integrations (Canvas, Google Classroom)
- Batch grading queues with background workers
- Instructor override + grade-appeal workflow
- Fine-tuned domain-specific grading models

## License

This project is private and not currently licensed for redistribution.

## Contact

For questions, feedback, or demo access, use the contact form on the site or open an issue in this repository.
