<!-- e04f77f2-f5cf-47c2-95d3-4293c363b807 69ab1357-3021-4c89-be69-4dc7697ab452 -->
# Caderno Development Roadmap

## Phase 1: Foundation & Infrastructure

Establish the project structure, containerization, and basic backend-frontend connectivity.

-   **Project Setup**
    -   Initialize Monorepo structure (or separate folders) for `client` and `server`.
    -   Setup **Server**: Node.js, TypeScript, Express.
    -   Setup **Client**: Vite 6, React 19, TypeScript, Zustand, TailwindCSS 4, DaisyUI.
    -   Configure **PostgreSQL** database.
-   **Docker Environment**
    -   Create `Dockerfile` for Server.
    -   Create `Dockerfile` for Client (dev mode).
    -   Create `docker-compose.yml` to orchestrate Server, Client, and Database.
    -   Verify containers can communicate (e.g., API health check).

## Phase 2: Authentication & User Identity

Implement secure user registration and authentication, laying the groundwork for encryption keys.

-   **Backend Auth**
    -   Design User Schema (PostgreSQL).
    -   Implement Registration/Login endpoints.
    -   Setup Session management (JWT or Session-based).
    -   **Crucial:** Plan for storing *encrypted* private keys (or salt/verifier) securely; the server must never see the plaintext password or decryption key.
-   **Frontend Auth**
    -   Create Login/Signup forms (DaisyUI).
    -   Implement auth state management with Zustand.
    -   Integrate with backend APIs.

## Phase 3: Core Journaling & End-to-End Encryption (E2EE) (Current Goal)

The heart of Caderno: secure writing and reading.

-   **Encryption Layer**
    -   Select crypto library (e.g., Web Crypto API or sodium-plus).
    -   Implement Key Generation: Derive Master Key from user password (client-side only).
    -   Implement Encryption/Decryption functions for journal entries.
-   **Journal Management**
    -   **Backend:** CRUD endpoints for Entries (storing *only* ciphertext).
    -   **Frontend:**
        -   Editor component (Markdown support).
        -   Encrypt entry before sending to API.
        -   Decrypt entries after fetching from API.
        -   Local-first sync strategy (optional but recommended for resilience).

## Phase 4: The "Dead Man's Switch" (Safety Mechanism)

Implement the automated trigger system.

-   **Logic & Scheduling**
    -   Design "Switch" Schema (triggers, recipients, timer settings).
    -   **Backend Scheduler:** Periodic jobs (e.g., BullMQ or cron) to check for expired timers.
    -   **Crypto Challenge:** How to release keys without the server having them? (Likely involves Shamir's Secret Sharing or pre-encrypted payloads for recipients).
-   **User Interface**
    -   Settings UI to configure timer duration and recipients.
    -   "Check-in" mechanism (button/activity) to reset the timer.

## Phase 5: Federation (ActivityPub)

Enable decentralized communication between Caderno instances.

-   **ActivityPub Implementation**
    -   Implement WebFinger and Actor endpoints.
    -   Allow users on Server A to follow/interact with Server B (if applicable to journaling sharing/publishing).
    -   Ensure E2EE payloads can be transported over ActivityPub if sharing is enabled.

## Phase 6: Polish & Security Hardening

Review and refine before release.

-   **Security Audit:** Review auth flows and crypto implementation.
-   **UI/UX Polish:** Theming, responsive design, accessibility.
-   **Documentation:** Self-hosting guide, API docs.

---