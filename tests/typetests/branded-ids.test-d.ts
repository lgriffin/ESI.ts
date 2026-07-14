import { expectType, expectAssignable, expectNotAssignable } from 'tsd';
import {
  CharacterId,
  CorporationId,
  AllianceId,
  TypeId,
  RegionId,
  SystemId,
  OrderId,
  brand,
} from '../../src';

// Branded IDs are assignable to number (backwards compat)
declare const charId: CharacterId;
expectAssignable<number>(charId);

declare const corpId: CorporationId;
expectAssignable<number>(corpId);

declare const allianceId: AllianceId;
expectAssignable<number>(allianceId);

// Plain number is NOT assignable to a branded ID
expectNotAssignable<CharacterId>(42 as number);
expectNotAssignable<CorporationId>(42 as number);
expectNotAssignable<AllianceId>(42 as number);
expectNotAssignable<TypeId>(42 as number);
expectNotAssignable<RegionId>(42 as number);
expectNotAssignable<SystemId>(42 as number);
expectNotAssignable<OrderId>(42 as number);

// Cross-contamination is prevented
expectNotAssignable<CorporationId>(charId);
expectNotAssignable<CharacterId>(corpId);
expectNotAssignable<AllianceId>(charId);
expectNotAssignable<TypeId>(charId);
expectNotAssignable<RegionId>(charId);

// brand() helper creates branded values
const branded = brand<CharacterId>(12345);
expectType<CharacterId>(branded);
