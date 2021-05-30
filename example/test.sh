#!/bin/sh
set -e

# This is a very simple test that starts the built server and compares the HTML output

clean_up () {
  echo "INFO Shutting down server"
  kill -15 $SERVER_PID
}

trap clean_up EXIT

echo "INFO Building the server"
next build

echo "INFO Starting the server in the background"
next start &
SERVER_PID=$!

echo "INFO Waiting for server startup"
sleep 1

echo "INFO Writing server output"
curl -s -f localhost:3000 | ./pup '#__next' > __snapshots__/en.actual.html
curl -s -f localhost:3000/de | ./pup '#__next' > __snapshots__/de.actual.html

if test "$1" = "-u"; then
  echo "INFO Writing server output as snapshot"
  cp __snapshots__/en.actual.html __snapshots__/en.expected.html
  cp __snapshots__/de.actual.html __snapshots__/de.expected.html
fi

echo "INFO Comparing server output with snapshots"
diff -U 3 --color __snapshots__/en.expected.html __snapshots__/en.actual.html
diff -U 3 --color __snapshots__/de.expected.html __snapshots__/de.actual.html
