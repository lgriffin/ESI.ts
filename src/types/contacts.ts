import { z } from 'zod';
import { ContactSchema, ContactLabelSchema } from '../schemas/contacts';

export type Contact = z.infer<typeof ContactSchema>;
export type ContactLabel = z.infer<typeof ContactLabelSchema>;
