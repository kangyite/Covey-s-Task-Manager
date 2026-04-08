const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Creates a Google Calendar event on the user's primary calendar.
 * Returns the created event's ID.
 */
export async function createCalendarEvent(
  accessToken: string,
  title: string,
  deadline: string
): Promise<string> {
  const date = deadline.split('T')[0]; // YYYY-MM-DD

  const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: title,
      start: { date },
      end: { date },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar createEvent failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.id as string;
}

/**
 * Updates an existing Google Calendar event's title and date.
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  title: string,
  deadline: string
): Promise<void> {
  const date = deadline.split('T')[0]; // YYYY-MM-DD

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        start: { date },
        end: { date },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar updateEvent failed: ${response.status} ${error}`);
  }
}

/**
 * Deletes a Google Calendar event from the user's primary calendar.
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // 404 means already deleted — treat as success
  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Google Calendar deleteEvent failed: ${response.status} ${error}`);
  }
}
