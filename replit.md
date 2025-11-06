# The Discombobulated Denturist

## Overview

The Discombobulated Denturist is an AI-powered clinical workflow management system designed specifically for denture professionals. The application streamlines patient treatment tracking from initial consultation through delivery and follow-up, with voice-to-text dictation, automated task assignment, intelligent document generation, and treatment milestone tracking.

The system is built for a denturist clinic with four staff members:
- **Damien**: Denturist (treatment plans, clinical procedures, bite blocks, CDCP copay discussions)
- **Caroline**: Administrative (CDCP estimates, insurance, scheduling)
- **Michael**: Lab technician (denture setup, fabrication)
- **Luisa**: Digital technician (scan imports, digital design, processing)

The core philosophy is "clinician-driven" with minimal prompts, no unnecessary automation, and continuous patient records that never overwrite previous entries.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 6, 2025: Patient Photo Upload and Workflow Tracking

**Patient Photo Management**:
- Implemented patient photo upload using Replit Object Storage integration
- ObjectUploader component using Uppy Dashboard with drag-and-drop interface
- Secure signed URL generation for photo storage in `.private/patient-photos/` directory
- ACL-protected endpoints for photo retrieval (only authenticated users can access)
- PatientAvatar component displays photos with graceful fallback to initials
- Photo uploads integrated into NewPatientDialog with post-creation upload flow

**Workflow Tracking System**:
- Enhanced patient schema with workflow fields:
  - `dentureType`: 13 options (CUD, APUD, CPUD, CLD, APLD, CPLD, Repair, Tooth Addition, Reline, Rebase, Implant CUD)
  - `assignedTo`: Staff assignment (Damien, Caroline, Michael, Luisa)
  - `nextStep`: Upcoming task description
  - `dueDate`: Deadline tracking with date validation and transformation
  - `lastStepCompleted`: Treatment milestone tracking
  - `lastStepDate`: Timestamp of last completed step
- NewPatientDialog now includes all workflow fields with proper validation
- Active Patients page displays workflow data in PatientTimelineCard component
- Date field validation fixed: schema accepts both Date objects and ISO strings, automatically transforming strings to Date

**Technical Improvements**:
- Centralized storage configuration in `server/config.ts` for easy MemStorage/DbStorage switching
- Enhanced Zod schema with `.extend()` and `.transform()` for date field coercion
- ACL metadata system for secure photo access control
- End-to-end testing verified all features working correctly

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library configured with "new-york" style
- Tailwind CSS for styling with custom design tokens
- Design system follows "Healthcare-Productivity Hybrid" approach (Epic/Cerner meets Linear/Notion)

**State Management**:
- TanStack React Query (v5) for server state management and caching
- React hooks for local component state
- No global state management library

**Routing**: wouter for lightweight client-side routing

**Key Design Principles**:
- Clinical clarity with patient safety-first information hierarchy
- Workflow efficiency to minimize clicks
- Split-screen layout (left panel for input, right panel for output)
- Typography: Inter for UI/body text, JetBrains Mono for timestamps/metadata
- Responsive: Stack vertically (mobile) → 40/60 split (tablet) → Full split-screen (desktop)

### Backend Architecture

**Server Framework**: Express.js on Node.js

**API Design**: RESTful API with JSON responses

**Database ORM**: Drizzle ORM with PostgreSQL dialect

**Core Data Models**:
- **Users**: Authentication and staff member accounts
- **Patients**: Core patient records with CDCP status, tooth shade tracking, contact information, patient photos, and workflow tracking (denture type, assigned staff, next step, due dates, treatment milestones)
- **Clinical Notes**: Timestamped clinical documentation linked to patients
- **Tasks**: Staff task assignments with priority levels, due dates, and status tracking
- **Patient Files**: File attachments and clinical photos
- **Appointments**: Scheduling and appointment tracking

