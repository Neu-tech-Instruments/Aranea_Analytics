// API Configuration
const API_BASE_URL = '/api';

// State
let network = null;
let currentWhales = [];
let currentMarkets = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAll);
    }

    // Initial Load
    refreshAll();

    // Auto-refresh every 30 seconds
    setInterval(refreshAll, 30000);

    // Search Filter
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTable(e.target.value);
        });
    }
});

async function refreshAll() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('hidden');

    try {
        await Promise.all([
            loadStats(),
            loadContrarian(),
            loadWhaleGraph(),
            loadNews() // New
        ]);
    } catch (error) {
        console.error("Refresh failed:", error);
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        const data = await res.json();
        document.getElementById('totalVolume').textContent = formatCurrency(data.total_volume);
        document.getElementById('marketCount').textContent = `${data.active_markets} Markets`;
        document.getElementById('activeWhales').textContent = data.tracked_whales;
    } catch (e) { console.error("Stats error", e); }
}

async function loadContrarian() {
    try {
        const yesThresh = document.getElementById('yesThreshold')?.value || 0.40;
        const volThresh = document.getElementById('volumeThreshold')?.value || 10000;
        const res = await fetch(`${API_BASE_URL}/contrarian?yes_threshold=${yesThresh}&volume_threshold=${volThresh}`);
        const data = await res.json();
        const opportunities = data.opportunities || data;
        document.getElementById('contrarianCount').textContent = opportunities.length;
        renderTable(opportunities);
    } catch (e) { console.error("Contrarian error", e); }
}

async function loadWhaleGraph() {
    try {
        const res = await fetch(`${API_BASE_URL}/whales`);
        const data = await res.json();
        const whales = data.whales || data;
        renderGraph(whales);
        renderWhaleTable(whales);
    } catch (e) { console.error("Whale graph error", e); }
}

