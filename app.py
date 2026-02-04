from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from polymarket_scanner import get_contrarian_candidates
from whale_tracker import WhaleTracker
import os

app = Flask(__name__, static_url_path='')
CORS(app)

# Initialize persistence
tracker = WhaleTracker()

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/stats')
def get_stats():
    # In a real app, this would aggregate from the scanner and tracker
    # For now, we mock the totals but get real counts from our modules
    whales = tracker.get_ranked_whales()
    
    # We could fetch candidates to get count, but it might be slow for a 'stats' call
    # Let's assume the client calls /api/contrarian separately or we cache it.
    # For speed, we return mock totals but real whale count.
    
    return jsonify({
        "success": True,
        "total_volume": 12500000, 
        "active_markets": 450,
        "contrarian_opportunities": 12, # Simplified
        "tracked_whales": len(whales)
    })

@app.route('/api/contrarian')
def get_contrarian():
    yes_threshold = float(request.args.get('yes_threshold', 0.85))
    volume_threshold = float(request.args.get('volume_threshold', 50000))
    
    # Use the scanner module
    df = get_contrarian_candidates()
    
    # Filter if needed (scanner handles defaults, but we could add more logic)
    # Convert to dict
    opportunities = df.to_dict(orient='records')
    
    return jsonify({
        "success": True,
        "count": len(opportunities),
        "opportunities": opportunities
    })

@app.route('/api/whales')
def get_whales():
    # Return ranked whales from persistence
    whales = tracker.get_ranked_whales()
    return jsonify({
        "success": True,
        "count": len(whales),
        "whales": whales
    })

if __name__ == '__main__':
    print("🚀 Arānea Server Running...")
    app.run(debug=True, port=5000)
