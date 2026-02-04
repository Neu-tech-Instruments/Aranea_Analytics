// API
const API_BASE_URL = '/api';

// State
let network = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
    refreshAll();
    // Buttons
    document.getElementById('refreshBtn')?.addEventListener('click', refreshAll);
});

async function refreshAll() {
    try {
        await Promise.all([
            loadStats(),
            loadContrarian(),
            loadWhaleGraph()
        ]);
    } catch (e) { console.error("Refresh Error", e); }
}

async function loadStats() { /* ... same ... */ }
async function loadContrarian() {
    const res = await fetch(`${API_BASE_URL}/contrarian?yes_threshold=0.4&volume_threshold=10000`);
    const data = await res.json();
    renderTable(data.opportunities || data);
}

async function loadWhaleGraph() {
    const res = await fetch(`${API_BASE_URL}/whales`);
    const data = await res.json();
    const whales = data.whales || data;
    renderGraph(whales);
    renderWhaleTable(whales);

    // Update legend
    const leg = document.getElementById('activeWhalesLegend');
    if (leg) leg.textContent = whales.length;
}


function renderGraph(whales) {
    const container = document.getElementById('whale-graph');
    if (!container) return;

    const nodes = [];
    const edges = [];

    // 1. Markets
    const markets = [
        { id: 'm_1', label: '<b>US Election 2024</b>\n$5.2M Vol', group: 'market', color: '#8b5cf6' },
        { id: 'm_2', label: '<b>Bitcoin > $100k</b>\n$2.1M Vol', group: 'market', color: '#f97316' },
        { id: 'm_3', label: '<b>Fed Rates</b>\n$1.5M Vol', group: 'market', color: '#3b82f6' },
        { id: 'm_4', label: '<b>Dune 2 BO</b>\n$800k Vol', group: 'market', color: '#10b981' }
    ];

    markets.forEach((m, i) => {
        nodes.push({
            id: m.id,
            label: m.label,
            color: { background: 'white', border: m.color, highlight: { background: '#f8fafc', border: m.color } },
            shape: 'box',
            font: { multi: true, face: 'Inter', size: 14 },
            margin: 10,
            borderWidth: 2,
            level: 0
        });
    });

    // 2. Whales
    whales.forEach((w, i) => {
        const wid = `w_${w.address}`;
        const label = `<b>Whale ${w.address.substring(0, 4)}</b>\nProfit: ${formatCurrency(w.profit)}`;

        nodes.push({
            id: wid,
            label: label,
            color: { background: 'white', border: '#cbd5e1' },
            shape: 'box',
            font: { multi: true, face: 'Inter', size: 12 },
            margin: 8,
            shapeProperties: { borderDashes: [5, 5] }, // Dashed for whales?
            level: 1
        });

        // Edge
        const mIdx = (w.address.charCodeAt(w.address.length - 1) + i) % markets.length;
        edges.push({
            from: wid, to: markets[mIdx].id,
            arrows: 'to',
            color: { color: '#94a3b8' },
            smooth: { type: 'cubicBezier', forceDirection: 'horizontal' }
        });
    });

    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR', // Left to Right
                sortMethod: 'directed',
                nodeSpacing: 100,
                levelSeparation: 250
            }
        },
        physics: false, // Static hierarchical
        interaction: { hover: true, zoomView: true, dragView: true }
    };

    if (network) network.destroy();
    network = new vis.Network(container, { nodes, edges }, options);

    network.on("click", (p) => {
        if (p.nodes.length) {
            const w = whales.find(x => `w_${x.address}` === p.nodes[0]);
            if (w) showDetails(w);
        } else closePanel();
    });
}

// Helpers
function showDetails(w) {
    const p = document.getElementById('details-panel');
    const c = document.getElementById('panelContent');
    if (p && c) {
        p.classList.remove('hidden');
        c.innerHTML = `<h3>${w.address}</h3><p>Profit: ${formatCurrency(w.profit)}</p>`;
    }
}
function closePanel() { document.getElementById('details-panel')?.classList.add('hidden'); }
window.closePanel = closePanel;

function formatCurrency(v) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v); }

function renderTable(data) {
    const t = document.getElementById('opportunitiesTable');
    if (t) t.innerHTML = data.map((d, i) => `<tr><td>${i + 1}</td><td>${d.question}</td><td>${(d.yes_price * 100).toFixed(0)}%</td><td>Match</td></tr>`).join('');
}
function renderWhaleTable(data) {
    const t = document.getElementById('whalesTable');
    if (t) t.innerHTML = data.map((w, i) => `<tr><td>${i + 1}</td><td>${w.address.substring(0, 6)}...</td><td>${formatCurrency(w.profit)}</td></tr>`).join('');
}
window.toggleInfo = () => document.getElementById('info-modal')?.classList.toggle('hidden');
window.switchTab = (id) => {
    document.querySelectorAll('.view-panel').forEach(e => e.classList.add('hidden'));
    document.getElementById(`view-${id}`)?.classList.remove('hidden');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Activate logic simplified
};
