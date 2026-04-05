# NextStop Admin Portal - Capstone Project

## 1. Project Overview
The **NextStop Admin Portal** is an advanced operational dashboard to manage public transportation logistics. It provides real-time geographic tracking for buses using Ola Maps, fleet management capabilities (Buses, Drivers, and Conductors), and extensive demand/revenue analytics. 

This repository constitutes the comprehensive Phase 3 System Design Capstone submission.

## 2. Platform Features
Based on the existing implementation, the portal encompasses:
- **Live Bus Tracking**: Real-time geolocation of active buses using Ola Maps SDK.
- **Fleet Management**: Full CRM functionalities (CRUD operations via `/lib/api.js`) to manage Fleet Buses, Drivers, and Conductors.
- **Route & Stop Management**: Features like Network Graph View, Route Scheduling, and a visual Stops Builder.
- **Analytics & Reporting**: Demand charts, real-time ticket analytics, device health monitoring, and revenue summaries.
- **Authentication**: Secured access leveraging a central `AuthContext`.

## 3. Tech Stack
- **Framework**: Next.js 16.0 (React 19.2) using App Router architectural paradigms.
- **Styling**: Tailwind CSS v4 combined with Radix UI (shadcn style primitives).
- **Visualization**: Chart.js and Recharts for analytical graphics.
- **Maps**: `olamaps-web-sdk` for interactive, live data plotting.

## 4. Design Patterns Identified
1. **Model-View-Controller (MVC) Architectural Pattern**
2. **Singleton Pattern** (via API instance and Auth Context)
3. **Observer/PubSub Pattern** (inherent within React Context and Component State mechanisms)
*(See `docs/Design_Patterns.md` for full explanation)*

## 5. Object-Oriented Principles (OOP) Reflected
Though built primarily on functional React, OOP concepts dictate the application design:
- **Encapsulation**: Using React Hooks (`useDemandAnalysis`) and Context (`AuthContext`) to encapsulate internal state completely isolated from views.
- **Abstraction**: `lib/api.js` acts as an abstracted boundary handling all backend token injections without exposing REST logic to UI components.
- **Inheritance / Composition**: Reusable UI primitives (`ui/`) used via composition across high-level feature modules `<CreateBusModal>`, `<DemandChart>`.
- **Polymorphism**: The singular API client interface acting dynamically across varying resource endpoints.
*(See `diagrams/Class_Diagram.md` for details)*

## 6. Software Development Life Cycle (SDLC)
We employed an **Agile/Iterative Methodology**. 
*(See `docs/SDLC_Breakdown.md` for the full breakdown of phases).*

---

## 👥 CAPSTONE PROJECT: TEAM WORK DISTRIBUTION

This repository represents the hard work of a 5-member team. The deliverables have been distributed directly reflecting the codebase:

### Person 1: System Overview & Life Cycle (Name: [Insert Name])
- **Role**: Responsible for `README.md` and `docs/SDLC_Breakdown.md`.
- **Suggested Commit Message**: `docs: add comprehensive project overview and agile SDLC phase breakdown`

### Person 2: Component Architecture & OOP (Name: [Insert Name])
- **Role**: Documented the code component logic, creating `diagrams/Class_Diagram.md` mapping encapsulated API entities to frontend React logic.
- **Suggested Commit Message**: `docs: formulate class diagrams and OOP documentation based on application hooks and entities`

### Person 3: Software Design Patterns (Name: [Insert Name])
- **Role**: Wrote `docs/Design_Patterns.md`, highlighting the utilization of MVC formatting in App Router and Singleton paradigms inside API wrappers.
- **Suggested Commit Message**: `docs: analyze and document MVC and Singleton pattern usage in Next.js structure`

### Person 4: Database & Entity Management (Name: [Insert Name])
- **Role**: Extrapolated the Relational Schema and Entity linkages forming `diagrams/ER_Diagram.md` and `db/schema.sql` based entirely on the existing `api.js` structure.
- **Suggested Commit Message**: `db: generate reverse-engineered relational SQL schema and entity definitions`

### Person 5: Source Code Structure Analysis (Name: [Insert Name])
- **Role**: Wrote `docs/Source_Structure.md` comprehensively explaining our specialized usage of Next.js `/app` router layouts alongside modular decoupled `/components`.
- **Suggested Commit Message**: `docs: structure detailed architectural analysis of Next.js source code layer`
