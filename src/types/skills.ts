export interface CharacterSkill {
  skill_id: number;
  skillpoints_in_skill: number;
  trained_skill_level: number;
  active_skill_level: number;
}

export interface SkillQueue {
  skill_id: number;
  finished_level: number;
  queue_position: number;
  level_end_sp?: number;
  level_start_sp?: number;
  training_start_sp?: number;
  start_date?: string;
  finish_date?: string;
}
