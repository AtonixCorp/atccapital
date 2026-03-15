#!/bin/bash

echo "🚀 Starting Atonix Capital Application..."
echo ""

VENV_DIR=".venv"
if [ -d "backend/venv" ] && [ ! -d "backend/.venv" ]; then
	VENV_DIR="venv"
fi

# Start backend
echo "📦 Starting Django backend..."
cd backend
if [ -f ".env" ]; then
	set -a
	source .env
	set +a
fi
source "$VENV_DIR/bin/activate" 2>/dev/null || python -m venv "$VENV_DIR" && source "$VENV_DIR/bin/activate"
pip install -r requirements.txt > /dev/null 2>&1
python manage.py migrate > /dev/null 2>&1
python manage.py runserver &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:8000"

if [ "${ENABLE_BANKING_SYNC_SCHEDULER:-1}" = "1" ]; then
	(
		while true; do
			python manage.py sync_banking_integrations > /dev/null 2>&1
			sleep "${BANKING_SYNC_INTERVAL_SECONDS:-86400}"
		done
	) &
	BANKING_SYNC_PID=$!
	echo "✅ Nightly banking sync scheduler enabled"
fi
cd ..

# Wait a moment
sleep 2

# Start frontend
echo "⚛️  Starting React frontend..."
cd frontend
npm install > /dev/null 2>&1
npm start &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:3000"
cd ..

echo ""
echo "🎉 Application is ready!"
echo "📊 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000/api"
echo "🛠️  Admin Panel: http://localhost:8000/admin"
echo "🏦 Banking webhook base: http://localhost:8000/api/banking-integrations/webhooks/<provider_code>/"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID ${BANKING_SYNC_PID:-} 2>/dev/null; exit" INT
wait
