// UI Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        button.classList.add('active');
        const target = button.dataset.target;
        if(target === 'all') {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('active'));
        } else {
            document.getElementById(target).classList.add('active');
        }
        
        // Plotly charts render small if initialized in a hidden tab. Resize them here!
        setTimeout(() => {
            ['gpsChart', 'ggChart', 'heatmapChart', 'focChart'].forEach(id => {
                const el = document.getElementById(id);
                if (el) Plotly.Plots.resize(el);
            });
        }, 10);
    });
});

// --- uPlot Configuration & Helpers ---
const UPLOT_POINTS = 200;
const uplotX = Array.from({length: UPLOT_POINTS}, (_, i) => i);

const uPlots = [];
const ro = new ResizeObserver(entries => {
    for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const plot = uPlots.find(p => p.root.parentNode === entry.target);
        if(plot) plot.setSize({width: Math.max(100, width), height: Math.max(100, height)});
    }
});

function makeUPlotOpts(seriesConfigs, extraOpts = {}) {
    return {
        width: 400, height: 200,
        axes: [
            { show: false },
            { stroke: "#94a3b8", grid: { stroke: "rgba(255, 255, 255, 0.05)" } }
        ],
        legend: { show: false },
        cursor: { show: false },
        scales: { x: { time: false } },
        series: [ {}, ...seriesConfigs ],
        ...extraOpts
    };
}

function initUPlot(containerId, opts, initialData) {
    const canvas = document.getElementById(containerId);
    if(canvas && canvas.tagName === 'CANVAS') {
        const container = canvas.parentNode;
        container.innerHTML = ''; // Remove canvas
        const plot = new uPlot(opts, initialData, container);
        uPlots.push(plot);
        ro.observe(container);
        return plot;
    }
    return null;
}

// 1. RPM & Speed (uPlot)
const rpmData = [ [...uplotX], Array(UPLOT_POINTS).fill(0) ];
const rpmPlot = initUPlot('rpmChart', makeUPlotOpts([ { stroke: '#38bdf8', width: 3, fill: 'rgba(56, 189, 248, 0.1)' } ]), rpmData);

const speedData = [ [...uplotX], Array(UPLOT_POINTS).fill(0) ];
const speedPlot = initUPlot('speedChart', makeUPlotOpts([ { stroke: '#f43f5e', width: 3, fill: 'rgba(244, 63, 94, 0.1)' } ]), speedData);

// 2. Motor (Id, Iq) (uPlot)
const motorData = [ [...uplotX], Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0) ];
const motorPlot = initUPlot('motorChart', makeUPlotOpts([
    { stroke: '#c084fc', width: 2, label: 'Id' },
    { stroke: '#f472b6', width: 2, label: 'Iq' }
], { legend: { show: true } }), motorData);

// 3. Voltage (uPlot)
const voltageData = [ [...uplotX], Array(UPLOT_POINTS).fill(0) ];
const voltagePlot = initUPlot('voltageChart', makeUPlotOpts([ { stroke: '#facc15', width: 3, fill: 'rgba(250, 204, 21, 0.1)' } ]), voltageData);

// 4. IMU (ax, ay, az) (uPlot)
const imuData = [ 
    [...uplotX], 
    Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0), // Filtered
    Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0)  // Raw
];
const imuPlot = initUPlot('imuChart', makeUPlotOpts([
    { stroke: '#ef4444', width: 3, label: 'ax' },
    { stroke: '#22c55e', width: 3, label: 'ay' },
    { stroke: '#3b82f6', width: 3, label: 'az' },
    { stroke: 'rgba(239, 68, 68, 0.3)', width: 1, label: 'ax(raw)', dash: [5,5] },
    { stroke: 'rgba(34, 197, 94, 0.3)', width: 1, label: 'ay(raw)', dash: [5,5] },
    { stroke: 'rgba(59, 130, 246, 0.3)', width: 1, label: 'az(raw)', dash: [5,5] }
], { legend: { show: true } }), imuData);

// 8. Thermal History Chart (uPlot)
const THERMAL_POINTS = 500;
const thermalsX = Array.from({length: THERMAL_POINTS}, (_, i) => i);
const thermalsData = [ [...thermalsX], Array(THERMAL_POINTS).fill(0), Array(THERMAL_POINTS).fill(0), Array(THERMAL_POINTS).fill(0) ];
const thermalsPlot = initUPlot('thermalsChart', makeUPlotOpts([
    { stroke: '#ef4444', width: 2, fill: 'rgba(239, 68, 68, 0.1)', label: 'Motor' },
    { stroke: '#f97316', width: 2, fill: 'rgba(249, 115, 22, 0.1)', label: 'Inverter' },
    { stroke: '#38bdf8', width: 2, fill: 'rgba(56, 189, 248, 0.1)', label: 'Battery' }
], { legend: { show: true }, scales: { x: {time: false}, y: {range: [20, 100]} }, axes: [{show:false}, {stroke:"#94a3b8", grid:{stroke:"rgba(255,255,255,0.05)"}, values: (u, vals) => vals.map(v => v.toFixed(0)) }] }), thermalsData);

