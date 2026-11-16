# Kisan Loan Portal
### Agricultural Credit Decision and Transparency System

A web-based agricultural credit management prototype designed to improve transparency in agricultural loan applications, credit assessments, bank decisions, and government monitoring.

The platform provides three interconnected interfaces for **Farmers**, **Bank Officers**, and **Government Officers**, allowing agricultural credit processes to be demonstrated through a unified system.

**GitHub Repository:** https://github.com/akiranih/kisan-loan-portal

---

## 1. Problem Statement

Access to agricultural credit remains challenging for many small and marginal farmers. Farmers may have limited visibility into how their loan applications are evaluated, while financial institutions must consider income variability, existing debt, agricultural risks, and repayment capacity.

At the same time, government authorities require visibility into agricultural credit distribution, bank decisions, and farmer grievances.

The **Kisan Loan Portal** addresses these challenges through an integrated system that:

- Collects structured agricultural and financial information from farmers.
- Supports explainable credit assessment and loan decision-making.
- Enables banks to review applications, issue loan offers, and communicate reasons for decisions.
- Allows farmers to track applications, respond to offers, and raise grievances.
- Provides government officers with monitoring dashboards and grievance oversight.

The project emphasizes **decision transparency, relational database design, and coordination among stakeholders**.

## 2. Project Objectives

- Develop an accessible agricultural loan application interface.
- Collect information relevant to repayment capacity and farming risk.
- Provide a structured loan assessment process.
- Explain the reasons behind bank lending decisions.
- Enable farmers to track application progress and respond to bank offers.
- Demonstrate government oversight of agricultural credit activity.
- Implement a normalized PostgreSQL database schema.
- Explore uncertainty in agricultural income using Monte Carlo simulation.
- Provide a multilingual interface to improve accessibility.

## 3. System Overview

The system consists of three user interfaces.

### 3.1 Farmer Interface

The Farmer Interface allows users to:

- Register and log in using a mobile number and password.
- Complete a four-step agricultural loan application.
- Provide farming, crop, income, debt, and loan requirement details.
- Review submitted applications.
- View bank decisions and associated explanations.
- Accept or decline offers or request reconsideration.
- Raise grievances and track their status.

**Loan Application Stages:**

1. Farming Details
2. Financial Details
3. Loan Request
4. Review and Submit

### 3.2 Bank Officer Interface

The Bank Officer Interface supports:

- Reviewing submitted loan applications.
- Filtering applications by bank and status.
- Inspecting farmer-provided financial and agricultural information.
- Evaluating repayment capacity and credit risk.
- Running illustrative Monte Carlo simulations.
- Recording loan offers, decisions, and explanations.
- Managing reconsideration requests.
- Responding to farmer grievances.
- Tracking processing and disbursement stages.

The assessment interface separates financial indicators from agricultural and verification-related concerns to make its findings easier to interpret.

### 3.3 Government Officer Interface

The Government Officer Interface supports:

- Monitoring agricultural loan applications across banks.
- Viewing requested loan values and application statuses.
- Comparing bank-wise credit activity.
- Reviewing decisions and recorded assessment information.
- Identifying cases requiring attention.
- Monitoring grievances and bank responses.
- Reviewing the progression of applications through the lending workflow.

## 4. Loan Assessment and Decision Transparency

The portal uses an explainable assessment workflow rather than presenting a loan decision as an unexplained result.

The financial assessment considers factors such as:

- Annual household and agricultural income.
- Existing loan repayments.
- Requested loan amount.
- Estimated repayment obligations.
- Household expenditure assumptions.
- Agricultural income variability.

The system supports bank decisions with recorded explanations, allowing applicants to understand the reasoning behind an offer or rejection.

**Important:** The assessment is illustrative and is not an official bank underwriting model or a regulator-approved credit scoring system.

## 5. Monte Carlo Simulation

Agricultural income is exposed to uncertainty arising from weather, crop yield, production costs, and market conditions.

The portal includes a **Monte Carlo simulation** to explore the possible impact of such uncertainty on annual financial surplus.

### Simulation inputs

- Baseline crop production costs.
- Annual household expenditure.
- Maximum assumed crop-income decline.
- Maximum assumed crop-income increase.
- Annual loan interest rate.
- Assumed loan repayment duration.

### Simulation outputs

The simulation generates **2,000 illustrative crop-income scenarios** and reports:

- Median annual surplus.
- Lower and upper percentile outcomes.
- Frequency of simulated financial shortfalls.
- Estimated annual payment on the requested loan.
- Existing annual repayment obligations.
- Distribution of simulated annual surplus.

