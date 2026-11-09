# Book Review Application

Express API for browsing books and managing personal reviews. Authentication combines a session cookie and a signed JWT. This standalone demo uses an in-memory sample catalog, account store, and review store.

## Run

```sh
npm install
npm start
```

In another terminal, run the Axios lookup examples and capture actual HTTP requests and responses for review:

```sh
npm run demo
sh verify.sh | tee curl-results.txt
```

The verification script uses a disposable demo account. It lists books, searches by ISBN, author and title, reads reviews, registers and logs in, then adds, updates and deletes its own review.

The course also asks for the public GitHub repository URL. Its lab starter was unavailable when this version was prepared, so compare the standalone files against the course starter and rubric once the lab opens.
