// 商品列表的網址查詢參數：先驗證再使用，不合法的值一律忽略。
const POSITIVE_INT = /^[1-9]\d{0,8}$/;
export const KEYWORD_MAX_LENGTH = 50;

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

// 把 route.query 整理成 { page, categoryId, keyword }
export function parseListQuery(query = {}) {
  const page = first(query.page);
  const categoryId = first(query.categoryId);
  const keyword = String(first(query.keyword) ?? '').trim().slice(0, KEYWORD_MAX_LENGTH);

  return {
    page: POSITIVE_INT.test(page ?? '') ? Number(page) : 1,
    categoryId: POSITIVE_INT.test(categoryId ?? '') ? Number(categoryId) : null,
    keyword,
  };
}

// 反過來產生要放進網址的查詢參數；預設值不寫進網址
export function buildListQuery({ page = 1, categoryId = null, keyword = '' } = {}) {
  const query = {};
  if (categoryId) query.categoryId = String(categoryId);
  if (keyword) query.keyword = keyword;
  if (page > 1) query.page = String(page);
  return query;
}
