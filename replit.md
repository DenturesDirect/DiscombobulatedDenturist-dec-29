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
- **Core Data Models**: Users, Patients (with CDCP status, photos, workflow tracking), Clinical Notes, Tasks, Patient Files, Appointments.
- **Storage Strategy**: Currently uses in-memory storage (`MemStorage`) for development due to database issues; designed to switch to PostgreSQL (`DbStorage`).
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

### Session Management
- **Strategy**: PostgreSQL-backed sessions using `connect-pg-simple` for persistence.

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