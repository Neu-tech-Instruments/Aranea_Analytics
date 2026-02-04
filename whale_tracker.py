import json
import os
import random

class WhaleTracker:
    def __init__(self, data_file='whales.json'):
        self.data_file = data_file
        self.whales = self._load_data()
        
    def _load_data(self):
        if not os.path.exists(self.data_file):
            return self._seed_data()
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except:
            return self._seed_data()
            
    def _seed_data(self):
        # Initial mock data to start tracking
        return [
            {"address": "0x7a2...9f1a", "contrarian_wins": 42, "profit": 1250000, "win_rate": 0.68, "strategies": ["Fading Hype"]},
            {"address": "0xbb4...82c1", "contrarian_wins": 35, "profit": 890000, "win_rate": 0.55, "strategies": ["Underdog Betting"]},
            {"address": "0x12c...55a0", "contrarian_wins": 28, "profit": 450000, "win_rate": 0.42, "strategies": ["Election Upsets"]},
            {"address": "0x99a...11b2", "contrarian_wins": 19, "profit": 210000, "win_rate": 0.35, "strategies": ["Sports Longshots"]},
            {"address": "0x33d...77e4", "contrarian_wins": 12, "profit": 150000, "win_rate": 0.31, "strategies": ["Tech Skeptic"]}
        ]

    def save_data(self):
        with open(self.data_file, 'w') as f:
            json.dump(self.whales, f, indent=2)

    def get_ranked_whales(self):
        # Rank by Contrarian Wins descending
        ranked = sorted(self.whales, key=lambda x: x['contrarian_wins'], reverse=True)
        return ranked

    def update_whale_stats(self, address, won_bet=False, profit_change=0):
        # Find or create whale
        whale = next((w for w in self.whales if w['address'] == address), None)
        if not whale:
            whale = {
                "address": address,
                "contrarian_wins": 0,
                "profit": 0,
                "win_rate": 0.0,
                "strategies": ["New"]
            }
            self.whales.append(whale)
        
        if won_bet:
            whale['contrarian_wins'] += 1
        
        whale['profit'] += profit_change
        
        # Simulate win rate update logic
        total_bets = (whale['contrarian_wins'] / whale['win_rate']) if whale['win_rate'] > 0 else 1
        if won_bet:
            whale['win_rate'] = whale['contrarian_wins'] / (total_bets + 1)
            
        self.save_data()
        return whale
