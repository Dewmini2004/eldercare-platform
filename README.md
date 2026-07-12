# 🏡 ElderCare Sri Lanka Platform

A full-stack microservices platform for discovering, booking, and managing elder care homes and nurses across Sri Lanka — with AI-powered matching, SLNC nurse verification, emergency alerts, and online payments.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 Frontend                       │
│              (App Router · TypeScript · Tailwind)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                       API Gateway (Fastify)                      │
│                  Rate Limiting · Auth · Routing                  │
└──┬──────┬───────┬────────┬────────┬────────┬────────┬──────────┘
   │      │       │        │        │        │        │
  auth  homes  nurses  bookings alerts payment  ai    notification
   │      │       │        │        │        │        │
  DB1   DB2    DB3      DB4       DB5       -        -
         ▲
    PostgreSQL × 5 + Redis + RabbitMQ
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js + Fastify (all services) |
| **ORM** | DrizzleORM |
| **Databases** | PostgreSQL × 5 (one per service) |
| **Cache** | Redis |
| **Message Queue** | RabbitMQ |
| **AI** | Groq API + Llama 3 70B |
| **Payments** | PayHere (Sri Lanka) |
| **File Storage** | Cloudinary |
| **SMS** | Twilio |
| **Maps** | Google Maps API |
| **Monorepo** | Turborepo |
| **Containers** | Docker + Docker Compose |

---

## 📁 Project Structure

```
eldercare-platform/
├── apps/
│   └── web/                          # Next.js 15 frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/           # Login, Register, Forgot Password
│           │   ├── (public)/         # Homes listing, Nurses, About
│           │   └── (dashboard)/      # Family, Home Admin, Nurse, Admin dashboards
│           ├── components/
│           │   ├── ai/               # AI match UI, chatbot
│           │   ├── alerts/           # Emergency alert cards
│           │   ├── homes/            # Home cards, search, map
│           │   ├── nurses/           # Nurse cards, SLNC badge
│           │   └── payments/         # PayHere integration
│           └── lib/api/              # Typed API client
│
├── services/
│   ├── api-gateway/                  # Single entry point, rate limiting
│   ├── auth-service/                 # JWT auth, user management
│   ├── home-service/                 # Elder home CRUD + location search
│   ├── nurse-service/                # Nurse profiles + SLNC verification
│   ├── booking-service/              # Reservations + availability
│   ├── alert-service/               # Emergency alerts storage & dispatch
│   ├── payment-service/             # PayHere gateway integration
│   ├── ai-service/          ⭐       # Groq/Llama 3 AI features
│   │   ├── home-matching            #   Elder → Home AI matching
│   │   ├── nurse-matching           #   Elder needs → Nurse matching
│   │   ├── alert-analyzer           #   Incident report summarizer
│   │   ├── chatbot                  #   Family assistant (RAG)
│   │   └── document-validator       #   Certificate OCR extraction
│   └── notification-service/        # Email + SMS dispatch
│
├── packages/
│   ├── shared-types/                 # TypeScript interfaces (all services)
│   ├── shared-utils/                 # Common utilities
│   ├── database/                     # DrizzleORM base config
│   ├── logger/                       # Structured logging (pino)
│   └── event-bus/                    # RabbitMQ event definitions
│
└── infrastructure/
    ├── docker/                       # Per-service Dockerfiles
    ├── nginx/                        # Reverse proxy config
    └── scripts/                      # DB seed, migration scripts
```

---

## 🤖 AI Features

### 1. Home Matching (`POST /api/ai/match/homes`)
Input elder profile → Groq/Llama 3 scores all available homes → Returns ranked matches with explanations

### 2. Nurse Matching (`POST /api/ai/match/nurses`)
Input care requirements → Matches SLNC-verified nurses by specialization, language, budget

### 3. Emergency Alert Summarizer (`POST /api/ai/alerts/analyze`)
Staff writes raw incident report → AI produces family-friendly summary + severity level + suggested actions

### 4. Family Chatbot (`POST /api/ai/chat/message`)
Multi-turn assistant with Redis session memory, RAG on elder home data

### 5. Certificate Validator (`POST /api/ai/documents/extract-certificate`)
OCR text of nursing certificate → AI extracts fields + flags tampering

---

## 🏥 SLNC Nurse Verification

Automated cross-check against the Sri Lanka Nursing Council public registry:
- `slnc.lk/registered_nurses.php` → searches by registration number
- Returns: **Verified ✅** / **Not Verified ⚠️** / **Not Registered ❌**
- Re-checked every 30 days via cron job
- Full audit log stored in `slnc_verification_log` table

---

## 💳 Payments

Integrated with **PayHere** (Sri Lanka's leading payment gateway):
- Credit/Debit cards (Visa, Mastercard)
- Internet Banking
- Cash payments (Sampath Vishwa, etc.)
- Webhook confirmation → booking status update via RabbitMQ

---

## 🚨 Emergency Alert Flow

```
Home Staff → POST /alerts (raw incident)
    ↓
alert-service → publishes to RabbitMQ: alert.created
    ↓
ai-service → analyzes severity + generates family summary
    ↓
notification-service → SMS (Twilio) + Email to family
    ↓
Frontend WebSocket → real-time badge on family dashboard
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose
- npm ≥ 10

### 1. Clone & Install
```bash
git clone <repo-url>
cd eldercare-platform
cp .env.example .env
# Fill in your API keys in .env
npm install
```

### 2. Start Infrastructure
```bash
docker-compose up -d postgres-auth postgres-homes postgres-nurses postgres-bookings postgres-alerts redis rabbitmq
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start All Services
```bash
npm run dev
```

Services will be available at:
- Frontend:           http://localhost:3001
- API Gateway:        http://localhost:3000
- RabbitMQ UI:        http://localhost:15672 (eldercare / eldercare123)
- AI Service:         http://localhost:3007

---

## 🔑 Required API Keys

| Service | Where to Get |
|---|---|
| **Groq API** | console.groq.com (free tier available) |
| **Google Maps** | console.cloud.google.com |
| **PayHere** | payhere.lk/merchant |
| **Cloudinary** | cloudinary.com (free tier) |
| **Twilio** | twilio.com (free trial) |

---

## 📋 User Roles

| Role | Access |
|---|---|
| `family` | Search homes/nurses, book, receive alerts |
| `elder` | View their own profile/schedule |
| `nurse` | Manage profile, accept hire requests |
| `home_admin` | Manage their home listing, file alerts |
| `admin` | Full platform access, verification controls |

---

## 🗺️ Sri Lankan Districts Covered

All 25 districts across 9 provinces, with location-based search using Google Maps geocoding + Haversine distance filtering.

---

*Built with ❤️ for Sri Lanka's growing elder care needs*
