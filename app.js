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
    });
});

// Chart.js Configuration (for scatter plots)
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

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
    const container = canvas.parentNode;
    container.innerHTML = ''; // Remove Chart.js canvas
    const plot = new uPlot(opts, initialData, container);
    uPlots.push(plot);
    ro.observe(container);
    return plot;
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

// 5. GPS (Chart.js - Scatter)
const gpsChart = new Chart(document.getElementById('gpsChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            { label: 'Circuit History', data: [], backgroundColor: 'rgba(16, 185, 129, 0.2)', pointRadius: 2, borderWidth: 0 },
            { label: 'Current Heading', data: [], backgroundColor: '#3b82f6', borderColor: '#3b82f6', showLine: true, pointRadius: 0, borderWidth: 4 },
            { label: 'Steering Vector', data: [], borderColor: '#f59e0b', borderDash: [5, 5], showLine: true, pointRadius: 0, borderWidth: 3 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, type: 'linear', position: 'bottom' }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
});

// 6. G-G Diagram (Chart.js - Scatter)
const ggChart = new Chart(document.getElementById('ggChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            { label: 'G History', data: [], backgroundColor: 'rgba(59, 130, 246, 0.2)', pointRadius: 2, borderWidth: 0 },
            { label: 'Current G', data: [], backgroundColor: '#3b82f6', borderColor: '#ffffff', pointRadius: 6, borderWidth: 2 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, type: 'linear', min: -5, max: 5 }, y: { grid: { color: 'rgba(255,255,255,0.1)' }, type: 'linear', min: -5, max: 5 } }
    }
});

