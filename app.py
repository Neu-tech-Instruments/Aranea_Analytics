from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from polymarket_scanner import get_contrarian_candidates
from whale_tracker import WhaleTracker
import os

# Configure Flask to serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Initialize persistence
tracker = WhaleTracker()

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# We don't need a catch-all route anymore as static_url_path='' handles it provided files exist.
# However, explicit routes for API take precedence.

@app.route('/api/stats')
def get_stats():
    # In a real app, this would aggregate from the scanner and tracker
    whales = tracker.get_ranked_whales()
    return jsonify({
        "success": True,
        "total_volume": 12500000, 
        "active_markets": 450,
        "contrarian_opportunities": 12, 
        "tracked_whales": len(whales)
    })

@app.route('/api/contrarian')
def get_contrarian():
    yes_threshold = float(request.args.get('yes_threshold', 0.85))
    volume_threshold = float(request.args.get('volume_threshold', 50000))
    df = get_contrarian_candidates()
    opportunities = df.to_dict(orient='records')
    return jsonify({
        "success": True,
        "count": len(opportunities),
        "opportunities": opportunities
    })

@app.route('/api/whales')
def get_whales():
    whales = tracker.get_ranked_whales()
    return jsonify({
        "success": True,
        "count": len(whales),
        "whales": whales
    })

if __name__ == '__main__':
    print("🚀 Arānea Server Running...")
    print("📊 Dashboard available at: http://localhost:5000")
    app.run(debug=True, port=5000)
