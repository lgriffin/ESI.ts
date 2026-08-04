 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdWalletJournalGetSchema = z.looseObject({
  amount: z.number().optional(),
  balance: z.number().optional(),
  context_id: z.number().optional(),
  context_id_type: z.enum(['structure_id', 'station_id', 'market_transaction_id', 'character_id', 'corporation_id', 'alliance_id', 'eve_system', 'industry_job_id', 'contract_id', 'planet_id', 'system_id', 'type_id']).optional(),
  date: z.string(),
  description: z.string(),
  first_party_id: z.number().optional(),
  id: z.number(),
  reason: z.string().optional(),
  ref_type: z.enum(['acceleration_gate_fee', 'achievement_category_milestone_reward', 'achievement_milestone_reward', 'advertisement_listing_fee', 'agent_donation', 'agent_location_services', 'agent_miscellaneous', 'agent_mission_collateral_paid', 'agent_mission_collateral_refunded', 'agent_mission_reward', 'agent_mission_reward_corporation_tax', 'agent_mission_security_tax', 'agent_mission_time_bonus_reward', 'agent_mission_time_bonus_reward_corporation_tax', 'agent_security_services', 'agent_services_rendered', 'agents_preward', 'air_career_program_reward', 'alliance_maintainance_fee', 'alliance_registration_fee', 'allignment_based_gate_toll', 'asset_safety_recovery_tax', 'bounty', 'bounty_prize', 'bounty_prize_corporation_tax', 'bounty_prizes', 'bounty_reimbursement', 'bounty_surcharge', 'brokers_fee', 'campaign_objective_isk_reward', 'clone_activation', 'clone_transfer', 'contraband_fine', 'contract_auction_bid', 'contract_auction_bid_corp', 'contract_auction_bid_refund', 'contract_auction_sold', 'contract_brokers_fee', 'contract_brokers_fee_corp', 'contract_collateral', 'contract_collateral_deposited_corp', 'contract_collateral_payout', 'contract_collateral_refund', 'contract_deposit', 'contract_deposit_corp', 'contract_deposit_refund', 'contract_deposit_sales_tax', 'contract_price', 'contract_price_payment_corp', 'contract_reversal', 'contract_reward', 'contract_reward_deposited', 'contract_reward_deposited_corp', 'contract_reward_refund', 'contract_sales_tax', 'copying', 'corporate_reward_payout', 'corporate_reward_tax', 'corporation_account_withdrawal', 'corporation_bulk_payment', 'corporation_dividend_payment', 'corporation_liquidation', 'corporation_logo_change_cost', 'corporation_payment', 'corporation_registration_fee', 'cosmetic_market_component_item_purchase', 'cosmetic_market_skin_purchase', 'cosmetic_market_skin_sale', 'cosmetic_market_skin_sale_broker_fee', 'cosmetic_market_skin_sale_tax', 'cosmetic_market_skin_transaction', 'courier_mission_escrow', 'cspa', 'cspaofflinerefund', 'daily_challenge_reward', 'daily_goal_payouts', 'daily_goal_payouts_tax', 'datacore_fee', 'dna_modification_fee', 'docking_fee', 'duel_wager_escrow', 'duel_wager_payment', 'duel_wager_refund', 'ess_escrow_transfer', 'external_trade_delivery', 'external_trade_freeze', 'external_trade_thaw', 'factory_slot_rental_fee', 'flux_payout', 'flux_tax', 'flux_ticket_repayment', 'flux_ticket_sale', 'freelance_jobs_broadcasting_fee', 'freelance_jobs_duration_fee', 'freelance_jobs_escrow_refund', 'freelance_jobs_reward', 'freelance_jobs_reward_corporation_tax', 'freelance_jobs_reward_escrow', 'gm_cash_transfer', 'gm_plex_fee_refund', 'industry_job_tax', 'industry_security_tax', 'infrastructure_hub_maintenance', 'inheritance', 'insurance', 'insurgency_corruption_contribution_reward', 'insurgency_suppression_contribution_reward', 'item_trader_payment', 'jump_clone_activation_fee', 'jump_clone_installation_fee', 'kill_right_fee', 'lp_store', 'manufacturing', 'market_escrow', 'market_fine_paid', 'market_provider_tax', 'market_security_tax', 'market_transaction', 'medal_creation', 'medal_issued', 'milestone_reward_payment', 'mission_completion', 'mission_cost', 'mission_expiration', 'mission_reward', 'npc_bounty_security_tax', 'office_rental_fee', 'operation_bonus', 'opportunity_reward', 'planetary_construction', 'planetary_export_tax', 'planetary_import_tax', 'player_donation', 'player_trading', 'project_discovery_reward', 'project_discovery_tax', 'project_payouts', 'reaction', 'redeemed_isk_token', 'release_of_impounded_property', 'repair_bill', 'reprocessing_tax', 'researching_material_productivity', 'researching_technology', 'researching_time_productivity', 'resource_wars_reward', 'reverse_engineering', 'season_challenge_reward', 'security_processing_fee', 'shares', 'skill_purchase', 'skyhook_claim_fee', 'sovereignity_bill', 'store_purchase', 'store_purchase_refund', 'structure_gate_jump', 'transaction_tax', 'under_construction', 'upkeep_adjustment_fee', 'war_ally_contract', 'war_fee', 'war_fee_surrender']),
  second_party_id: z.number().optional(),
  tax: z.number().optional(),
  tax_receiver_id: z.number().optional(),
});

