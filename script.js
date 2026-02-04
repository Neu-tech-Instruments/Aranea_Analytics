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
            loadWhaleGraph()
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
    } catch (e) {
        console.error("Stats error", e);
    }
}

async function loadContrarian() {
    try {
        const yesThreshElem = document.getElementById('yesThreshold');
        const volThreshElem = document.getElementById('volumeThreshold');

        const yesThresh = yesThreshElem ? yesThreshElem.value : 0.40;
        const volThresh = volThreshElem ? volThreshElem.value : 10000;

        const res = await fetch(`${API_BASE_URL}/contrarian?yes_threshold=${yesThresh}&volume_threshold=${volThresh}`);
        const data = await res.json();

        // Fix: correctly access the array inside the response object if needed
        // Based on logs: { count: 0, opportunities: [], success: true }
        const opportunities = data.opportunities || data;

        const countElem = document.getElementById('contrarianCount');
        if (countElem) countElem.textContent = opportunities.length;

        renderTable(opportunities);
    } catch (e) {
        console.error("Contrarian error", e);
    }
}

// --- Tab Logic ---
function switchTab(tabId) {
    // Update Tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Find the clicked tab (simple approach: match text or index, but we used onclick)
    // Actually we need to set the active class on the element that was clicked.
    // Since we pass the ID, let's find the tab by data-target or just update all based on state. 
    // Ideally we pass 'this' or query by attribute. 
    // Or simplified: select by index. 

    // Better: Update UI based on ID
    if (tabId === 'opportunities') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.querySelector('.tab:nth-child(2)').classList.remove('active');
        document.getElementById('view-opportunities').classList.remove('hidden');
        document.getElementById('view-whales').classList.add('hidden');
    } else {
        document.querySelector('.tab:nth-child(1)').classList.remove('active');
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('view-opportunities').classList.add('hidden');
        document.getElementById('view-whales').classList.remove('hidden');
    }
}

// Make global
window.switchTab = switchTab;

async function loadWhaleGraph() {
    try {
        const res = await fetch(`${API_BASE_URL}/whales`);
        const data = await res.json();
        // Fix: access data.whales based on logs
        const whales = data.whales || data;

        renderGraph(whales);
        renderWhaleTable(whales);
    } catch (e) {
        console.error("Whale graph error", e);
    }
}

// --- Table Rendering ---
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

        // Calculate probability color
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
    const lowerQuery = query.toLowerCase();

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
}

