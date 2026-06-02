// Chart Configuration
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
        x: { display: false },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, grace: '10%' }
    },
    elements: { point: { radius: 0 } }
};

const createChart = (ctxId, datasets, extraOptions={}) => {
    return new Chart(document.getElementById(ctxId).getContext('2d'), {
        type: 'line',
        data: { labels: Array(200).fill(''), datasets: datasets },
        options: { ...commonOptions, ...extraOptions }
    });
};

// 1. RPM & Speed
const rpmChart = createChart('rpmChart', [{ data: Array(200).fill(0), borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 3, fill: true, tension: 0.3 }]);
const speedChart = createChart('speedChart', [{ data: Array(200).fill(0), borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.1)', borderWidth: 3, fill: true, tension: 0.3 }]);

// 2. Motor (Id, Iq)
const motorChart = createChart('motorChart', [
    { label: 'Id', data: Array(200).fill(0), borderColor: '#c084fc', borderWidth: 2, tension: 0.2 },
    { label: 'Iq', data: Array(200).fill(0), borderColor: '#f472b6', borderWidth: 2, tension: 0.2 }
], { plugins: { legend: { display: true, position: 'top', labels: {color:'#fff'} } } });

// 3. Voltage
const voltageChart = createChart('voltageChart', [{ data: Array(200).fill(0), borderColor: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 3, fill: true, tension: 0.3 }]);

// 4. IMU (ax, ay, az) - Raw & Filtered
const imuChart = createChart('imuChart', [
    // Filtered (Bold)
    { label: 'ax', data: Array(200).fill(0), borderColor: '#ef4444', borderWidth: 3, tension: 0.2 },
    { label: 'ay', data: Array(200).fill(0), borderColor: '#22c55e', borderWidth: 3, tension: 0.2 },
    { label: 'az', data: Array(200).fill(0), borderColor: '#3b82f6', borderWidth: 3, tension: 0.2 },
    // Raw (Faint & Dashed)
    { label: 'ax (raw)', data: Array(200).fill(0), borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1, borderDash: [5, 5], tension: 0 },
    { label: 'ay (raw)', data: Array(200).fill(0), borderColor: 'rgba(34, 197, 94, 0.3)', borderWidth: 1, borderDash: [5, 5], tension: 0 },
    { label: 'az (raw)', data: Array(200).fill(0), borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, borderDash: [5, 5], tension: 0 }
], { plugins: { legend: { display: true, position: 'top', labels: {color:'#fff', usePointStyle: true} } } });

// 5. GPS (Scatter map approach)
const gpsChart = new Chart(document.getElementById('gpsChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'Circuit History',
                data: [], 
                backgroundColor: 'rgba(16, 185, 129, 0.2)', // Faint green for past path
                pointRadius: 2,
                borderWidth: 0
            },
            {
                label: 'Current Position',
                data: [], 
                backgroundColor: '#10b981', // Bright green for current car
                borderColor: '#ffffff',
                pointRadius: 6,
                borderWidth: 2
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, type: 'linear', position: 'bottom' },
            y: { grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }
});


// ----------------------------------------------------
// 재생 큐 (Playout Queue) 및 상태 변수
// ----------------------------------------------------
let playoutQueue = [];
let latestData = { rpm:0, speed:0, id:0, iq:0, pack_voltage:0, ax:0, ay:0, az:9.81, gps1_lat:0, gps1_lon:0 };

// Causal Filter (EMA) Variables
const alpha = 0.15; // 0.15: 부드러움, 1.0: 원본 데이터
let emaAx = 0, emaAy = 0, emaAz = 9.81;

// 10Hz (100ms) 렌더링 루프 - 버퍼에서 하나씩 꺼내서 그린다!
setInterval(() => {
    // 큐에 데이터가 있으면 하나 꺼낸다.
    // 만약 없으면 통신 지연이 길어진 것이므로 가장 최근 값(latestData)을 그대로 유지한다.
    if (playoutQueue.length > 0) {
        latestData = playoutQueue.shift();
        
        // Causal Filter (EMA) 연산을 여기서 수행
        emaAx = (alpha * latestData.ax) + ((1 - alpha) * emaAx);
        emaAy = (alpha * latestData.ay) + ((1 - alpha) * emaAy);
        emaAz = (alpha * latestData.az) + ((1 - alpha) * emaAz);

        // UI 텍스트 즉시 업데이트
        document.getElementById('rpm-value').textContent = latestData.rpm;
        document.getElementById('speed-value').textContent = latestData.speed;
        document.getElementById('id-value').textContent = latestData.id.toFixed(1);
        document.getElementById('iq-value').textContent = latestData.iq.toFixed(1);
        document.getElementById('v-value').textContent = latestData.pack_voltage.toFixed(1);
        document.getElementById('ax-value').textContent = emaAx.toFixed(2);
        document.getElementById('ay-value').textContent = emaAy.toFixed(2);
        document.getElementById('az-value').textContent = emaAz.toFixed(2);
        document.getElementById('lat-value').textContent = latestData.gps1_lat.toFixed(5);
        document.getElementById('lon-value').textContent = latestData.gps1_lon.toFixed(5);

        // GPS 궤적 캔버스 업데이트
        if(latestData.gps1_lat && latestData.gps1_lon) {
            const history = gpsChart.data.datasets[0].data;
            history.push({x: latestData.gps1_lon, y: latestData.gps1_lat});
            if(history.length > 50000) history.shift(); 
            
            gpsChart.data.datasets[1].data = [{x: latestData.gps1_lon, y: latestData.gps1_lat}];
            gpsChart.update('none');
        }

        // RPM Warning UI 업데이트
        const rpmEl = document.getElementById('rpm-value');
        if(latestData.rpm > 10000) {
            rpmEl.style.color = '#f43f5e';
            rpmEl.style.textShadow = '0 0 30px rgba(244, 63, 94, 0.6)';
            rpmChart.data.datasets[0].borderColor = '#f43f5e';
            rpmChart.data.datasets[0].backgroundColor = 'rgba(244, 63, 94, 0.2)';
        } else {
            rpmEl.style.color = '#38bdf8';
            rpmEl.style.textShadow = '0 0 30px rgba(56, 189, 248, 0.4)';
            rpmChart.data.datasets[0].borderColor = '#38bdf8';
            rpmChart.data.datasets[0].backgroundColor = 'rgba(56, 189, 248, 0.1)';
        }
    }
    
    // 차트 밀어내기 (매 100ms마다 수행)
    rpmChart.data.datasets[0].data.push(latestData.rpm);
    rpmChart.data.datasets[0].data.shift();
    rpmChart.update('none');

    speedChart.data.datasets[0].data.push(latestData.speed);
    speedChart.data.datasets[0].data.shift();
    speedChart.update('none');
    
    voltageChart.data.datasets[0].data.push(latestData.pack_voltage);
    voltageChart.data.datasets[0].data.shift();
    voltageChart.update('none');

    motorChart.data.datasets[0].data.push(latestData.id);
    motorChart.data.datasets[0].data.shift();
    motorChart.data.datasets[1].data.push(latestData.iq);
    motorChart.data.datasets[1].data.shift();
    motorChart.update('none');

    imuChart.data.datasets[0].data.push(emaAx);
    imuChart.data.datasets[0].data.shift();
    imuChart.data.datasets[1].data.push(emaAy);
    imuChart.data.datasets[1].data.shift();
    imuChart.data.datasets[2].data.push(emaAz);
    imuChart.data.datasets[2].data.shift();
    imuChart.data.datasets[3].data.push(latestData.ax);
    imuChart.data.datasets[3].data.shift();
    imuChart.data.datasets[4].data.push(latestData.ay);
    imuChart.data.datasets[4].data.shift();
    imuChart.data.datasets[5].data.push(latestData.az);
    imuChart.data.datasets[5].data.shift();
    imuChart.update('none');

}, 100);

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
            // 서버에서 배열 형태로 5개씩 던져준 프레임을 모두 큐에 넣는다
            if(Array.isArray(data)) {
                for (const frame of data) {
                    if (frame.rpm !== undefined) {
                        playoutQueue.push(frame);
                    }
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
