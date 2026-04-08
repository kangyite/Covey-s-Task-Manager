# Requirements Document

## Introduction

A personal task management web application based on Stephen Covey's Time Management Matrix (4 Quadrants), named Convey Task Manager. Users authenticate via Google OAuth, manage tasks organized by importance and urgency, and optionally sync tasks with Google Calendar. The application is responsive and works across desktop, tablet, and mobile devices. Built with Next.js + Tailwind CSS, hosted on Vercel, with Supabase handling the database and authentication.

## Glossary

- **App**: The Convey Task Manager web application
- **User**: An authenticated individual using the App
- **Task**: A unit of work with a title, optional description, optional Deadline, optional Urgency_Threshold, and Quadrant assignment
- **Escalation**: The automatic transition of a Task from a non-urgent Quadrant (Q2 or Q4) to its urgent equivalent (Q1 or Q3) triggered when the current time reaches the Task's Escalation_Time
- **Escalation_Time**: The point in time computed as (Deadline minus Urgency_Threshold) at which Escalation occurs
- **Quadrant**: One of four categories defined by the intersection of importance and urgency: Q1 (Important + Urgent), Q2 (Important + Not Urgent), Q3 (Not Important + Urgent), Q4 (Not Important + Not Urgent)
- **Deadline**: An optional date and time by which a Task must be completed
- **Urgency_Threshold**: An optional duration in whole days before the Deadline at which the App automatically transitions a Task from a non-urgent Quadrant to its urgent equivalent
- **Matrix**: The 2×2 grid displaying all four Quadrants simultaneously
- **Google_Auth**: The Google OAuth 2.0 authentication provider integrated via Supabase
- **Supabase**: The backend-as-a-service platform providing the PostgreSQL database and authentication layer
- **Google_Calendar**: The Google Calendar API used to sync Tasks as calendar events
- **Calendar_Event**: A Google Calendar event created or linked from a Task
- **Session**: An authenticated user session managed by Supabase Auth
- **Calendar_Integration**: The optional Google Calendar sync feature that a User may enable or disable from the Settings page
- **Settings**: A dedicated page within the App where a User can configure application-level preferences, including Calendar_Integration
- **Completed_Task**: A Task that has been marked as complete by the User, removed from the Matrix, and stored with a Completion_Timestamp
- **Completion_Timestamp**: The date and time at which a Task was marked as complete
- **History_Page**: A dedicated page within the App that displays all Completed_Tasks for the authenticated User

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a User, I want to sign in with my Google account, so that my tasks are securely stored and accessible across devices.

#### Acceptance Criteria

1. THE App SHALL provide a Google OAuth sign-in option on the landing page via Supabase Auth
2. WHEN a User completes Google OAuth consent, THE App SHALL create or retrieve the User's account in Supabase and establish a Session
3. WHEN a User's Session expires, THE App SHALL redirect the User to the sign-in page
4. IF Google_Auth returns an error during sign-in, THEN THE App SHALL display a descriptive error message to the User
5. WHEN a User signs out, THE App SHALL invalidate the Session and redirect the User to the landing page
6. WHILE a User is not authenticated, THE App SHALL restrict access to all task management pages

---

### Requirement 2: Task Creation

**User Story:** As a User, I want to create tasks and assign them to a quadrant, so that I can organize my work by importance and urgency.

#### Acceptance Criteria

1. WHEN a User submits a new task form, THE App SHALL create a Task record in Supabase associated with the authenticated User
2. THE App SHALL require a non-empty title (1–255 characters) for every Task
3. THE App SHALL accept an optional description (up to 2000 characters) for a Task
4. THE App SHALL accept an optional Deadline (date and time) for a Task
5. THE App SHALL accept an optional Urgency_Threshold (whole number of days, minimum 1) for a Task
6. IF a User provides an Urgency_Threshold without a Deadline, THEN THE App SHALL display a validation error and SHALL NOT create the Task
7. THE App SHALL require a Quadrant assignment (Q1, Q2, Q3, or Q4) for every Task
8. IF a User submits a task form with a missing or empty title, THEN THE App SHALL display a validation error and SHALL NOT create the Task
9. WHEN a Task is successfully created, THE App SHALL display the Task in the assigned Quadrant without requiring a full page reload

---

### Requirement 3: Task Display — The Matrix