// 9. Driver Chart (uPlot)
const driverData = [ [...uplotX], Array(UPLOT_POINTS).fill(0), Array(UPLOT_POINTS).fill(0) ];
const driverPlot = initUPlot('driverChart', makeUPlotOpts([
    { stroke: '#22c55e', width: 2, label: 'Throttle' },
    { stroke: '#ef4444', width: 2, label: 'Brake' }
], { scales: { x: {time:false}, y: {range: [0, 100]} } }), driverData);

// --- Plotly.js (WebGL) Configuration ---
const layoutCommon = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: "'Inter', sans-serif" },
    margin: { t: 10, b: 20, l: 30, r: 10 },
    showlegend: false
};

// 5. GPS (Plotly - scattergl)
const gpsData = [
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: 'rgba(16, 185, 129, 0.3)', size: 3 }, name: 'History' },
    { x: [], y: [], mode: 'lines+markers', type: 'scattergl', line: { color: '#3b82f6', width: 4 }, marker: { size: 6, color: '#3b82f6' }, name: 'Heading' },
    { x: [], y: [], mode: 'lines', type: 'scattergl', line: { color: '#f59e0b', width: 3, dash: 'dash' }, name: 'Steering' }
];
const gpsLayout = { ...layoutCommon, xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, scaleanchor: 'x', scaleratio: 1 } };
Plotly.newPlot('gpsChart', gpsData, gpsLayout, {responsive: true, displayModeBar: false});

// 6. G-G Diagram (Plotly - scattergl)
const ggData = [
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: 'rgba(59, 130, 246, 0.3)', size: 4 } },
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: '#ffffff', size: 10, line: {color: '#3b82f6', width: 2} } }
];
const ggLayout = { ...layoutCommon, xaxis: { gridcolor: 'rgba(255,255,255,0.1)', range: [-5, 5] }, yaxis: { gridcolor: 'rgba(255,255,255,0.1)', range: [-5, 5] } };
Plotly.newPlot('ggChart', ggData, ggLayout, {responsive: true, displayModeBar: false});

// 7. Speed Heatmap (Plotly - scattergl)
const heatmapData = [
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: [], colorscale: 'Jet', cmin: 0, cmax: 120, size: 5 } },
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: '#ffffff', size: 12, line: {color: '#111827', width: 3} } }
];
const heatmapLayout = { ...layoutCommon, xaxis: { gridcolor: 'rgba(255,255,255,0.05)', range: [-300, 300] }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)', range: [-300, 300], scaleanchor: 'x', scaleratio: 1 } };
Plotly.newPlot('heatmapChart', heatmapData, heatmapLayout, {responsive: true, displayModeBar: false});

// 10. FOC Chart (Plotly - scattergl)
const focData = [
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: '#c084fc', size: 4 }, name: 'Id' },
    { x: [], y: [], mode: 'markers', type: 'scattergl', marker: { color: '#f472b6', size: 4 }, name: 'Iq' }
];
const focLayout = { ...layoutCommon, showlegend: true, xaxis: { gridcolor: 'rgba(255,255,255,0.05)', range: [0, 12000] }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)', range: [-300, 300] } };
Plotly.newPlot('focChart', focData, focLayout, {responsive: true, displayModeBar: false});

// ----------------------------------------------------
// 재생 큐 (Playout Queue) 및 상태 변수
// ----------------------------------------------------
let playoutQueue = [];
let latestData = { rpm:0, speed:0, id:0, iq:0, pack_voltage:0, ax:0, ay:0, az:9.81, gps1_lat:0, gps1_lon:0 };

const alpha = 0.15; 
let emaAx = 0, emaAy = 0, emaAz = 9.81;

let currentHeading = null;
let lastTimestamp = 0;
let renderCounter = 0;

let gpsHistoryX = [];
let gpsHistoryY = [];
let heatmapColor = [];
let ggHistoryX = [];
let ggHistoryY = [];
let focHistoryX = [];
let focHistoryId = [];
let focHistoryIq = [];

function updateUPlotData(dataArray, newValues) {
    for (let i = 0; i < newValues.length; i++) {
        dataArray[i+1].push(newValues[i]);
        dataArray[i+1].shift();
    }
}

