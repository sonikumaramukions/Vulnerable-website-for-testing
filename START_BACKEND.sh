#!/bin/bash
# Quick script to start the backend server

cd "$(dirname "$0")/vulnerable-sic/backend"

echo "=========================================="
echo "Student Information System - Backend"
echo "=========================================="
echo ""
echo "Checking database..."

if [ ! -f "students.db" ]; then
    echo "⚠️  Database not found. Creating database..."
    node seed.js
    echo ""
fi

echo "Starting backend server on port 3000..."
echo "Press Ctrl+C to stop the server"
echo ""
echo "=========================================="
echo ""

node server.js

