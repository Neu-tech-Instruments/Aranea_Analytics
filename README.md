# Arānea - Polymarket Analytics Scanner

A powerful analytics dashboard for finding contrarian betting opportunities and tracking whale wallets on Polymarket.

## Features

- **Contrarian Scanner**: Finds markets with high "Yes" probability but low volume, potentially indicating mispriced opportunities.
- **Whale Tracker**: Monitors top profitable wallets to see their current positions and win rates.
- **Real-time Dashboard**: Interactive UI with live data updates, filters, and mobile-responsive design.
- **Modern Aesthetics**: Premium dark-mode design with glassmorphism effects and smooth animations.

## Setup & Running

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```bash
   python3 app.py
   ```

3. **Open Dashboard**
   The application will start at `http://localhost:5000`. 
   
   *Note: Open this URL in your browser. Do not open `index.html` directly as a file.*

## Project Structure

- `app.py`: Flask backend API and static file server.
- `polymarket_scanner.py`: Core logic for fetching and analyzing Polymarket data.
- `index.html`: Main dashboard frontend.
- `style.css`: Custom CSS design system.
- `script.js`: Frontend logic and API integration.

## API Endpoints

- `/api/stats`: General market statistics.
- `/api/contrarian`: List of potential contrarian opportunities.
- `/api/whales`: Top whale wallet performance data.
- `/api/markets`: Raw market data.