**Storage Strategy**: 
- **TEMPORARY**: Currently using in-memory storage due to disabled database endpoint
- Set in `server/config.ts` via `USE_MEM_STORAGE = true`
- All data and sessions reset on server restart
- Will switch back to PostgreSQL once Replit support re-enables the database endpoint
- In-memory implementation (MemStorage class) fully functional with all features
- Database storage (DbStorage class) ready to be reactivated by setting `USE_MEM_STORAGE = false`

**Middleware**:
- JSON body parsing with raw body preservation for webhooks
- Request/response logging with duration tracking
- CORS enabled for cross-origin requests

### AI Integration

**Provider**: OpenAI-compatible API via Replit's AI Integrations service

**Core AI Features**:
1. **Clinical Note Processing**: Converts plain English dictation into formal denturist clinical documentation
2. **Task Auto-assignment**: Automatically identifies and suggests task assignments to appropriate staff members
3. **Follow-up Suggestions**: Provides context-aware follow-up prompts
4. **Document Generation**: Creates referral letters, treatment plans, progress notes

**Critical Hard Rules Enforced by AI**:
- Every clinical note must end with medical/dental history update and consent documentation
- Treatment plans must document that patient was given option of doing nothing, all risks/benefits discussed, approximate costs provided, and alternative options (implants, crown/bridge) were discussed
- CDCP patients require copay discussion documentation with high-priority task creation if missing

**Staff Assignment Logic**:
- Damien: Treatment plans, clinical procedures, bite blocks, CDCP copay
- Caroline: CDCP estimates, insurance, scheduling
- Michael: Denture setup, fabrication
- Luisa: Scan imports, digital design, processing

### Data Flow Architecture

1. **Voice Input → AI Processing**: 
   - Voice dictation captured via Web Speech API
   - Sent to AI for formatting and analysis
   - Returns formatted clinical note + suggested tasks + follow-up prompts

2. **Patient Canvas Workflow**:
   - Left panel: Voice/text input, photo uploads, shade tracking
   - Right panel: Generated documents, treatment timeline, clinical photos
   - Real-time updates via React Query cache invalidation

3. **Task Management Flow**:
   - AI auto-generates tasks during clinical note processing
   - Tasks filtered by staff member
   - Status updates trigger cache refresh

### Session Management

**Strategy**: PostgreSQL-backed sessions using connect-pg-simple
- Session storage in database for persistence
- Cookie-based session identification

### Build and Deployment

**Development**:
- Vite dev server with HMR
- Express server running on tsx for TypeScript execution
- Replit-specific plugins for error overlays and dev banners

**Production Build**:
- Vite builds client to `dist/public`
- esbuild bundles server to `dist/index.js`
- ESM module format throughout

**Type Safety**:
- Shared schema types between client and server via `@shared` alias
- Zod schemas for runtime validation
- TypeScript strict mode enabled

## External Dependencies

### Database
- **PostgreSQL**: Primary data store
- **Neon Serverless**: PostgreSQL connection via @neondatabase/serverless with WebSocket support
- **Drizzle ORM**: Type-safe database queries and migrations

### Object Storage
- **Replit Object Storage**: Patient photo storage using @google-cloud/storage
- **Uppy**: File upload UI (@uppy/core, @uppy/dashboard, @uppy/aws-s3, @uppy/react)
- Secure signed URL generation for upload/download
- ACL-based access control for private patient photos

### AI Services
- **OpenAI API**: Clinical note processing, document generation, task assignment (accessed via Replit AI Integrations)

### UI Libraries
- **Radix UI**: Complete suite of accessible component primitives (accordion, dialog, dropdown, select, tabs, toast, etc.)
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across full stack
- **Drizzle Kit**: Database migration management
- **Replit Plugins**: Runtime error modal, cartographer, dev banner

### Utility Libraries
- **date-fns**: Date formatting and manipulation
- **clsx + tailwind-merge**: Conditional className composition
- **zod**: Schema validation
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component

### Browser APIs
- **Web Speech API**: Voice-to-text dictation (SpeechRecognition)
- **FileReader API**: Clinical photo uploads and previews