**User Story:** As a User, I want to see all my tasks organized in the 4-quadrant matrix, so that I can quickly understand my priorities at a glance.

#### Acceptance Criteria

1. THE App SHALL display the Matrix as a 2×2 grid with one panel per Quadrant
2. THE App SHALL label each Quadrant panel with its name and importance/urgency descriptor: Q1 "Do First" (Important + Urgent), Q2 "Schedule" (Important + Not Urgent), Q3 "Delegate" (Not Important + Urgent), Q4 "Eliminate" (Not Important + Not Urgent)
3. WHEN the Matrix page loads, THE App SHALL fetch and display all Tasks belonging to the authenticated User
4. THE App SHALL display each Task's title and, where present, its Deadline within the corresponding Quadrant panel
5. WHILE a Task list is loading, THE App SHALL display a loading indicator in place of the Task list

---

### Requirement 4: Task Editing and Deletion

**User Story:** As a User, I want to edit and delete tasks, so that I can keep my task list accurate and up to date.

#### Acceptance Criteria

1. WHEN a User selects a Task to edit, THE App SHALL display the Task's current values in an editable form, including Deadline and Urgency_Threshold where set
2. WHEN a User submits an edited task form, THE App SHALL update the Task record in Supabase with the new values
3. THE App SHALL enforce the same validation rules for editing as for creation (non-empty title, valid Quadrant, Urgency_Threshold requires a Deadline)
4. WHEN a User clears the Deadline from a Task that has an Urgency_Threshold, THE App SHALL also clear the Urgency_Threshold and cancel any pending Escalation for that Task
5. WHEN a User confirms deletion of a Task, THE App SHALL permanently remove the Task record from Supabase
6. WHEN a Task is successfully updated or deleted, THE App SHALL reflect the change in the Matrix without requiring a full page reload
7. IF a Task update or deletion fails due to a server error, THEN THE App SHALL display a descriptive error message and SHALL retain the Task's previous state in the UI

---

### Requirement 5: Task Reassignment Between Quadrants

**User Story:** As a User, I want to move tasks between quadrants, so that I can reprioritize as my situation changes.

#### Acceptance Criteria

1. WHEN a User drags a Task card and drops it onto a different Quadrant panel, THE App SHALL update the Task's Quadrant assignment in Supabase
2. WHEN a User selects a different Quadrant from the edit form, THE App SHALL update the Task's Quadrant assignment in Supabase upon form submission
3. IF a drag-and-drop reassignment fails, THEN THE App SHALL revert the Task card to its original Quadrant and display an error message

---

### Requirement 6: Google Calendar Integration

**User Story:** As a User, I want to optionally sync tasks with Google Calendar, so that I can see my important tasks alongside my other calendar events without being required to connect a calendar account.

#### Acceptance Criteria

1. THE App SHALL NOT require Calendar_Integration during sign-in or task creation
2. THE App SHALL provide a toggle on the Settings page that allows a User to enable or disable Calendar_Integration at any time
3. WHILE Calendar_Integration is disabled, THE App SHALL NOT request Google Calendar OAuth scopes and SHALL NOT create, update, or delete Calendar_Events
4. WHEN a User enables Calendar_Integration from the Settings page, THE App SHALL request the `https://www.googleapis.com/auth/calendar.events` OAuth scope and store the resulting token via Supabase Auth
5. WHERE Calendar_Integration is enabled, WHEN a User creates a Task with a Deadline, THE App SHALL create a Calendar_Event in the User's primary Google Calendar with the Task title and Deadline
6. WHERE Calendar_Integration is enabled, WHEN a User updates a Task that has an associated Calendar_Event, THE App SHALL update the corresponding Calendar_Event title and date in Google Calendar
7. WHERE Calendar_Integration is enabled, WHEN a User deletes a Task that has an associated Calendar_Event, THE App SHALL delete the corresponding Calendar_Event from Google Calendar
8. WHEN a User disables Calendar_Integration from the Settings page, THE App SHALL delete all Calendar_Events associated with the User's Tasks and remove all Calendar_Event references from those Task records
9. IF the Google Calendar API returns an error during any sync operation, THEN THE App SHALL display a descriptive error message and SHALL retain the Task in Supabase regardless of the Calendar sync failure

---

### Requirement 7: Responsive Layout

**User Story:** As a User, I want the application to work well on desktop, tablet, and mobile, so that I can manage my tasks from any device.

