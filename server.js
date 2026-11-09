import express from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const app = express();
const secret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const users = new Map();
const books = new Map([
  ['1', { author: 'Chinua Achebe', title: 'Things Fall Apart', reviews: new Map() }],
  ['2', { author: 'Hans Christian Andersen', title: 'Fairy tales', reviews: new Map() }],
  ['3', { author: 'Dante Alighieri', title: 'The Divine Comedy', reviews: new Map() }],
]);
const publicBook = ({ author, title, reviews }) => ({ author, title, reviews: Object.fromEntries(reviews) });
const normalize = value => value.trim().toLowerCase();

app.use(express.json());
app.use(session({ secret, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', maxAge: 3600000 } }));

app.get('/', (_req, res) => res.json(Object.fromEntries([...books].map(([id, book]) => [id, publicBook(book)]))));
app.get('/isbn/:isbn', (req, res) => {
  const book = books.get(req.params.isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(publicBook(book));
});
for (const field of ['author', 'title']) {
  app.get('/' + field + '/:query', (req, res) => {
    const query = normalize(req.params.query);
    res.json([...books].filter(([, book]) => normalize(book[field]) === query)
      .map(([isbn, book]) => ({ isbn, ...publicBook(book) })));
  });
}
app.get('/review/:isbn', (req, res) => {
  const book = books.get(req.params.isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(Object.fromEntries(book.reviews));
});

app.post('/register', (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || !/^[\w.-]{1,64}$/.test(username)
    || typeof password !== 'string' || !password || password.length > 128) {
    return res.status(400).json({ error: 'Provide a valid username and password' });
  }
  if (users.has(username)) return res.status(409).json({ error: 'Username already registered' });
  const salt = randomBytes(16);
  users.set(username, { salt, hash: scryptSync(password, salt, 64) });
  res.status(201).json({ message: 'User registered' });
});
app.post('/customer/login', (req, res, next) => {
  const { username, password } = req.body ?? {};
  const user = users.get(username);
  if (!user || typeof password !== 'string' || password.length > 128
    || !timingSafeEqual(user.hash, scryptSync(password, user.salt, 64))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.regenerate(error => {
    if (error) return next(error);
    req.session.token = jwt.sign({ sub: username }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    res.json({ message: 'Login successful' });
  });
});
function requireLogin(req, res, next) {
  try {
    req.username = jwt.verify(req.session.token, secret, { algorithms: ['HS256'] }).sub;
  } catch {
    return res.status(401).json({ error: 'Log in to manage reviews' });
  }
  next();
}
app.put('/customer/auth/review/:isbn', requireLogin, (req, res) => {
  const book = books.get(req.params.isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || !review.trim() || review.length > 2000) {
    return res.status(400).json({ error: 'Provide a review of 1–2000 characters' });
  }
  book.reviews.set(req.username, review.trim());
  res.json({ message: 'Review saved' });
});
app.delete('/customer/auth/review/:isbn', requireLogin, (req, res) => {
  const book = books.get(req.params.isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!book.reviews.delete(req.username)) return res.status(404).json({ error: 'Review not found' });
  res.json({ message: 'Review deleted' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Book Review API listening on port ' + port));