// 7. Speed Heatmap (Chart.js - Scatter)
const heatmapChart = new Chart(document.getElementById('heatmapChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            { label: 'Speed Heatmap', data: [], backgroundColor: [], pointRadius: 4, borderWidth: 0 },
            { label: 'Current Position', data: [], backgroundColor: '#ffffff', borderColor: '#111827', pointRadius: 12, borderWidth: 3 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } },
        scales: { x: { type: 'linear', min: -300, max: 300, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { type: 'linear', min: -250, max: 250, grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
});

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

// 10. FOC Chart (Chart.js - Scatter)
const focChart = new Chart(document.getElementById('focChart').getContext('2d'), {
    type: 'scatter',
    data: { datasets: [{ label: 'Id', data: [] }, { label: 'Iq', data: [] }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false }
});

// ----------------------------------------------------
// 재생 큐 (Playout Queue) 및 상태 변수
// ----------------------------------------------------
let playoutQueue = [];
let latestData = { rpm:0, speed:0, id:0, iq:0, pack_voltage:0, ax:0, ay:0, az:9.81, gps1_lat:0, gps1_lon:0 };

// Causal Filter (EMA) Variables
const alpha = 0.15; // 0.15: 부드러움, 1.0: 원본 데이터
let emaAx = 0, emaAy = 0, emaAz = 9.81;

let currentHeading = null;
let lastTimestamp = 0;
let renderCounter = 0;

function updateUPlotData(dataArray, newValues) {
    for (let i = 0; i < newValues.length; i++) {
        dataArray[i+1].push(newValues[i]);
        dataArray[i+1].shift();
    }
}

// 20Hz (50ms) 렌더링 루프 - 버퍼에서 하나씩 꺼내서 그린다!
setInterval(() => {
    if (playoutQueue.length > 0) {
        latestData = playoutQueue.shift();
        
        // Causal Filter (EMA) 연산을 여기서 수행
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
        
        // Thermals & Battery
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

        // GPS 궤적 캔버스 업데이트
        if(latestData.gps1_lat && latestData.gps1_lon) {
            const BASE_LAT = 37.5665;
            const BASE_LON = 126.9780;
            const x_meters = (latestData.gps1_lon - BASE_LON) * 88000;
            const y_meters = (latestData.gps1_lat - BASE_LAT) * 111000;
            const x2_meters = (latestData.gps2_lon - BASE_LON) * 88000;
            const y2_meters = (latestData.gps2_lat - BASE_LAT) * 111000;

            const history = gpsChart.data.datasets[0].data;
            history.push({x: x_meters, y: y_meters});
            if(history.length > 15000) history.shift(); 
            
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

            const headingAngle = currentHeading;
            const headingRad = headingAngle * Math.PI / 180;
            const h_len = 15; 
            const headingPointX = x_meters + h_len * Math.sin(headingRad);
            const headingPointY = y_meters + h_len * Math.cos(headingRad);

            gpsChart.data.datasets[1].data = [ {x: x_meters, y: y_meters}, {x: headingPointX, y: headingPointY} ];
            gpsChart.data.datasets[1].pointStyle = 'circle';
            gpsChart.data.datasets[1].rotation = 0;

            const steeringAngleDeg = headingAngle + latestData.steering_angle;
            const steeringRad = steeringAngleDeg * Math.PI / 180;
            const v_len = 15; 
            const steerPointX = x_meters + v_len * Math.sin(steeringRad);
            const steerPointY = y_meters + v_len * Math.cos(steeringRad);
            
            gpsChart.data.datasets[2].data = [ {x: x_meters, y: y_meters}, {x: steerPointX, y: steerPointY} ];

            gpsChart.options.scales.x.min = x_meters - 30;
            gpsChart.options.scales.x.max = x_meters + 30;
            gpsChart.options.scales.y.min = y_meters - 30;
            gpsChart.options.scales.y.max = y_meters + 30;

            let t = Math.max(0, Math.min(1, latestData.speed / 120.0));
            t = Math.pow(t, 3.0);
            let hue = 240 - t * 240;
            const color = `hsl(${hue}, 100%, 50%)`;

            heatmapChart.data.datasets[0].data.push({x: x_meters, y: y_meters});
            heatmapChart.data.datasets[0].backgroundColor.push(color);
            if(heatmapChart.data.datasets[0].data.length > 15000) {
                heatmapChart.data.datasets[0].data.shift();
                heatmapChart.data.datasets[0].backgroundColor.shift();
            }

            heatmapChart.data.datasets[1].data = [{x: x_meters, y: y_meters}];
            heatmapChart.data.datasets[1].backgroundColor = color; 

            gpsChart.update('none');
            heatmapChart.update('none');
            ggChart.update('none');
        }

        // Thermal History Chart 업데이트 (uPlot)
        if(latestData.motor_temp !== undefined) {
            updateUPlotData(thermalsData, [latestData.motor_temp, latestData.inverter_temp, latestData.battery_temp]);
        }

        // G-G Diagram 데이터 푸시 (Chart.js)
        const ggHistory = ggChart.data.datasets[0].data;
        ggHistory.push({x: emaAy, y: emaAx});
        if(ggHistory.length > 100) ggHistory.shift();
        ggChart.data.datasets[1].data = [{x: emaAy, y: emaAx}];

        // RPM Warning UI 업데이트
        const rpmEl = document.getElementById('rpm-value');
        if(latestData.rpm > 10000) {
            rpmEl.style.color = '#f43f5e';
            rpmEl.style.textShadow = '0 0 30px rgba(244, 63, 94, 0.6)';
        } else {
            rpmEl.style.color = '#38bdf8';
            rpmEl.style.textShadow = '0 0 30px rgba(56, 189, 248, 0.4)';
        }
    }
    
    // 차트 데이터 밀어내기 (uPlot)
    updateUPlotData(rpmData, [latestData.rpm]);
    updateUPlotData(speedData, [latestData.speed]);
    updateUPlotData(voltageData, [latestData.pack_voltage]);
    updateUPlotData(motorData, [latestData.id, latestData.iq]);
    updateUPlotData(imuData, [emaAx, emaAy, emaAz, latestData.ax, latestData.ay, latestData.az]);
    if(latestData.throttle_pedal !== undefined) {
        updateUPlotData(driverData, [latestData.throttle_pedal, latestData.brake_pressure]);
    }
    
    // FOC Scatter Data Push (Chart.js)
    focChart.data.datasets[0].data.push({x: latestData.rpm, y: latestData.id});
    focChart.data.datasets[1].data.push({x: latestData.rpm, y: latestData.iq});
    if(focChart.data.datasets[0].data.length > 3000) {
        focChart.data.datasets[0].data.shift();
        focChart.data.datasets[1].data.shift();
    }
    
    renderCounter++;
    if (renderCounter % 2 === 0) {
        // uPlot 일괄 렌더링
        rpmPlot.setData(rpmData);
        speedPlot.setData(speedData);
        motorPlot.setData(motorData);
        voltagePlot.setData(voltageData);
        imuPlot.setData(imuData);
        driverPlot.setData(driverData);
        thermalsPlot.setData(thermalsData);
        
        focChart.update('none');
    }

}, 50);

// ----------------------------------------------------
// WebSocket Connection
// ----------------------------------------------------
const WS_URL = 'wss://gef27test.store/ws?token=GBungE-FSAE-token';
const statusBadge = document.getElementById('connection-status');
const statusText = statusBadge.querySelector('.status-text');
let ws;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
        statusBadge.className = 'status-badge connected';
        statusText.textContent = 'LIVE';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if(Array.isArray(data)) {
                for (const frame of data) {
                    if (frame.rpm !== undefined) {
                        playoutQueue.push(frame);
                    }
                }
                if (playoutQueue.length > 20) {
                    playoutQueue = playoutQueue.slice(playoutQueue.length - 20);
                }
            }
        } catch (e) { console.error(e); }
    };

    ws.onclose = () => {
        statusBadge.className = 'status-badge disconnected';
        statusText.textContent = 'RECONNECTING...';
        setTimeout(connectWebSocket, 3000);
    };
}
connectWebSocket();
