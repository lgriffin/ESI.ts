export interface CalendarEvent {
  event_id: number;
  event_date: string;
  title: string;
  importance: number;
  event_response: 'declined' | 'not_responded' | 'accepted' | 'tentative';
}

export interface CalendarEventDetail {
  event_id: number;
  date: string;
  title: string;
  text: string;
  owner_id: number;
  owner_name: string;
  owner_type:
    | 'eve_server'
    | 'corporation'
    | 'faction'
    | 'character'
    | 'alliance';
  duration: number;
  importance: number;
  response: string;
}

export interface CalendarEventAttendee {
  character_id: number;
  event_response: 'declined' | 'not_responded' | 'accepted' | 'tentative';
}