#### Acceptance Criteria

1. THE App SHALL render the Matrix as a 2×2 grid on viewports 1024px wide and above
2. THE App SHALL render the Matrix as a 2×2 grid on viewports between 768px and 1023px wide
3. THE App SHALL render each Quadrant panel as a full-width stacked column on viewports below 768px wide
4. THE App SHALL use touch-friendly tap targets of at least 44×44 CSS pixels for all interactive elements
5. WHILE a User is on a touch-capable device, THE App SHALL support touch-based drag-and-drop for Task reassignment

---

### Requirement 8: Data Ownership and Security

**User Story:** As a User, I want my tasks to be private and secure, so that other users cannot access my data.

#### Acceptance Criteria

1. THE App SHALL enforce Row Level Security (RLS) policies in Supabase so that a User can only read, create, update, and delete Tasks belonging to their own account
2. WHEN an unauthenticated request is made to any task data API route, THE App SHALL return a 401 Unauthorized response
3. THE App SHALL store Google OAuth tokens in Supabase Auth and SHALL NOT expose them to the client beyond what is required for API calls
4. THE App SHALL transmit all data between the client and Supabase over HTTPS

---

### Requirement 9: Automatic Urgency Escalation

**User Story:** As a User, I want tasks to automatically become urgent as their deadline approaches, so that I don't have to manually reprioritize time-sensitive work.

#### Acceptance Criteria

1. WHEN a Task has both a Deadline and an Urgency_Threshold, THE App SHALL compute the Task's Escalation_Time as the Deadline minus the Urgency_Threshold in days
2. WHEN the current time reaches or passes a Task's Escalation_Time and the Task is in Q2, THE App SHALL transition the Task's Quadrant assignment to Q1
3. WHEN the current time reaches or passes a Task's Escalation_Time and the Task is in Q4, THE App SHALL transition the Task's Quadrant assignment to Q3
4. WHILE a Task is in Q1 or Q3, THE App SHALL NOT modify the Task's Quadrant assignment due to Escalation, regardless of whether a Deadline or Urgency_Threshold is set
5. WHEN an Escalation occurs, THE App SHALL update the Task's Quadrant in Supabase and reflect the change in the Matrix without requiring a full page reload
6. WHEN a User manually reassigns an escalated Task back to Q2 or Q4, THE App SHALL respect the manual assignment and SHALL NOT re-escalate the Task until the Urgency_Threshold condition is re-evaluated against the current time
7. IF a Task's Deadline or Urgency_Threshold is updated such that the Escalation_Time is now in the future, THEN THE App SHALL cancel any prior Escalation and restore the Task to its pre-escalation Quadrant (Q2 if Important, Q4 if Not Important), provided the User has not manually reassigned the Task since the Escalation occurred
8. WHEN a Task with a past Escalation_Time is loaded on the Matrix page, THE App SHALL immediately apply Escalation if the Task has not already been escalated

---

### Requirement 10: Completed Tasks History

**User Story:** As a User, I want to mark tasks as complete and view a history of completed tasks, so that I can track what I have accomplished over time.

#### Acceptance Criteria

1. WHEN a User marks a Task as complete from the Matrix view, THE App SHALL record a Completion_Timestamp, transition the Task to a Completed_Task, and remove it from the Matrix without requiring a full page reload
2. WHEN a Task is marked as complete, THE App SHALL store the Completed_Task in Supabase with its title, original Quadrant, Deadline (if any), and Completion_Timestamp
3. THE App SHALL provide a History_Page accessible from the main navigation that displays all Completed_Tasks belonging to the authenticated User
4. THE App SHALL display each Completed_Task on the History_Page with its title, original Quadrant, Deadline (if set), and Completion_Timestamp
5. WHEN a User permanently deletes a Completed_Task from the History_Page, THE App SHALL remove the Completed_Task record from Supabase and remove it from the History_Page without requiring a full page reload
6. IF a Completed_Task deletion fails due to a server error, THEN THE App SHALL display a descriptive error message and SHALL retain the Completed_Task in the History_Page
7. WHILE the History_Page is loading Completed_Tasks, THE App SHALL display a loading indicator in place of the task list
8. WHERE Calendar_Integration is enabled and a Completed_Task has an associated Calendar_Event, WHEN the Task is marked as complete, THE App SHALL delete the corresponding Calendar_Event from Google Calendar
