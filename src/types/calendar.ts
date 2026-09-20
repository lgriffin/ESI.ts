import { z } from 'zod';
import {
  CalendarEventSchema,
  CalendarEventDetailSchema,
  CalendarEventAttendeeSchema,
} from '../schemas/calendar';

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarEventDetail = z.infer<typeof CalendarEventDetailSchema>;
export type CalendarEventAttendee = z.infer<typeof CalendarEventAttendeeSchema>;
