#!/bin/bash

echo "🔧 Setting up Atonix Capital..."
echo ""

VENV_DIR=".venv"
if [ -d "backend/venv" ] && [ ! -d "backend/.venv" ]; then
    VENV_DIR="venv"
fi

# Setup backend
echo "📦 Setting up Django backend..."
cd backend

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    BANKING_KEY=$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)
    sed -i "s/^BANKING_TOKEN_ENCRYPTION_KEY=.*/BANKING_TOKEN_ENCRYPTION_KEY=${BANKING_KEY}/" .env
fi

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "Installing ATC CLI..."
python -m pip install -e ../tools/atc_cli

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser prompt
echo ""
read -p "Do you want to create a superuser for admin panel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

cd ..

# Setup frontend
echo ""
echo "⚛️  Setting up React frontend..."
cd frontend

# Install dependencies
echo "Installing Node dependencies..."
npm install

# Create .env.local file
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application, run:"
echo "  ./start.sh"
echo ""
echo "Banking integration setup:"
echo "  1. Edit backend/.env with your Plaid, Yodlee, or Finicity credentials"
echo "  2. Point provider webhooks to /api/banking-integrations/webhooks/<provider_code>/"
echo "  3. Nightly fallback sync runs automatically via start.sh or docker-compose banking-sync"
echo ""
echo "To use the CLI after setup, run:"
echo "  backend/$VENV_DIR/bin/atc profiles"
echo ""
echo "Or start manually:"
echo "  Backend:  cd backend && source $VENV_DIR/bin/activate && python manage.py runserver"
echo "  Frontend: cd frontend && npm start"
