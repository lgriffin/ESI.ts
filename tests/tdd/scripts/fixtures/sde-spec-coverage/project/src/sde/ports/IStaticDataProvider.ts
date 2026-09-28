export interface IStaticDataProvider {
  // --- Types ---
  getType(typeId: number): unknown;
  getGroup(groupId: number): unknown;
  getCategory(categoryId: number): unknown;
  getAllCategories(): unknown[];

  // --- Lifecycle ---
  getVersion(): unknown;
  close(): void;
}
