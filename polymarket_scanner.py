import requests
import pandas as pd

def get_contrarian_candidates():
    # Polymarket Gamma API endpoint for markets
    url = "https://gamma-api.polymarket.com/markets" 
    
    # Parameters: Active markets, sorted by volume (liquidity is needed for whales)
    params = {
        "limit": 100,
        "active": "true",
        "order": "volume",
        "ascending": "false"
    }
    
    response = requests.get(url, params=params).json()
    
    contrarian_list = []
    
    for market in response:
        # We look for binary markets (Yes/No)
        if market.get('outcomePrices') and len(market['outcomePrices']) == 2:
            yes_price = float(market['outcomePrices'][0])
            no_price = float(market['outcomePrices'][1])
            
            # DEFINITION OF CONTRARIAN SETUP:
            # 1. Crowd is heavily biased (Yes price > 0.85)
            # 2. Volume is high (implies retail hype, not just illiquidity)
            if yes_price > 0.85 and float(market['volume']) > 50000:
                contrarian_list.append({
                    "question": market['question'],
                    "category": market['tags'][0] if market.get('tags') else "Uncategorized",
                    "yes_odds": yes_price,
                    "contrarian_bet": "NO",
                    "implied_reward": round((1 / (1 - yes_price)), 2), # e.g., 6x return
                    "market_id": market['id']
                })
    
    return pd.DataFrame(contrarian_list)

def find_contrarian_whales(category_name="Politics"):
    # This is a mock structure as real wallet data requires Dune/TheGraph queries
    # In a real app, you would query the 'Resolution' events on the blockchain
    
    print(f"--- Hunting Whales in {category_name} ---")
    
    # 1. Identify a resolved 'Contrarian Win' (e.g., a market that ended 'NO' but had 90% YES odds)
    # 2. Query the order book history for that market ID
    # 3. Sum profits for addresses that held 'NO' positions
    
    print("Strategy: Look for wallets buying 'NO' shares when price was < $0.15")
    print("Target Profile: High win-rate on 'NO' outcomes.")
    
    # Example Output you would generate:
    top_whales = [
        {"Wallet": "0xFeather...21", "Strategy": "Fading Viral News", "Profit": "$1.2M"},
        {"Wallet": "0xImJustKen...55", "Strategy": "Crypto Price Skeptic", "Profit": "$2.4M"},
        {"Wallet": "0xGiga...99", "Strategy": "Election Upsets", "Profit": "$500k"}
    ]
    return pd.DataFrame(top_whales)

# Run the scanner
df_opps = get_contrarian_candidates()

print("=" * 80)
print("POLYMARKET CONTRARIAN SCANNER")
print("=" * 80)
print(f"\nFound {len(df_opps)} contrarian opportunities (Yes > 85%, Volume > $50k)\n")

if len(df_opps) > 0:
    print("Top Potential Contrarian Plays:")
    print("-" * 80)
    for idx, row in df_opps.head(10).iterrows():
        print(f"\n📊 {row['category']}")
        print(f"❓ {row['question']}")
        print(f"📈 Yes Odds: {row['yes_odds']:.2%} | Contrarian Bet: {row['contrarian_bet']}")
        print(f"💰 Implied Reward: {row['implied_reward']}x")
        print(f"🔗 Market ID: {row['market_id']}")
else:
    print("⚠️  No contrarian opportunities found with current criteria.")
    print("\nTip: Try adjusting the threshold (currently Yes > 85% and Volume > $50k)")

# Run whale analysis
print("\n" + "=" * 80)
print("WHALE WALLET TRACKER")
print("=" * 80 + "\n")
df_whales = find_contrarian_whales("Politics")
if len(df_whales) > 0:
    print("\n📊 Top Contrarian Whales:\n")
    for idx, whale in df_whales.iterrows():
        print(f"🐋 {whale['Wallet']}")
        print(f"   Strategy: {whale['Strategy']}")
        print(f"   💰 Total Profit: {whale['Profit']}\n")