The simulation uses hypothetical assumptions and triangularly distributed crop-income variations. Its outputs support scenario analysis rather than calibrated default-probability prediction.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React |
| Programming Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Route Handlers |
| Database | PostgreSQL |
| Database Administration | pgAdmin 4 |
| Authentication | bcryptjs, JOSE, signed HTTP-only cookies |
| Database Connectivity | node-postgres (`pg`) |
| Version Control | Git and GitHub |

## 7. Database Design

The project includes a PostgreSQL relational schema consisting of **26 tables**, organized around account management, farmer profiles, banking institutions, agricultural applications, risk assessments, credit decisions, grievances, and auditing.

### Account and reference data

- `user_accounts`
- `farmers`
- `identity_checks`
- `states`
- `districts`
- `villages`
- `banks`
- `branches`
- `bank_officers`
- `government_officers`

### Agricultural applications

- `loan_products`
- `applications`
- `farm_plots`
- `application_plots`
- `crop_types`
- `application_crops`
- `income_sources`
- `existing_loans`
- `consent_records`
- `application_documents`

### Assessments, decisions, and accountability

- `rule_versions`
- `risk_assessments`
- `bank_decisions`
- `disbursements`
- `grievances`
- `audit_events`

### Database normalization

The schema follows relational normalization principles, including **Third Normal Form (3NF)** as a design objective.

Separate tables for farmers, applications, crops, income sources, banks, and decisions reduce redundant data and support well-defined relationships through primary keys and foreign keys.

For example, multiple crops associated with an application are represented in `application_crops` instead of being stored as repeated columns in the main application record.

The `application_plots` table supports the many-to-many relationship between loan applications and farm plots.

### Current implementation scope

PostgreSQL is used for database-backed account registration, password verification, user sessions, and officer profile relationships.

The interactive application, offer, assessment, and grievance walkthrough uses browser-based demonstration records. The relational schema defines the corresponding persistence model for these lending workflows.

## 8. Multilingual Interface

The portal includes multilingual interface support to improve usability for farmers from different linguistic backgrounds.

The interface design considers the following languages:

- English
- Hindi
- Kannada
- Tamil
- Telugu
- Malayalam

This language-oriented design aims to make agricultural credit information easier to understand.

## 9. Application Workflow

**Farmer Application → Bank Review → Credit Assessment → Bank Decision → Farmer Response → Government Monitoring**

The system also supports reconsideration and grievances.

A farmer may submit a grievance regarding an application or bank decision. The government interface can request an explanation from the bank, review its response, and record the outcome.

This demonstrates the coordination of multiple stakeholders within one agricultural credit workflow.

## 10. Installation and Local Setup

### Prerequisites

Install:

- Node.js and npm
- PostgreSQL
- pgAdmin 4 (recommended)
- Git

### Clone the repository

```bash
git clone https://github.com/akiranih/kisan-loan-portal.git
cd kisan-loan-portal
```

### Install dependencies

```bash
npm install
```

### Create a PostgreSQL database

Create a local database named:

```text
kisan_loan_portal
```

Import the project's PostgreSQL schema through pgAdmin or another SQL client when the schema SQL file is available.

### Configure environment variables

Create a file named `.env.local` in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kisan_loan_portal
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET
```

Replace the placeholder values with your local PostgreSQL password and a securely generated session secret.

Never commit `.env.local` to GitHub.

### Start the application

```bash
npm run dev
```

Open:

**http://localhost:3000**

### Database connection test

During local development, the database connection can be checked at:

```text
http://localhost:3000/api/db-test
```

The endpoint verifies PostgreSQL connectivity and the number of public tables.

### Officer accounts

Bank and Government Officer accounts must be created separately because they reference bank branches and government entities in the database.

A local setup script is available at:

```text
scripts/create-officers.mjs
```

Run it only after creating the required bank, branch, and state records. The officer identifiers and passwords generated during setup should be kept private.

## 11. Demonstration and Testing

The project has been tested through an end-to-end demonstration involving all three interfaces.

The walkthrough covers:

1. Farmer registration and login.
2. Completion of an agricultural loan application.
3. Bank review and credit assessment.
4. Recording an offer or decision with reasons.
5. Farmer response to a bank offer.
6. Government monitoring of applications and bank decisions.
7. Farmer grievance submission and follow-up.
8. Database-backed authentication and account verification.

The demonstration should use fictional user and financial data.

## 12. Project Scope

The Kisan Loan Portal is an academic prototype focused on demonstrating database design, workflow transparency, and agricultural credit assessment.

It is not intended to provide legally binding loan approvals, replace a regulated lending platform, or predict actual borrower defaults.

Potential extensions include connecting all operational workflows directly to PostgreSQL, document verification, integration with banking systems, and calibration of risk assessment models using validated agricultural and repayment data.

---

*Developed as an academic DBMS project to demonstrate transparent agricultural credit assessment and multi-stakeholder loan management.*