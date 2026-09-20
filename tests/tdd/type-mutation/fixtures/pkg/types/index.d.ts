/**
 * The smallest public surface with one pinned and one unpinned member. The
 * tsd test checks `id` and never mentions `label`, so making `id` optional
 * must be killed and making `label` optional must survive.
 */
export interface Widget {
  id: number;
  label: string;
}
