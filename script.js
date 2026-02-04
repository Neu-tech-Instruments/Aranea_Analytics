// API Configuration
const API_BASE_URL = '/api';

// State
let network = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAll);
    refreshAll();
    setInterval(refreshAll, 30000);
});

async function refreshAll() {
    try {
        await Promise.all([
            loadStats(),
            loadContrarian(),
            loadWhaleGraph()
        ]);
    } catch (e) { console.error("Refresh error", e); }
}

async function loadStats() {
    // Mock or Real Stats
    try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        const data = await res.json();
    } catch { }
}

async function loadContrarian() {
    try {
        const res = await fetch(`${API_BASE_URL}/contrarian?yes_threshold=0.4&volume_threshold=10000`);
        const data = await res.json();
        const opportunities = data.opportunities || data;
        renderTable(opportunities);
    } catch { }
}

async function loadWhaleGraph() {
    try {
        const res = await fetch(`${API_BASE_URL}/whales`);
        const data = await res.json();
        const whales = data.whales || data;
        renderGraph(whales);
        renderWhaleTable(whales);

        // Update Legend Count
        const countSpan = document.getElementById('activeWhalesLegend');
        if (countSpan) countSpan.textContent = whales.length;

    } catch { }
}

// --- SVG Node Generator (The "Enterprise" Look) ---
function createNodeSvg(title, subtitle, color, iconCode) {
    // Colors
    const headerColor = color;
    const borderColor = '#cbd5e1'; // slate-300

    // SVG Dimensions
    const width = 200;
    const height = 70;
    const headerHeight = 24;

    // Icon Font (FontAwesome uni-code needs manual conversion or just use text/emoji for simplicity here? 
    // SVG text doesn't easily support FontAwesome unless webfont is loaded in context. 
    // We'll use simple UTF8 or just text for "M" / "W")

    // However, we can embed the icon if we map code to char.
    // Simpler: Just use colored box.

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <style>
            .title { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; fill: white; }
            .subtitle { font-family: 'Inter', sans-serif; font-size: 11px; fill: #334155; }
            .meta { font-family: 'Inter', sans-serif; font-size: 10px; fill: #94a3b8; }
        </style>
        <!-- Background -->
        <rect x="0" y="0" width="${width}" height="${height}" rx="4" ry="4" fill="white" stroke="${borderColor}" stroke-width="1"/>
        
        <!-- Header -->
        <path d="M0 4 Q0 0 4 0 L${width - 4} 0 Q${width} 0 ${width} 4 L${width} ${headerHeight} L0 ${headerHeight} Z" fill="${headerColor}"/>
        
        <!-- Title -->
        <text x="10" y="16" class="title">${escapeXml(title)}</text>
        
        <!-- Body Content -->
        <text x="10" y="45" class="subtitle">${escapeXml(subtitle)}</text>
        
        <!-- Bottom Meta -->
        <text x="10" y="60" class="meta">Active Pipeline</text>
        
        <!-- Menu Dots -->
        <circle cx="${width - 15}" cy="12" r="2" fill="white" opacity="0.8"/>
        <circle cx="${width - 9}" cy="12" r="2" fill="white" opacity="0.8"/>
        <circle cx="${width - 3}" cy="12" r="2" fill="white" opacity="0.8"/>
    </svg>
    `;

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function renderGraph(whales) {
    const container = document.getElementById('whale-graph');
    if (!container) return;

    const nodes = [];
    const edges = [];

    // 1. Markets (Purple/Blue)
    const markets = [
        { id: 'm_1', name: 'US Election 2024', val: '$5.2M', color: '#8b5cf6' }, // Purple
        { id: 'm_2', name: 'Bitcoin > $100k', val: '$2.1M', color: '#f97316' },  // Orange
        { id: 'm_3', name: 'Fed Rates', val: '$1.5M', color: '#3b82f6' },        // Blue
        { id: 'm_4', name: 'Dune 2 Office', val: '$800k', color: '#10b981' }     // Green
    ];

    markets.forEach((m, idx) => {
        nodes.push({
            id: m.id,
            shape: 'image',
            image: createNodeSvg(m.name, `Vol: ${m.val}`, m.color),
            size: 40, // Vis.js scales images? No, 'size' scales it. 
            // Actually 'image' shape uses size to determine width?
            // "The size is used to determine the size of the image."
            // We want fixed size. shapeProperties.useImageSize = true?
            shapeProperties: { useImageSize: false }, // Let's rely on size
            fixed: { y: idx % 2 === 0 ? -100 : 100 },
            font: { size: 0, color: 'transparent' } // Hide label
        });
    });

    // 2. Whales (Orange/Gray)
    whales.forEach((whale, idx) => {
        const address = whale.address.substring(0, 6) + '...';
        const wins = whale.contrarian_wins || 0;
        const profit = formatCurrency(whale.profit);
        const whaleId = `w_${whale.address}`;

        nodes.push({
            id: whaleId,
            shape: 'image',
            image: createNodeSvg(`Whale ${address}`, `Profit: ${profit}`, '#f59e0b'), // Orange
            size: 30,
            font: { size: 0 }
        });

        // Edges: Orthogonal lines look more Enterprise? Vis.js supports 'smooth': { type: 'cubicBezier' } or 'straightCross'?
        // 'horizontal' / 'vertical' needs hierarchical.
        const marketIndex = (address.charCodeAt(address.length - 1) + idx) % markets.length;
        edges.push({
            from: whaleId,
            to: markets[marketIndex].id,
            color: { color: '#cbd5e1' },
            width: 1.5,
            arrows: { to: { enabled: true, scaleFactor: 0.5, type: 'arrow' } },
            smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
        });
    });

    const options = {
        nodes: {
            borderWidth: 0,
            size: 100 // Default size logic for images might need tuning
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'hubsize',
                levelSeparation: 300,
                nodeSpacing: 150
            }
        },
        physics: {
            enabled: false // Static layout looks cleaner for Diagrams
        },
        interaction: { hover: true, dragNodes: true, zoomView: true, dragView: true }
    };

    if (network) network.destroy();
    network = new vis.Network(container, { nodes, edges }, options);

    // Fit view
    network.once('afterDrawing', () => network.fit());

    // Click
    network.on('click', (p) => {
        if (p.nodes.length) {
            const nid = p.nodes[0];
            const whale = whales.find(w => `w_${w.address}` === nid);
            if (whale) showDetails(whale);
        } else {
            closePanel();
        }
    });
}


function showDetails(whale) {
    const panel = document.getElementById('details-panel');
    const content = document.getElementById('panelContent');
    const title = document.getElementById('panelTitle');
    if (panel) {
        panel.classList.remove('hidden');
        if (title) title.textContent = "Whale Metadata";
        // JSON View style
        content.innerHTML = `
            <div style="font-family:monospace; font-size:12px; color:#334155;">
                <div style="margin-bottom:8px;"><strong>ID:</strong> ${whale.address}</div>
                <div style="margin-bottom:8px;"><strong>Strategy:</strong> ${whale.strategies?.[0]}</div>
                <div style="margin-bottom:8px;"><strong>Win Rate:</strong> ${(whale.win_rate * 100).toFixed(1)}%</div>
                <div style="margin-bottom:8px;"><strong>PnL:</strong> ${formatCurrency(whale.profit)}</div>
                <div style="margin-top:16px; padding-top:16px; border-top:1px solid #e2e8f0;">
                    <strong>Active Transforms:</strong><br>
                    <span class="badge" style="background:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px;">Filter: >85% Bias</span>
                    <span class="badge" style="background:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px;">Join: Market Data</span>
                </div>
            </div>
        `;
    }
}

function closePanel() {
    const p = document.getElementById('details-panel');
    if (p) p.classList.add('hidden');
    if (network) network.unselectAll();
}
window.closePanel = closePanel;
window.switchTab = (t) => {
    // Basic Tab switching
    document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tb => tb.classList.remove('active'));

    document.getElementById(`view-${t}`).classList.remove('hidden');
    // Simplified active state logic (assuming clicked element handling or global update)
};
window.toggleInfo = () => {
    const m = document.getElementById('info-modal');
    m.classList.toggle('hidden');
};

function renderTable(data) {
    const t = document.getElementById('opportunitiesTable');
    if (!t) return;
    t.innerHTML = data.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="font-weight:500">${d.question}</td>
            <td>${d.yes_price ? (d.yes_price * 100).toFixed(1) + '%' : '-'}</td>
            <td><span class="badge" style="background:#f1f5f9; color:#64748b; padding:2px 6px;">${d.category}</span></td>
        </tr>
    `).join('');
}
function renderWhaleTable(data) {
    const t = document.getElementById('whalesTable');
    if (!t) return;
    t.innerHTML = data.map((w, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${w.address.substring(0, 8)}...</td>
            <td>${w.contrarian_wins}</td>
            <td>${formatCurrency(w.profit)}</td>
        </tr>
    `).join('');
}

function formatCurrency(v) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}
