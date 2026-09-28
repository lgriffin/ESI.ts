export interface IStaticDataProvider {
  // --- Types ---
  getType(typeId: number): unknown;
  getGroup(groupId: number): unknown;
  getAllCategories(): unknown[];

  // --- Lifecycle ---
  getVersion(): unknown;
  close(): void;
}
