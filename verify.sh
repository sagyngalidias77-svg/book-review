#!/bin/sh
set -eu
base=${BOOK_API_URL:-http://localhost:5000}
cookies=$(mktemp)
trap 'rm -f "$cookies"' EXIT
username="reader-$(date +%s)-$$"
credentials="{\"username\":\"$username\",\"password\":\"demo-password\"}"
request() {
  printf '\n> curl'
  printf ' [%s]' "$@"
  printf '\n'
  curl -fsS "$@"
  printf '\n'
}
request "$base/"
request "$base/isbn/1"
request "$base/author/Chinua%20Achebe"
request "$base/title/Things%20Fall%20Apart"
request "$base/review/1"
request -H 'Content-Type: application/json' -d "$credentials" "$base/register"
request -c "$cookies" -H 'Content-Type: application/json' -d "$credentials" "$base/customer/login"
request -b "$cookies" -X PUT -H 'Content-Type: application/json' -d '{"review":"Highly recommended."}' "$base/customer/auth/review/1"
request -b "$cookies" -X PUT -H 'Content-Type: application/json' -d '{"review":"Updated review."}' "$base/customer/auth/review/1"
request "$base/review/1"
request -b "$cookies" -X DELETE "$base/customer/auth/review/1"
request "$base/review/1"