// --- Graph Visualization (Vis.js) ---
// --- Graph Visualization (Vis.js) ---
function renderGraph(whales) {
    const container = document.getElementById('whale-graph');
    if (!container) return;

    const nodes = [];
    const edges = [];

    whales.forEach(whale => {
        // Whale Node (Icon)
        const address = whale.address || 'Unknown';
        const whaleId = `w_${address}`;

        // Size node based on wins (min 20, max 40)
        const size = Math.min(40, Math.max(20, (whale.contrarian_wins || 0) * 2));

        nodes.push({
            id: whaleId,
            label: `Whale\n${address.substring(0, 4)}...`,
            shape: 'icon',
            icon: {
                face: "'Font Awesome 6 Free'",
                code: '\uf6f1', // fa-user-astronaut or similar whale concept? Let's use fa-crown f521 or fa-user f007
                weight: '900', // Solid
                size: 40,
                color: '#f59e0b'
            },
            font: { color: '#374151', size: 12, face: 'Inter', multi: true, vadjust: 0 },
            title: `Wins: ${whale.contrarian_wins}\nWin Rate: ${(whale.win_rate * 100).toFixed(0)}%` // Tooltip
        });

        // Profit Node (Target)
        const profitId = `p_${whale.address}`;
        const isProfitable = (whale.profit || 0) > 0;

        nodes.push({
            id: profitId,
            label: `\n${formatCurrency(whale.profit)}`,
            shape: 'icon',
            icon: {
                face: "'Font Awesome 6 Free'",
                code: '\uf1c0', // fa-database or fa-sack-dollar f81d
                weight: '900',
                size: 30,
                color: isProfitable ? '#10b981' : '#ef4444'
            },
            font: { color: isProfitable ? '#059669' : '#b91c1c', size: 12, face: 'Inter', vadjust: -5 }
        });

        edges.push({
            from: whaleId,
            to: profitId,
            arrows: {
                to: { enabled: true, scaleFactor: 0.5 }
            },
            dashes: true,
            color: { color: '#94a3b8', highlight: '#4f46e5' },
            width: 1,
            length: 200
        });
    });

    // Configuration
    const options = {
        nodes: {
            borderWidth: 0,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.1)',
                size: 10,
                x: 0,
                y: 5
            }
        },
        layout: {
            hierarchical: {
                direction: 'LR',
                sortMethod: 'directed',
                levelSeparation: 250,
                nodeSpacing: 100
            }
        },
        physics: {
            enabled: true,
            hierarchicalRepulsion: {
                nodeDistance: 120,
                springLength: 200,
                damping: 0.1
            }
        },
        interaction: {
            hover: true,
            dragNodes: true,
            zoomView: true,
            dragView: true
        }
    };

    network = new vis.Network(container, { nodes, edges }, options);

    // Interaction Events
    network.on('click', (params) => {
        if (params.nodes.length > 0) {
            handleNodeClick(params.nodes[0], whales);
        } else {
            closePanel();
        }
    });

    // Fit to view
    network.once('afterDrawing', () => {
        network.fit({
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    });
}

// --- Utilities ---
function formatCurrency(vid) {
    if (!vid) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(vid);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    // Polymarket dates are ISO strings
    try {
        return new Date(dateStr).toLocaleDateString();
    } catch {
        return dateStr;
    }
}

// --- Interaction Logic ---
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
    } else {
        closePanel();
    }
}

function closePanel() {
    const panel = document.getElementById('details-panel');
    if (panel) panel.classList.add('hidden');
    if (network) network.unselectAll();
}
window.closePanel = closePanel;

function generateWhaleInsights(whale) {
    // Mock logic for Alpha Signal
    let signal = { market: "Unknown", outcome: "N/A", price: "$0.00" };
    const strat = (whale.strategies && whale.strategies[0]) || "";

    if (strat.includes("Fading")) {
        signal = { market: "Will Biden Resign?", outcome: "NO", price: "$0.45" };
    } else if (strat.includes("Crypto")) {
        signal = { market: "Bitcoin > $100k in 2024", outcome: "NO", price: "$0.32" };
    } else {
        signal = { market: "US Election Winner 2028", outcome: "Newsom", price: "$0.12" };
    }

    return `
        <div class="insight-section">
            <div class="whale-stat-grid">
                <div class="stat-box">
                    <div class="stat-label">Win Rate</div>
                    <div class="stat-val">${(whale.win_rate * 100).toFixed(0)}%</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Profit</div>
                    <div class="stat-val text-green">${formatCurrency(whale.profit)}</div>
                </div>
            </div>
        </div>

        <div class="insight-section">
            <h4><i class="fa-solid fa-bullseye"></i> Alpha Signal</h4>
            <div class="signal-card">
                <div class="signal-header"><i class="fa-solid fa-bolt"></i> Strong Buy</div>
                <div class="signal-market">"${signal.market}"</div>
                <div class="signal-meta">
                    <span class="badge" style="background:#dcfce7;color:#166534">Outcome: ${signal.outcome}</span>
                    <span style="font-size:11px; margin-left:8px;">Entry: ${signal.price}</span>
                </div>
            </div>
        </div>

        <div class="insight-section">
            <h4><i class="fa-solid fa-layer-group"></i> Context</h4>
            <p style="font-size:12px;color:var(--text-secondary);line-height:1.5">
                <strong>${strat || 'General'} Strategy</strong>:<br>
                Typically enters positions when sentiment > 80% but volume is low. 
                Recent activity suggests accumulation of positions on high-volatility events.
            </p>
        </div>
    `;
}
