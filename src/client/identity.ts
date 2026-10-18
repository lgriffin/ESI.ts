// The identity helpers live in src/core so the custom clients' root entry
// shares them (EsiClient.as, CustomEsiClient.as); ./client re-exports them.
export {
  identityFromToken,
  identityFromProvider,
  type ProviderIdentityOptions,
} from '../core/identity';
