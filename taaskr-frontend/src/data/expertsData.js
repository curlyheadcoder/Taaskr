// Taaskr Service Providers & Verified Technicians Catalog

export const CATEGORY_EXPERTS = [];

export const getExpertsByCategory = (categoryId) => {
  if (!categoryId) return CATEGORY_EXPERTS;
  const filtered = CATEGORY_EXPERTS.filter(
    e => e.categoryId === categoryId ||
    String(e.categoryId).toLowerCase().includes(String(categoryId).toLowerCase()) ||
    String(e.categoryName).toLowerCase().includes(String(categoryId).toLowerCase())
  );
  return filtered;
};
