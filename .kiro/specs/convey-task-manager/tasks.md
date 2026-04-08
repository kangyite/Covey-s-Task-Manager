# Implementation Plan: Convey Task Manager

## Overview

Incremental implementation of the Covey Task Manager — a Next.js 14 App Router application with Supabase auth/database, a 2×2 drag-and-drop matrix, automatic urgency escalation, completed task history, and optional Google Calendar sync.

## Tasks

- [x] 1. Project setup and core types
  - Scaffold Next.js 14 app with App Router, Tailwind CSS, and install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`, `fast-check`, `vitest`, `@testing-library/react`
  - Create `lib/types.ts` with `Quadrant`, `Task`, `CompletedTask`, and `UserProfile` TypeScript interfaces
  - Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client using cookies)
  - Create `supabase/migrations/001_initial_schema.sql` with the full schema: `profiles`, `tasks`, `completed_tasks` tables, `quadrant_enum` type, RLS policies, and `urgency_requires_deadline` constraint
  - _Requirements: 1.1, 2.1, 8.1, 8.4_

- [x] 2. Authentication
  - [x] 2.1 Implement Google OAuth sign-in page and callback
    - Create `app/page.tsx` as the landing/sign-in page with a "Sign in with Google" button that calls `supabase.auth.signInWithOAuth`
    - Create `app/auth/callback/route.ts` to exchange the OAuth code for a session via `supabase.auth.exchangeCodeForSession`
    - Create `middleware.ts` to protect all routes under `/matrix`, `/history`, and `/settings`; redirect unauthenticated users to `/`; redirect authenticated users away from `/`
    - Handle OAuth error param in the callback URL and display it on the sign-in page
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 2.2 Write property test for protected route rejection (Property 1)
    - **Property 1: Protected routes reject unauthenticated requests**
    - **Validates: Requirements 1.6, 8.2**

- [x] 3. Database schema and escalation logic
  - [x] 3.1 Implement escalation utility functions
    - Create `lib/escalation.ts` with `computeEscalationTime(deadline: string, thresholdDays: number): Date` and `isEligibleForEscalation(task: Task, now: Date): boolean`
    - Implement `applyEscalation(tasks: Task[]): Task[]` that returns updated task objects with quadrant transitions applied
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.8_

  - [ ]* 3.2 Write property test for escalation time computation (Property 9)
    - **Property 9: Escalation time computation**
    - **Validates: Requirements 9.1**

  - [ ]* 3.3 Write property test for escalation quadrant transitions (Property 10)
    - **Property 10: Escalation transitions Q2→Q1 and Q4→Q3**
    - **Validates: Requirements 9.2, 9.3, 9.8**

  - [ ]* 3.4 Write property test for already-urgent tasks unaffected (Property 11)
    - **Property 11: Already-urgent tasks are not affected by escalation**
    - **Validates: Requirements 9.4**

- [x] 4. Task validation
  - [x] 4.1 Implement shared validation functions
    - Create `lib/validation.ts` with `validateTaskInput(input: unknown): ValidationResult` enforcing: title 1–255 chars, description ≤ 2000 chars, valid quadrant, urgency_threshold_days ≥ 1 requires deadline
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 4.3_

  - [ ]* 4.2 Write property test for title validation (Property 2)
    - **Property 2: Task title validation**
    - **Validates: Requirements 2.2, 2.8**

  - [ ]* 4.3 Write property test for urgency threshold requires deadline (Property 3)
    - **Property 3: Urgency threshold requires deadline**
    - **Validates: Requirements 2.6, 4.3**

- [x] 5. Task API routes
  - [x] 5.1 Implement `GET /api/tasks` and `POST /api/tasks`
    - Create `app/api/tasks/route.ts`; GET fetches all active tasks for the authenticated user; POST validates input with `validateTaskInput`, inserts into Supabase, returns 201 with the created task; return 401 for unauthenticated requests
    - _Requirements: 2.1, 2.9, 8.2_

  - [ ]* 5.2 Write property test for task creation round-trip (Property 4)
    - **Property 4: Task creation round-trip**
    - **Validates: Requirements 2.1, 2.9**

  - [x] 5.3 Implement `PATCH /api/tasks/[id]` and `DELETE /api/tasks/[id]`
    - Create `app/api/tasks/[id]/route.ts`; PATCH validates partial input and updates the task; when deadline is cleared, also clear urgency_threshold_days and reset escalation fields; DELETE removes the record; both return 401 for unauthenticated requests
    - _Requirements: 4.2, 4.4, 4.5, 5.1, 5.2, 8.2_

  - [ ]* 5.4 Write property test for task update round-trip (Property 5)
    - **Property 5: Task update round-trip**
    - **Validates: Requirements 4.2, 5.1, 5.2**

  - [ ]* 5.5 Write property test for task deletion (Property 6)
    - **Property 6: Task deletion removes the record**
    - **Validates: Requirements 4.5**

  - [x] 5.6 Implement `POST /api/tasks/[id]/complete`
    - Create `app/api/tasks/[id]/complete/route.ts`; insert a `completed_tasks` record with title, original_quadrant, deadline, and completion_timestamp; delete the active task record; return 200 with the completed task
    - _Requirements: 10.1, 10.2_

  - [ ]* 5.7 Write property test for task completion round-trip (Property 14)
    - **Property 14: Task completion round-trip**
    - **Validates: Requirements 10.1, 10.2**

- [x] 6. Escalation API route
  - [x] 6.1 Implement `POST /api/escalation`
    - Create `app/api/escalation/route.ts`; fetch eligible tasks for the user (or the provided task_ids subset); apply escalation logic from `lib/escalation.ts`; batch-update quadrant, escalated, and pre_escalation_quadrant in Supabase; return list of escalated task IDs
    - _Requirements: 9.2, 9.3, 9.5, 9.8_

  - [ ]* 6.2 Write property test for manual reassignment prevents re-escalation (Property 12)
    - **Property 12: Manual reassignment prevents re-escalation**
    - **Validates: Requirements 9.6**

  - [ ]* 6.3 Write property test for deadline update cancels escalation (Property 13)
    - **Property 13: Updating deadline to future cancels escalation**
    - **Validates: Requirements 9.7**

- [x] 7. Completed tasks and settings API routes
  - [x] 7.1 Implement `GET /api/completed-tasks` and `DELETE /api/completed-tasks/[id]`
    - Create `app/api/completed-tasks/route.ts` (GET) and `app/api/completed-tasks/[id]/route.ts` (DELETE); enforce auth; return 401 for unauthenticated requests
    - _Requirements: 10.3, 10.5, 8.2_

  - [ ]* 7.2 Write property test for completed task deletion (Property 16)
    - **Property 16: Completed task deletion removes the record**
    - **Validates: Requirements 10.5**

  - [x] 7.3 Implement `GET /api/settings` and `PATCH /api/settings`
    - Create `app/api/settings/route.ts`; GET returns the user's profile; PATCH updates `calendar_enabled`; upsert profile row on first access
    - _Requirements: 6.2_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Matrix UI — core components
  - [x] 9.1 Implement `MatrixBoard` and `QuadrantPanel` components
    - Create `components/MatrixBoard.tsx` as a client component wrapping all four `QuadrantPanel` instances in a `DndContext` from `@dnd-kit/core`
    - Create `components/QuadrantPanel.tsx` as a `useDroppable` drop target rendering its task list; label each panel per requirement 3.2
    - _Requirements: 3.1, 3.2, 5.1_

  - [x] 9.2 Implement `TaskCard` component
    - Create `components/TaskCard.tsx` as a `useDraggable` card displaying title and deadline; clicking opens the edit modal
    - _Requirements: 3.4, 5.1_

  - [ ]* 9.3 Write property test for matrix displays all user tasks (Property 8)
    - **Property 8: Matrix displays all user tasks**
    - **Validates: Requirements 3.3, 3.4**

- [x] 10. Task form modal and edit pre-population
  - [x] 10.1 Implement `TaskFormModal` component
    - Create `components/TaskFormModal.tsx` with controlled inputs for title, description, quadrant, deadline, and urgency_threshold_days; run client-side validation from `lib/validation.ts` before submission; show inline errors; disable submit while in-flight
    - When opened for an existing task, pre-populate all fields with current task values
    - _Requirements: 2.2–2.9, 4.1, 4.3_

  - [ ]* 10.2 Write property test for edit form pre-population (Property 7)
    - **Property 7: Edit form pre-populates with current values**
    - **Validates: Requirements 4.1**

- [x] 11. Matrix page with data fetching and escalation polling
  - Create `app/matrix/page.tsx` as a client component; fetch tasks from `/api/tasks` on mount; call `/api/escalation` on mount and every 60 seconds via `setInterval`; wire `MatrixBoard` with task state; handle optimistic updates for drag-and-drop, complete, and delete actions with rollback on error; show skeleton/spinner while loading
  - _Requirements: 3.3, 3.5, 4.6, 4.7, 5.3, 9.5, 9.8_

- [x] 12. History page
  - [x] 12.1 Implement `HistoryList` component
    - Create `components/HistoryList.tsx` rendering a paginated list of completed tasks; each row shows title, original quadrant label, completion_timestamp, and deadline (when set); include a delete button per row
    - _Requirements: 10.3, 10.4_

  - [ ]* 12.2 Write property test for completed task display fields (Property 15)
    - **Property 15: Completed task display contains required fields**
    - **Validates: Requirements 10.4**

  - [x] 12.3 Create `app/history/page.tsx`
    - Fetch completed tasks from `/api/completed-tasks`; render `HistoryList`; handle delete with optimistic removal and error rollback; show loading indicator while fetching
    - _Requirements: 10.3, 10.5, 10.6, 10.7_

- [x] 13. Settings page and Google Calendar integration
  - [x] 13.1 Implement `SettingsForm` component and settings page
    - Create `components/SettingsForm.tsx` with a toggle for Calendar Integration; when enabling, call `supabase.auth.signInWithOAuth` with the `calendar.events` scope; when disabling, call `PATCH /api/settings` with `{ calendar_enabled: false }`
    - Create `app/settings/page.tsx` that fetches current settings and renders `SettingsForm`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 13.2 Implement Google Calendar sync in task API routes
    - Create `lib/calendar.ts` with `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent` functions wrapping the Google Calendar API
    - Update `POST /api/tasks`, `PATCH /api/tasks/[id]`, `DELETE /api/tasks/[id]`, and `POST /api/tasks/[id]/complete` to call the appropriate calendar functions when `calendar_enabled` is true; catch Calendar API errors, show toast, and proceed with the Supabase operation regardless
    - _Requirements: 6.5, 6.6, 6.7, 6.9_

  - [x] 13.3 Implement calendar cleanup on disable
    - In `PATCH /api/settings`, when `calendar_enabled` transitions from true to false, delete all Calendar_Events for the user's tasks and clear `calendar_event_id` on those task records
    - _Requirements: 6.8_

  - [ ]* 13.4 Write property test for calendar disabled means no API calls (Property 18)
    - **Property 18: Calendar disabled means no calendar API calls**
    - **Validates: Requirements 6.3**

  - [ ]* 13.5 Write property test for calendar failure does not lose task data (Property 19)
    - **Property 19: Calendar API failure does not lose task data**
    - **Validates: Requirements 6.9**

- [ ] 14. RLS and data isolation
  - [ ]* 14.1 Write property test for RLS user data isolation (Property 17)
    - **Property 17: RLS isolates user data**
    - **Validates: Requirements 8.1**

- [x] 15. Responsive layout
  - Apply Tailwind CSS responsive classes to `MatrixBoard` and `QuadrantPanel`: 2×2 grid at `md:` and above, single-column stacked layout below `md:`; ensure all interactive elements meet 44×44px touch target minimum
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16. Navigation and sign-out
  - Create a shared `components/Nav.tsx` with links to Matrix, History, and Settings, and a sign-out button that calls `supabase.auth.signOut` and redirects to `/`
  - _Requirements: 1.5, 10.3_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations each, tagged with `// Feature: convey-task-manager, Property N: <property_text>`
- Supabase-dependent property tests (P4, P5, P6, P14, P16, P17) should mock the Supabase client; Calendar-dependent tests (P18, P19) should mock `lib/calendar.ts`
- Checkpoints ensure incremental validation before moving to the next phase
