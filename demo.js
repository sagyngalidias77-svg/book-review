import axios from 'axios';

const api = axios.create({ baseURL: process.env.BOOK_API_URL || 'http://localhost:5000' });

export async function getAllBooks(callback) {
  let data;
  try {
    ({ data } = await api.get('/'));
  } catch (error) {
    return callback(error);
  }
  callback(null, data);
}
export const byIsbn = isbn => api.get('/isbn/' + encodeURIComponent(isbn)).then(response => response.data);
export const byAuthor = author => api.get('/author/' + encodeURIComponent(author)).then(response => response.data);
export const byTitle = title => api.get('/title/' + encodeURIComponent(title)).then(response => response.data);

await getAllBooks((error, books) => {
  if (error) throw error;
  console.log('All books', books);
});
for (const [label, result] of await Promise.all([
  byIsbn('1').then(data => ['ISBN', data]),
  byAuthor('Chinua Achebe').then(data => ['Author', data]),
  byTitle('Things Fall Apart').then(data => ['Title', data]),
])) console.log(label, result);
