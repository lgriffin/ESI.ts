declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CharacterId = Brand<number, 'CharacterId'>;
export type CorporationId = Brand<number, 'CorporationId'>;
export type AllianceId = Brand<number, 'AllianceId'>;
export type TypeId = Brand<number, 'TypeId'>;
export type RegionId = Brand<number, 'RegionId'>;
export type SystemId = Brand<number, 'SystemId'>;
export type StationId = Brand<number, 'StationId'>;
export type StructureId = Brand<number, 'StructureId'>;
export type OrderId = Brand<number, 'OrderId'>;
export type ContractId = Brand<number, 'ContractId'>;
export type KillmailId = Brand<number, 'KillmailId'>;
export type FactionId = Brand<number, 'FactionId'>;
export type CorporationAllianceId = Brand<number, 'CorporationAllianceId'>;
export type FleetId = Brand<number, 'FleetId'>;
export type PlanetId = Brand<number, 'PlanetId'>;
export type WarId = Brand<number, 'WarId'>;

export function brand<T>(value: number): T {
  return value as unknown as T;
}
