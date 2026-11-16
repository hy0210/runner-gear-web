import { http } from './http.js';

export async function fetchProducts(params = {}) {
  const { data } = await http.get('/products', { params });
  return data.data;
}

export async function fetchCategories() {
  const { data } = await http.get('/categories');
  return data.data.categories;
}
