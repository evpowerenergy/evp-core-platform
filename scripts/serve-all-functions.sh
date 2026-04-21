#!/bin/bash

# Script to serve all Edge Functions at once
# Usage: ./scripts/serve-all-functions.sh

echo "🚀 Serving all Edge Functions..."
echo ""

# Get all function directories (excluding _shared)
FUNCTIONS=$(ls -1d supabase/functions/*/ 2>/dev/null | grep -v "_shared" | xargs -I {} basename {})

if [ -z "$FUNCTIONS" ]; then
  echo "❌ No functions found!"
  exit 1
fi

echo "📋 Found $(echo "$FUNCTIONS" | wc -l) functions"
echo ""

# Option 1: Serve all in parallel (background)
echo "Option 1: Serve all in background (recommended for testing all functions)"
echo "Each function will run in background and output to logs/"
echo ""
read -p "Do you want to serve all functions? (y/n) " -n 1 -r
echo ""

if [[ $REQ_REPLY =~ ^[Yy]$ ]]; then
  mkdir -p logs
  
  for func in $FUNCTIONS; do
    echo "⚡ Starting $func..."
    supabase functions serve "$func" --no-verify-jwt > "logs/${func}.log" 2>&1 &
    echo "   → Running in background (log: logs/${func}.log)"
  done
  
  echo ""
  echo "✅ All functions started!"
  echo "📝 Logs are in logs/ directory"
  echo "💡 Use 'pkill -f \"supabase functions serve\"' to stop all"
else
  echo "Cancelled."
fi

