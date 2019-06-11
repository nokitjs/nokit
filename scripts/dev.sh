#!/bin/bash

set -e

npm install
npm link
tsc -w & cd packages/noka-example 
npm install
npm link noka
npm run dev