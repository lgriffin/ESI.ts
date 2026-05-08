export interface MailMessage {
  mail_id: number;
  subject?: string;
  from?: number;
  timestamp: string;
  labels?: number[];
  is_read?: boolean;
  recipients: Array<{
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  }>;
}

export interface MailLabel {
  label_id: number;
  name: string;
  color?: string;
  unread_count?: number;
}
