#!/bin/bash
# Script to fix merge conflict markers in server/app.ts

FILE="server/app.ts"

# Backup original file
cp $FILE ${FILE}.bak

# Remove merge conflict markers and keep merged code
sed -i '/^<<<<<<< HEAD$/d' $FILE
sed -i '/^=======$/d' $FILE
sed -i '/^>>>>>>> cb104a60f344ae079456628270947c735ccad623$/d' $FILE

echo "Merge conflict markers removed from $FILE. Backup saved as ${FILE}.bak"