// 20Hz (50ms) 렌더링 루프
setInterval(() => {
    if (playoutQueue.length > 0) {
        latestData = playoutQueue.shift();
        
        emaAx = (alpha * latestData.ax) + ((1 - alpha) * emaAx);
        emaAy = (alpha * latestData.ay) + ((1 - alpha) * emaAy);
        emaAz = (alpha * latestData.az) + ((1 - alpha) * emaAz);

        // UI 텍스트 즉시 업데이트
        document.getElementById('rpm-value').textContent = latestData.rpm;
        document.getElementById('speed-value').textContent = latestData.speed.toFixed(1);
        document.getElementById('id-value').textContent = latestData.id.toFixed(1);
        document.getElementById('iq-value').textContent = latestData.iq.toFixed(1);
        document.getElementById('v-value').textContent = latestData.pack_voltage.toFixed(1);
        document.getElementById('ax-value').textContent = emaAx.toFixed(2);
        document.getElementById('ay-value').textContent = emaAy.toFixed(2);
        document.getElementById('az-value').textContent = emaAz.toFixed(2);
        document.getElementById('lat-value').textContent = latestData.gps1_lat.toFixed(5);
        document.getElementById('lon-value').textContent = latestData.gps1_lon.toFixed(5);
        document.getElementById('gg-lat-value').textContent = emaAy.toFixed(2);
        document.getElementById('gg-lon-value').textContent = emaAx.toFixed(2);
        
        if(document.getElementById('thr-value') && latestData.throttle_pedal !== undefined) {
            document.getElementById('thr-value').textContent = latestData.throttle_pedal.toFixed(0);
            document.getElementById('brk-value').textContent = latestData.brake_pressure.toFixed(0);
            document.getElementById('str-value').textContent = latestData.steering_angle.toFixed(1);
        }
        
        if(latestData.motor_temp !== undefined) {
            document.getElementById('motor-temp-value').textContent = latestData.motor_temp.toFixed(1);
            document.getElementById('inv-temp-value').textContent = latestData.inverter_temp.toFixed(1);
        }
        if(latestData.battery_temp !== undefined) {
            document.getElementById('batt-temp-value').textContent = latestData.battery_temp.toFixed(1);
        }
        if(latestData.soc !== undefined && document.getElementById('soc-value')) {
            document.getElementById('soc-value').textContent = latestData.soc.toFixed(1);
        }
        if (document.getElementById('heatmap-speed-value')) {
            document.getElementById('heatmap-speed-value').textContent = latestData.speed.toFixed(1);
        }

        // GPS 데이터 버퍼링
        if(latestData.gps1_lat && latestData.gps1_lon) {
            const BASE_LAT = 37.5665;
            const BASE_LON = 126.9780;
            const x_meters = (latestData.gps1_lon - BASE_LON) * 88000;
            const y_meters = (latestData.gps1_lat - BASE_LAT) * 111000;
            const x2_meters = (latestData.gps2_lon - BASE_LON) * 88000;
            const y2_meters = (latestData.gps2_lat - BASE_LAT) * 111000;

            gpsHistoryX.push(x_meters);
            gpsHistoryY.push(y_meters);
            heatmapColor.push(latestData.speed);

            if(gpsHistoryX.length > 15000) {
                gpsHistoryX.shift();
                gpsHistoryY.shift();
                heatmapColor.shift();
            }
            
            const dualGpsDx = x_meters - x2_meters;
            const dualGpsDy = y_meters - y2_meters;
            let rawDualGpsHeading = Math.atan2(dualGpsDx, dualGpsDy) * 180 / Math.PI; 

            if (currentHeading === null) {
                currentHeading = rawDualGpsHeading;
                lastTimestamp = latestData.timestamp;
            } else {
                const dt = (latestData.timestamp - lastTimestamp) / 1000.0 || 0.025;
                const gyroYawRate = latestData.gz || 0;
                let angleDiff = rawDualGpsHeading - currentHeading;
                if (angleDiff > 180) angleDiff -= 360;
                if (angleDiff < -180) angleDiff += 360;
                currentHeading = currentHeading + (gyroYawRate * dt) + (0.05 * angleDiff);
                if (currentHeading > 180) currentHeading -= 360;
                if (currentHeading < -180) currentHeading += 360;
                lastTimestamp = latestData.timestamp;
            }

            const headingRad = currentHeading * Math.PI / 180;
            const headingPointX = x_meters + 15 * Math.sin(headingRad);
            const headingPointY = y_meters + 15 * Math.cos(headingRad);

            const steeringRad = (currentHeading + latestData.steering_angle) * Math.PI / 180;
            const steerPointX = x_meters + 15 * Math.sin(steeringRad);
            const steerPointY = y_meters + 15 * Math.cos(steeringRad);
            
            gpsData[0].x = gpsHistoryX.slice(-100);
            gpsData[0].y = gpsHistoryY.slice(-100);
            gpsData[1].x = [x_meters, headingPointX];
            gpsData[1].y = [y_meters, headingPointY];
            gpsData[2].x = [x_meters, steerPointX];
            gpsData[2].y = [y_meters, steerPointY];
            
            gpsLayout.xaxis.range = [x_meters - 30, x_meters + 30];
            gpsLayout.yaxis.range = [y_meters - 30, y_meters + 30];
            gpsLayout.xaxis.autorange = false;
            gpsLayout.yaxis.autorange = false;

            heatmapData[0].x = gpsHistoryX.slice();
            heatmapData[0].y = gpsHistoryY.slice();
            heatmapData[0].marker.color = heatmapColor.slice();
            heatmapData[1].x = [x_meters];
            heatmapData[1].y = [y_meters];
        }

        // Thermals
        if(latestData.motor_temp !== undefined) {
            updateUPlotData(thermalsData, [latestData.motor_temp, latestData.inverter_temp, latestData.battery_temp]);
        }

        // G-G Diagram
        ggHistoryX.push(emaAy);
        ggHistoryY.push(emaAx);
        if(ggHistoryX.length > 100) { ggHistoryX.shift(); ggHistoryY.shift(); }
        ggData[0].x = ggHistoryX.slice();
        ggData[0].y = ggHistoryY.slice();
        ggData[1].x = [emaAy];
        ggData[1].y = [emaAx];

        const rpmEl = document.getElementById('rpm-value');
        if(latestData.rpm > 10000) {
            rpmEl.style.color = '#f43f5e';
            rpmEl.style.textShadow = '0 0 30px rgba(244, 63, 94, 0.6)';
        } else {
            rpmEl.style.color = '#38bdf8';
            rpmEl.style.textShadow = '0 0 30px rgba(56, 189, 248, 0.4)';
        }
    }
    
    // uPlot 데이터 밀어내기
    updateUPlotData(rpmData, [latestData.rpm]);
    updateUPlotData(speedData, [latestData.speed]);
    updateUPlotData(voltageData, [latestData.pack_voltage]);
    updateUPlotData(motorData, [latestData.id, latestData.iq]);
    updateUPlotData(imuData, [emaAx, emaAy, emaAz, latestData.ax, latestData.ay, latestData.az]);
    if(latestData.throttle_pedal !== undefined) {
        updateUPlotData(driverData, [latestData.throttle_pedal, latestData.brake_pressure]);
    }
    
    // FOC Scatter
    focHistoryX.push(latestData.rpm);
    focHistoryId.push(latestData.id);
    focHistoryIq.push(latestData.iq);
    if(focHistoryX.length > 3000) {
        focHistoryX.shift(); focHistoryId.shift(); focHistoryIq.shift();
    }
    focData[0].x = focHistoryX.slice();
    focData[0].y = focHistoryId.slice();
    focData[1].x = focHistoryX.slice();
    focData[1].y = focHistoryIq.slice();
    
    renderCounter++;
    if (renderCounter % 2 === 0) {
        // uPlot 렌더링
        if(rpmPlot) rpmPlot.setData(rpmData);
        if(speedPlot) speedPlot.setData(speedData);
        if(motorPlot) motorPlot.setData(motorData);
        if(voltagePlot) voltagePlot.setData(voltageData);
        if(imuPlot) imuPlot.setData(imuData);
        if(driverPlot) driverPlot.setData(driverData);
        if(thermalsPlot) thermalsPlot.setData(thermalsData);
        
        // Plotly 렌더링
        Plotly.react('gpsChart', gpsData, gpsLayout);
        Plotly.react('ggChart', ggData, ggLayout);
        Plotly.react('heatmapChart', heatmapData, heatmapLayout);
        Plotly.react('focChart', focData, focLayout);
    }
}, 50);

// WebSocket
const WS_URL = 'wss://gef27test.store/ws?token=GBungE-FSAE-token';
const statusBadge = document.getElementById('connection-status');
const statusText = statusBadge.querySelector('.status-text');
let ws;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => { statusBadge.className = 'status-badge connected'; statusText.textContent = 'LIVE'; };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if(Array.isArray(data)) {
                for (const frame of data) {
                    if (frame.rpm !== undefined) playoutQueue.push(frame);
                }
                if (playoutQueue.length > 20) playoutQueue = playoutQueue.slice(playoutQueue.length - 20);
            }
        } catch (e) {}
    };
    ws.onclose = () => {
        statusBadge.className = 'status-badge disconnected'; statusText.textContent = 'RECONNECTING...';
        setTimeout(connectWebSocket, 3000);
    };
}
connectWebSocket();
