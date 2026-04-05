# Software Development Life Cycle (SDLC) Breakdown

For the **NextStop Admin Portal**, our 5-person team executed an iterative Agile SDLC model to build the React/Next.js frontend. Below is the phase-by-phase explanation of our development process based exclusively on this repository's structure.

---

## Phase 1: Planning and Requirement Gathering
- **Objective**: Identifying exactly what the administrators of the public transport grid needed.
- **Execution in Project**: We determined that fleet tracking, ticket analytics, and CRM capabilities (adding buses/drivers) were paramount based on functional requirements. 
- **Outcome**: The decision to use a React-based application equipped to handle high-frequency data polling (for `LiveBusFeed.jsx` and `OlaMap.jsx`).

## Phase 2: System Design
- **Objective**: Crafting the architectural patterns and user interface mockups prior to extensive coding.
- **Execution in Project**: 
    - Decision to utilize **Next.js 16 App Router** for implicit layout mechanisms and streamlined routing (`app/(dashboard)` vs `app/login`).
    - Mapping out abstract structures resulting in our `lib/` vs `components/` decoupling format.
    - Deciding on Tailwind CSS combined with Radix UI to enforce strict design scaling constraints efficiently.

## Phase 3: Development (Implementation)
- **Objective**: Writing the source code spanning hooks, context providers, and dynamic Next.js functional components.
- **Execution in Project**: 
    - Constructing the abstract API driver (`lib/api.js`) which uses native browser `fetch` combined with LocalStorage token intercepts.
    - Building the Reusable Context `contexts/AuthContext.jsx` to secure the system.
    - Engineering heavy interactive data-views like `NetworkGraphView.jsx` and `DemandChart.jsx`.

## Phase 4: Testing
- **Objective**: Ensuring the portal runs without visual breaks and handles edge cases dynamically (like auth drops or empty payloads).
- **Execution in Project**: 
    - Manually rendering and validating the React functional layouts per page boundaries.
    - Utilizing Next.js `layout.js` error boundaries to trap unhandled visual rejections inherently without app crashes.
    - Enforcing codebase syntax sanity checking via `.eslintrc` and `eslint-config-next`.

## Phase 5: Deployment & Maintenance
- **Objective**: Releasing the dashboard reliably and efficiently in production constraints.
- **Execution in Project**: 
    - Setting up `run build` (`"build": "next build"`) routines to output highly optimized, minified Next.js statically generated hybrid bundles via SWC (`@next/swc-darwin-arm64`).
    - Maintaining flexible configurations using environment variables (`NEXT_PUBLIC_API_URL` within `.env`), enabling zero-change staging vs production transitions.
