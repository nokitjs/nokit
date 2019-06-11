#!/bin/bash

set -e

npm install
tslint --project ./tsconfig.json --fix 
cd packages/noka-example 
npm run lint