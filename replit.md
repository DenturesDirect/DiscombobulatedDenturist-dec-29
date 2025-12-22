# The Discombobulated Denturist

## Overview
The Discombobulated Denturist is an AI-powered clinical workflow management system designed for denture professionals. It streamlines patient treatment tracking from initial consultation to follow-up, offering voice-to-text dictation, automated task suggestions, intelligent document generation, and treatment milestone tracking. The system supports a four-person dental clinic team (Denturist, Administrative, Lab Technician, Digital Technician) and operates on a "clinician-driven" philosophy, prioritizing user control and continuous, non-overwriting patient records. Its business vision is to enhance clinical clarity, ensure patient safety, and improve workflow efficiency in dental practices.

## User Preferences
Preferred communication style: Simple, everyday language.
The AI should NEVER auto-create tasks, auto-generate documents, or assume workflow steps.
The AI should only offer gentle suggestions (e.g., "Would you like me to...").
The clinician must control all decisions about workflow, timing, and next steps.
The AI should format clinical notes professionally but make no assumptions about workflow.
No changes to the database credentials or `USE_MEM_STORAGE` setting without explicit instruction.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Radix UI primitives, shadcn/ui ("new-york" style), Tailwind CSS for styling.
- **State Management**: TanStack React Query for server state, React hooks for local state.
- **Routing**: wouter for client-side routing.
- **Design Principles**: Clinician-driven clarity, patient safety-first information hierarchy, workflow efficiency, split-screen layout, Inter and JetBrains Mono typography, responsive design.

### Backend Architecture
- **Server Framework**: Express.js on Node.js.
- **API Design**: RESTful API with JSON responses.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Core Data Models**: Users, Patients (with CDCP status, photos, workflow tracking), Clinical Notes, Lab Notes, Admin Notes, Lab Prescriptions, Tasks, Patient Files, Appointments.
- **Storage Strategy**: Uses PostgreSQL database storage (`DbStorage`) for persistent data.
- **Middleware**: JSON body parsing, request/response logging, CORS.

### AI Integration
- **Provider**: OpenAI-compatible API via Replit's AI Integrations.
- **Core Features**: Clinical note processing, task assignment suggestions, follow-up prompts, document generation.
- **Critical Hard Rules**: Enforces medical/dental history updates, consent documentation, detailed treatment plan discussions (risks, benefits, costs, alternatives), and CDCP copay discussion documentation.
- **Staff Assignment Logic**: AI suggests tasks based on staff roles (Damien: treatment/procedures; Caroline: insurance/scheduling; Michael: lab; Luisa: digital).

### Data Flow Architecture
- **Voice Input → AI**: Web Speech API input sent to AI for formatting, analysis, and suggestions.
- **Patient Canvas**: Left panel for input (voice/text, photos), right for output (documents, timeline, photos); real-time updates via React Query.
- **Task Management**: AI suggests tasks from clinical notes; tasks filtered by staff; status updates refresh cache.
- **Caroline's Insurance Exception**: When a patient is marked as CDCP or has work insurance, automatically creates a high-priority insurance estimate task for Caroline, due the next business day (Mon-Fri only).

### Authentication
- **Strategy**: Custom email/password authentication (replaced Replit Auth)
- **Library**: Passport.js with local strategy + bcrypt (12 rounds)
- **Domain Restriction**: Only @denturesdirect.ca emails allowed
- **Staff Accounts**: 
  - damien@denturesdirect.ca (admin)
  - michael@denturesdirect.ca (staff)
  - luisa@denturesdirect.ca (staff)
  - info@denturesdirect.ca (Caroline, staff)
- **Default Password**: TempPassword123! (staff should change on first login)
- **Session Store**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Admin Features**: Password reset, login attempt monitoring (Settings page)

### Build and Deployment
- **Development**: Vite dev server, Express with `tsx`.
- **Production**: Vite builds client, esbuild bundles server.
- **Type Safety**: Shared schema types, Zod for runtime validation, TypeScript strict mode.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **Neon Serverless**: PostgreSQL connection.
- **Drizzle ORM**: Type-safe database queries.

### Object Storage
- **Replit Object Storage**: For patient photos.
- **Uppy**: File upload UI (with `@uppy/aws-s3` for S3-compatible storage).

### AI Services
- **OpenAI API**: For AI integration (accessed via Replit AI Integrations).

### Email Notifications
- **Gmail Integration**: Using Replit's Google Mail connector for patient notifications.
- **Per-Patient Toggle**: Each patient has an `emailNotifications` boolean field (defaults to false).
- **Manual Control**: Staff must explicitly enable notifications for each patient.
- **Privacy-First**: No automatic emails; clinician controls all communication.

### Documentation System
The system provides a comprehensive multi-type documentation workflow:
- **Clinical Notes**: AI-processed voice-to-text notes with automatic formatting and task suggestions. Must include date, reason, consent, history review, and next steps.
- **Lab Notes**: Plain text notes for in-house lab work (fabrication details, adjustments, materials used). No AI processing.
- **Admin Notes**: Plain text notes for administrative tracking (scheduling, billing, insurance follow-ups). No AI processing.
- **Lab Prescriptions**: Structured forms for external lab orders with fields for:
  - Lab selection (Vivi Labs, Vital Lab, Aesthetic Minds)
  - Case type (complete denture, partial, implant-retained, repair, etc.)
  - Arch (upper, lower, both)
  - Fabrication stage (framework only, try-in, finish, repair)
  - Deadline, design instructions, bite notes, shipping instructions
  - Auto-included safety clause: "No unstated design decisions are authorized. Please confirm any uncertainty prior to fabrication."
  - Status tracking (draft, sent, in_progress, completed)

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Language.
- **Drizzle Kit**: Database migration management.

### Utility Libraries
- **date-fns**: Date manipulation.
- **clsx + tailwind-merge**: CSS class composition.
- **zod**: Schema validation.
- **nanoid**: Unique ID generation.
- **cmdk**: Command palette.

### Browser APIs
- **Web Speech API**: Voice-to-text dictation.
- **FileReader API**: File uploads.