// --- New Feature: Mock News Feed ---
async function loadNews() {
    const container = document.getElementById('newsFeed');
    if (!container) return;

    // Generate Mock News items
    const events = [
        { type: 'trade', title: 'Whale 0x7a... opened $50k position', market: 'US Election 2024', time: '2m ago' },
        { type: 'alert', title: 'Contrarian Signal Detected', market: 'Bitcoin > $100k', time: '5m ago' },
        { type: 'info', title: 'Market Volume Spike', market: 'Fed Interest Rates', time: '12m ago' },
        { type: 'trade', title: 'Whale 0xb2... closed position', market: 'Dune 2 Box Office', time: '24m ago' },
        { type: 'info', title: 'New Market Added', market: 'Oscars 2024 Best Picture', time: '1h ago' }
    ];

    let html = '';
    events.forEach(e => {
        let icon = 'fa-newspaper';
        let typeClass = 'info';

        if (e.type === 'trade') { icon = 'fa-money-bill-wave'; typeClass = 'trade'; }
        if (e.type === 'alert') { icon = 'fa-bell'; typeClass = 'alert'; }

        html += `
            <div class="news-item">
                <div class="news-icon ${typeClass}"><i class="fa-solid ${icon}"></i></div>
                <div class="news-content">
                    <div class="news-headline">${e.title}</div>
                    <div class="news-meta">
                        <span>${e.market}</span>
                        <span class="news-time">${e.time}</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// --- Tab Logic (Updated for 3 Tabs) ---
function switchTab(tabId) {
    // Reset all
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));

    // Activate specific
    if (tabId === 'opportunities') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('view-opportunities').classList.remove('hidden');
    } else if (tabId === 'whales') {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('view-whales').classList.remove('hidden');
    } else if (tabId === 'news') {
        document.querySelector('.tab:nth-child(3)').classList.add('active');
        document.getElementById('view-news').classList.remove('hidden');
    }
}
window.switchTab = switchTab;

// --- Info Modal Toggle ---
function toggleInfo() {
    const modal = document.getElementById('info-modal');
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}
window.toggleInfo = toggleInfo;

// --- Table Rendering (Preserved) ---
function renderWhaleTable(whales) {
    const tbody = document.getElementById('whalesTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    whales.forEach((whale, index) => {
        const tr = document.createElement('tr');
        const profitClass = (whale.profit || 0) > 0 ? 'text-green' : 'text-red';
        const winRate = (whale.win_rate * 100).toFixed(0) + '%';
        const address = whale.address || 'Unknown';
        tr.innerHTML = `
            <td><span class="badge" style="background:${index < 3 ? '#f59e0b' : '#e5e7eb'};color:${index < 3 ? 'white' : 'black'}">${index + 1}</span></td>
            <td><span class="font-bold">${address.substring(0, 6)}...${address.substring(address.length - 4)}</span></td>
            <td class="font-bold">${whale.contrarian_wins || 0}</td>
            <td>${winRate}</td>
            <td class="${profitClass}">${formatCurrency(whale.profit)}</td>
            <td><span class="badge">${(whale.strategies && whale.strategies[0]) || 'General'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTable(opportunities) {
    const tbody = document.getElementById('opportunitiesTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    const emptyState = document.getElementById('empty-state');
    if (opportunities.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');
    opportunities.forEach((opp, index) => {
        const tr = document.createElement('tr');
        const prob = opp.yes_price * 100;
        const probClass = prob > 80 ? 'text-red' : (prob < 20 ? 'text-green' : '');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td title="${opp.question}">${opp.question}</td>
            <td>${opp.outcome || 'Yes/No'}</td>
            <td class="font-bold ${probClass}">${(opp.yes_price * 100).toFixed(1)}%</td>
            <td>${formatCurrency(opp.volume)}</td>
            <td>${formatDate(opp.start_date)}</td>
            <td>${formatDate(opp.end_date)}</td>
            <td>
                <a href="https://polymarket.com/event/${opp.market_slug}" target="_blank" class="btn btn-primary" style="height: 24px; font-size: 10px; padding: 0 8px; text-decoration: none; color: white;">
                    Trade <i class="fa-solid fa-external-link-alt" style="margin-left: 4px;"></i>
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function filterTable(query) {
    const rows = document.querySelectorAll('#opportunitiesTable tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
    });
}

// --- Graph Visualization (Preserved Market Hubs) ---
function renderGraph(whales) {
    const container = document.getElementById('whale-graph');
    if (!container) return;
    const nodes = [];
    const edges = [];

    // 1. Create Shared Market Hubs
    const markets = [
        { id: 'm_1', label: 'US Election\n2024', value: 5000000, icon: '\uf1ad', color: '#6366f1' },
        { id: 'm_2', label: 'Bitcoin\n>$100k', value: 2000000, icon: '\uf15a', color: '#f59e0b' },
        { id: 'm_3', label: 'Fed Rates\nNo Cut', value: 1500000, icon: '\uf53a', color: '#10b981' },
        { id: 'm_4', label: 'Dune 2\nBox Office', value: 800000, icon: '\uf008', color: '#ef4444' }
    ];
    markets.forEach((m, idx) => {
        nodes.push({
            id: m.id, label: m.label, shape: 'icon',
            icon: { face: "'Font Awesome 6 Free'", code: m.icon, weight: '900', size: 50, color: m.color },
            font: { color: '#1e293b', size: 14, face: 'Inter', multi: true, vadjust: 0 },
            title: `Volume: ${formatCurrency(m.value)}`,
            fixed: { y: idx % 2 === 0 ? 0 : 100 }
        });
    });

    // 2. Connect Whales
    whales.forEach((whale, idx) => {
        const address = whale.address || 'Unknown';
        const whaleId = `w_${address}`;
        const size = Math.min(40, Math.max(25, (whale.contrarian_wins || 0) * 3));
        nodes.push({
            id: whaleId, label: `Whale\n${address.substring(0, 4)}...`, shape: 'icon',
            icon: { face: "'Font Awesome 6 Free'", code: '\uf6f1', weight: '900', size: size, color: '#475569' },
            font: { color: '#4b5563', size: 12, face: 'Inter', vadjust: -5 },
            title: `Strategy: ${whale.strategies ? whale.strategies[0] : 'Mixed'}`
        });

        const marketIndex = (address.charCodeAt(address.length - 1) + idx) % markets.length;
        const targetMarket = markets[marketIndex];
        edges.push({
            from: whaleId, to: targetMarket.id,
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
            dashes: true,
            color: { color: '#cbd5e1', highlight: '#4f46e5' },
            width: 2, length: 200, label: 'Bet NO',
            font: { align: 'middle', size: 9, color: '#64748b', background: 'rgba(255,255,255,0.8)', strokeWidth: 0 }
        });

        if ((whale.contrarian_wins || 0) > 3) {
            const marketIndex2 = (marketIndex + 1) % markets.length;
            edges.push({ from: whaleId, to: markets[marketIndex2].id, dashes: true, color: { color: '#cbd5e1', opacity: 0.5 }, width: 1 });
        }
    });

    const options = {
        nodes: { borderWidth: 0, shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 10, x: 0, y: 5 } },
        layout: { hierarchical: { enabled: false } }, // Organic
        physics: { enabled: true, barnesHut: { gravitationalConstant: -4000, centralGravity: 0.1, springLength: 200, springConstant: 0.04, damping: 0.09, avoidOverlap: 0.5 }, stabilization: { iterations: 150 } },
        interaction: { hover: true, dragNodes: true, zoomView: true, dragView: true }
    };
    network = new vis.Network(container, { nodes, edges }, options);
    network.on('click', (params) => {
        if (params.nodes.length > 0) handleNodeClick(params.nodes[0], whales);
        else closePanel();
    });
    network.once('afterDrawing', () => {
        network.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
    });
}

function formatCurrency(vid) {
    if (!vid) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vid);
}
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
}
function handleNodeClick(nodeId, whales) {
    const panel = document.getElementById('details-panel');
    const content = document.getElementById('panelContent');
    const title = document.getElementById('panelTitle');
    if (!panel || !content) return;
    if (nodeId.startsWith('w_')) {
        const address = nodeId.substring(2);
        const whale = whales.find(w => w.address === address);
        if (whale) {
            if (title) title.textContent = "Whale Analysis";
            content.innerHTML = generateWhaleInsights(whale);
            panel.classList.remove('hidden');
        }
    } else { closePanel(); }
}
function closePanel() {
    const panel = document.getElementById('details-panel');
    if (panel) panel.classList.add('hidden');
    if (network) network.unselectAll();
}
window.closePanel = closePanel;

function generateWhaleInsights(whale) {
    let signal = { market: "Unknown", outcome: "N/A", price: "$0.00" };
    const strat = (whale.strategies && whale.strategies[0]) || "";
    if (strat.includes("Fading")) { signal = { market: "Will Biden Resign?", outcome: "NO", price: "$0.45" }; }
    else if (strat.includes("Crypto")) { signal = { market: "Bitcoin > $100k in 2024", outcome: "NO", price: "$0.32" }; }
    else { signal = { market: "US Election Winner 2028", outcome: "Newsom", price: "$0.12" }; }

    return `
        <div class="insight-section">
            <div class="whale-stat-grid">
                <div class="stat-box"><div class="stat-label">Win Rate</div><div class="stat-val">${(whale.win_rate * 100).toFixed(0)}%</div></div>
                <div class="stat-box"><div class="stat-label">Profit</div><div class="stat-val text-green">${formatCurrency(whale.profit)}</div></div>
            </div>
        </div>
        <div class="insight-section">
            <h4><i class="fa-solid fa-bullseye"></i> Alpha Signal</h4>
            <div class="signal-card">
                <div class="signal-header"><i class="fa-solid fa-bolt"></i> Strong Buy</div>
                <div class="signal-market">"${signal.market}"</div>
                <div class="signal-meta"><span class="badge" style="background:#dcfce7;color:#166534">Outcome: ${signal.outcome}</span><span style="font-size:11px; margin-left:8px;">Entry: ${signal.price}</span></div>
            </div>
        </div>
        <div class="insight-section">
            <h4><i class="fa-solid fa-layer-group"></i> Context</h4>
            <p style="font-size:12px;color:var(--text-secondary);line-height:1.5">
                <strong>${strat || 'General'} Strategy</strong>:<br>Typical high-conviction plays on low volume.</p>
        </div>
    `;
}
