#!/bin/bash
cd /home/kavia/workspace/code-generation/dress-shopping-app-33c4b7a4/MonolithicWebApplication
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