export const CharactersCharacterIdWalletTransactionsGetSchema = z.looseObject({
  client_id: z.number(),
  date: z.string(),
  is_buy: z.boolean(),
  is_personal: z.boolean(),
  journal_ref_id: z.number(),
  location_id: z.number(),
  quantity: z.number(),
  transaction_id: z.number(),
  type_id: z.number(),
  unit_price: z.number(),
});

export const CorporationsCorporationIdWalletsDivisionJournalGetSchema = z.looseObject({
  amount: z.number().optional(),
  balance: z.number().optional(),
  context_id: z.number().optional(),
  context_id_type: z.enum(['structure_id', 'station_id', 'market_transaction_id', 'character_id', 'corporation_id', 'alliance_id', 'eve_system', 'industry_job_id', 'contract_id', 'planet_id', 'system_id', 'type_id']).optional(),
  date: z.string(),
  description: z.string(),
  first_party_id: z.number().optional(),
  id: z.number(),
  reason: z.string().optional(),
  ref_type: z.enum(['acceleration_gate_fee', 'achievement_category_milestone_reward', 'achievement_milestone_reward', 'advertisement_listing_fee', 'agent_donation', 'agent_location_services', 'agent_miscellaneous', 'agent_mission_collateral_paid', 'agent_mission_collateral_refunded', 'agent_mission_reward', 'agent_mission_reward_corporation_tax', 'agent_mission_security_tax', 'agent_mission_time_bonus_reward', 'agent_mission_time_bonus_reward_corporation_tax', 'agent_security_services', 'agent_services_rendered', 'agents_preward', 'air_career_program_reward', 'alliance_maintainance_fee', 'alliance_registration_fee', 'allignment_based_gate_toll', 'asset_safety_recovery_tax', 'bounty', 'bounty_prize', 'bounty_prize_corporation_tax', 'bounty_prizes', 'bounty_reimbursement', 'bounty_surcharge', 'brokers_fee', 'campaign_objective_isk_reward', 'clone_activation', 'clone_transfer', 'contraband_fine', 'contract_auction_bid', 'contract_auction_bid_corp', 'contract_auction_bid_refund', 'contract_auction_sold', 'contract_brokers_fee', 'contract_brokers_fee_corp', 'contract_collateral', 'contract_collateral_deposited_corp', 'contract_collateral_payout', 'contract_collateral_refund', 'contract_deposit', 'contract_deposit_corp', 'contract_deposit_refund', 'contract_deposit_sales_tax', 'contract_price', 'contract_price_payment_corp', 'contract_reversal', 'contract_reward', 'contract_reward_deposited', 'contract_reward_deposited_corp', 'contract_reward_refund', 'contract_sales_tax', 'copying', 'corporate_reward_payout', 'corporate_reward_tax', 'corporation_account_withdrawal', 'corporation_bulk_payment', 'corporation_dividend_payment', 'corporation_liquidation', 'corporation_logo_change_cost', 'corporation_payment', 'corporation_registration_fee', 'cosmetic_market_component_item_purchase', 'cosmetic_market_skin_purchase', 'cosmetic_market_skin_sale', 'cosmetic_market_skin_sale_broker_fee', 'cosmetic_market_skin_sale_tax', 'cosmetic_market_skin_transaction', 'courier_mission_escrow', 'cspa', 'cspaofflinerefund', 'daily_challenge_reward', 'daily_goal_payouts', 'daily_goal_payouts_tax', 'datacore_fee', 'dna_modification_fee', 'docking_fee', 'duel_wager_escrow', 'duel_wager_payment', 'duel_wager_refund', 'ess_escrow_transfer', 'external_trade_delivery', 'external_trade_freeze', 'external_trade_thaw', 'factory_slot_rental_fee', 'flux_payout', 'flux_tax', 'flux_ticket_repayment', 'flux_ticket_sale', 'freelance_jobs_broadcasting_fee', 'freelance_jobs_duration_fee', 'freelance_jobs_escrow_refund', 'freelance_jobs_reward', 'freelance_jobs_reward_corporation_tax', 'freelance_jobs_reward_escrow', 'gm_cash_transfer', 'gm_plex_fee_refund', 'industry_job_tax', 'industry_security_tax', 'infrastructure_hub_maintenance', 'inheritance', 'insurance', 'insurgency_corruption_contribution_reward', 'insurgency_suppression_contribution_reward', 'item_trader_payment', 'jump_clone_activation_fee', 'jump_clone_installation_fee', 'kill_right_fee', 'lp_store', 'manufacturing', 'market_escrow', 'market_fine_paid', 'market_provider_tax', 'market_security_tax', 'market_transaction', 'medal_creation', 'medal_issued', 'milestone_reward_payment', 'mission_completion', 'mission_cost', 'mission_expiration', 'mission_reward', 'npc_bounty_security_tax', 'office_rental_fee', 'operation_bonus', 'opportunity_reward', 'planetary_construction', 'planetary_export_tax', 'planetary_import_tax', 'player_donation', 'player_trading', 'project_discovery_reward', 'project_discovery_tax', 'project_payouts', 'reaction', 'redeemed_isk_token', 'release_of_impounded_property', 'repair_bill', 'reprocessing_tax', 'researching_material_productivity', 'researching_technology', 'researching_time_productivity', 'resource_wars_reward', 'reverse_engineering', 'season_challenge_reward', 'security_processing_fee', 'shares', 'skill_purchase', 'skyhook_claim_fee', 'sovereignity_bill', 'store_purchase', 'store_purchase_refund', 'structure_gate_jump', 'transaction_tax', 'under_construction', 'upkeep_adjustment_fee', 'war_ally_contract', 'war_fee', 'war_fee_surrender']),
  second_party_id: z.number().optional(),
  tax: z.number().optional(),
  tax_receiver_id: z.number().optional(),
});

export const CorporationsCorporationIdWalletsDivisionTransactionsGetSchema = z.looseObject({
  client_id: z.number(),
  date: z.string(),
  is_buy: z.boolean(),
  journal_ref_id: z.number(),
  location_id: z.number(),
  quantity: z.number(),
  transaction_id: z.number(),
  type_id: z.number(),
  unit_price: z.number(),
});

export const CorporationsCorporationIdWalletsGetSchema = z.looseObject({
  balance: z.number(),
  division: z.number(),
});
