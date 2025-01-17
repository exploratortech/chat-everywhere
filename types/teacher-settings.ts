export interface TeacherSettings {
  allow_student_use_line?: boolean;
  hidden_chateverywhere_default_character_prompt?: boolean;
}
export interface TeacherSettingsInPortal extends TeacherSettings {
  should_clear_conversations_on_logout?: boolean;
  items_per_page?: number;
  sort_key?: string;
  sort_order?: string;
}
