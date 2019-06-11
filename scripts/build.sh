#!/bin/bash

set -e

npm install
npm run clean 
npm run lint 
tsc 
npm run copy
npm link
cd packages/noka-example 
npm install
npm link noka
npm run build