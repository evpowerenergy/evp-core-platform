#!/bin/bash

# Development Startup Script
# ใช้สำหรับเริ่ม development environment

echo "🚀 Starting Development Environment..."
echo ""

# Check if Supabase is already running
if supabase status | grep -q "Running"; then
  echo "✅ Supabase already running"
else
  echo "📦 Starting Supabase..."
  supabase start
  echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   Terminal 2: npm run dev:function  (หรือ supabase functions serve [function-name])"
echo "   Terminal 3: npm run dev           (Frontend)"
echo ""
