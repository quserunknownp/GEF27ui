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
                label: 'Current Heading',
                data: [], 
                backgroundColor: '#3b82f6', // 파란색 
                borderColor: '#3b82f6',
                showLine: true,
                pointRadius: 0,
                borderWidth: 4
            },
            {
                label: 'Steering Vector',
                data: [],
                borderColor: '#f59e0b', // Orange for steering
                borderDash: [5, 5],
                showLine: true,
                pointRadius: 0,
                borderWidth: 3
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

// 6. G-G Diagram (Traction Circle)
const ggChart = new Chart(document.getElementById('ggChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'G History',
                data: [], 
                backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                pointRadius: 2,
                borderWidth: 0
            },
            {
                label: 'Current G',
                data: [], 
                backgroundColor: '#3b82f6',
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
            x: { grid: { color: 'rgba(255,255,255,0.1)' }, type: 'linear', position: 'center', min: -5, max: 5 },
            y: { grid: { color: 'rgba(255,255,255,0.1)' }, type: 'linear', position: 'center', min: -5, max: 5 }
        }
    }
});

// 7. Speed Heatmap
const heatmapChart = new Chart(document.getElementById('heatmapChart').getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'Speed Heatmap',
                data: [],
                backgroundColor: [], // Color will be updated dynamically per point
                pointRadius: 4,
                borderWidth: 0
            },
            {
                label: 'Current Position',
                data: [],
                backgroundColor: '#ffffff',
                borderColor: '#111827', // Dark border for contrast
                pointRadius: 12, // Large dot
                borderWidth: 3
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { type: 'linear', position: 'bottom', display: true, min: -600, max: 600, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { type: 'linear', display: true, min: -600, max: 600, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }
});

// 8. Thermal History Chart (Multi-line)
const thermalsChart = new Chart(document.getElementById('thermalsChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Motor Temp (°C)', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true },
            { label: 'Inverter Temp (°C)', data: [], borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true },
            { label: 'Battery Temp (°C)', data: [], borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: true, position: 'top', labels: { color: '#f8fafc', font: {size: 14} } } },
        scales: {
            x: { display: false },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 20, max: 100 }
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

// GPS EMA Variables for Heading
let emaDx = 0, emaDy = 1;
let last_x_meters = 0, last_y_meters = 0;

// Complementary Filter Variables
let currentHeading = null;
let lastTimestamp = 0;

let renderCounter = 0;

// 40Hz (25ms) 렌더링 루프 - 버퍼에서 하나씩 꺼내서 그린다!
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

        // Heatmap digital value
        if (document.getElementById('heatmap-speed-value')) {
            document.getElementById('heatmap-speed-value').textContent = latestData.speed.toFixed(1);
        }

        // GPS 궤적 캔버스 업데이트 (Zoom-in 및 Steering Vector 표현)
        if(latestData.gps1_lat && latestData.gps1_lon) {
            // 모든 연산을 완벽한 직교 좌표계(Meters)로 변환하여 벡터 길이 왜곡 방지
            const BASE_LAT = 37.5665;
            const BASE_LON = 126.9780;
            const x_meters = (latestData.gps1_lon - BASE_LON) * 88000;
            const y_meters = (latestData.gps1_lat - BASE_LAT) * 111000;
            const x2_meters = (latestData.gps2_lon - BASE_LON) * 88000;
            const y2_meters = (latestData.gps2_lat - BASE_LAT) * 111000;

            const history = gpsChart.data.datasets[0].data;
            history.push({x: x_meters, y: y_meters});
            if(history.length > 2000) history.shift(); 
            
            // Dual-GPS를 이용한 절대 방위각 계산 (노이즈 포함됨)
            const dualGpsDx = x_meters - x2_meters;
            const dualGpsDy = y_meters - y2_meters;
            let rawDualGpsHeading = Math.atan2(dualGpsDx, dualGpsDy) * 180 / Math.PI; // North=0

            // Causal 상보 필터 (Complementary Filter): Gyro Z (Yaw Rate) + Dual-GPS
            if (currentHeading === null) {
                currentHeading = rawDualGpsHeading;
                lastTimestamp = latestData.timestamp;
            } else {
                const dt = (latestData.timestamp - lastTimestamp) / 1000.0 || 0.025;
                const gyroYawRate = latestData.gz || 0; // dps
                
                // Wrap-around angle difference calculation (-180 to 180)
                let angleDiff = rawDualGpsHeading - currentHeading;
                if (angleDiff > 180) angleDiff -= 360;
                if (angleDiff < -180) angleDiff += 360;
                
                // Complementary Filter (98% Gyro + 2% GPS drift correction)
                // Gyro는 단기적인 진동이 없고 즉각적인 회전을 정확히 잡아내지만, 장기적으로 누적 오차(Drift) 발생
                // GPS는 단기적으로 심하게 흔들리지만, 장기적으로 절대 방향을 보장함
                currentHeading = currentHeading + (gyroYawRate * dt);
                currentHeading = currentHeading + (0.02 * angleDiff);
                
                if (currentHeading > 180) currentHeading -= 360;
                if (currentHeading < -180) currentHeading += 360;
                
                lastTimestamp = latestData.timestamp;
            }

            const headingAngle = currentHeading;

            // Current Car Heading Vector (Blue Line) - 정확히 15미터 길이 고정
            const headingRad = headingAngle * Math.PI / 180;
            const h_len = 15; 
            const headingPointX = x_meters + h_len * Math.sin(headingRad);
            const headingPointY = y_meters + h_len * Math.cos(headingRad);

            gpsChart.data.datasets[1].data = [
                {x: x_meters, y: y_meters},
                {x: headingPointX, y: headingPointY}
            ];
            gpsChart.data.datasets[1].pointStyle = 'circle';
            gpsChart.data.datasets[1].rotation = 0;

            // Steering Vector Overlay - 정확히 15미터 길이 고정
            const steeringAngleDeg = headingAngle + latestData.steering_angle;
            const steeringRad = steeringAngleDeg * Math.PI / 180;
            const v_len = 15; 
            const steerPointX = x_meters + v_len * Math.sin(steeringRad);
            const steerPointY = y_meters + v_len * Math.cos(steeringRad);
            
            gpsChart.data.datasets[2].data = [
                {x: x_meters, y: y_meters},
                {x: steerPointX, y: steerPointY}
            ];

            // Local Zoom-in Bounds (차량 반경 30m 1:1 고정)
            gpsChart.options.scales.x.min = x_meters - 30;
            gpsChart.options.scales.x.max = x_meters + 30;
            gpsChart.options.scales.y.min = y_meters - 30;
            gpsChart.options.scales.y.max = y_meters + 30;

            // gpsChart.update()는 하단에서 일괄 처리

            // Speed Heatmap 업데이트 (미터 환산 완료된 좌표 사용)
            // 차속 범위가 좁아도(예: 40~60) 색상 대비가 극적으로 일어나도록 아주 가파른 Logistic Sigmoid 함수 적용
            // Sigmoid: 1 / (1 + e^-k(x - x0))
            let x = latestData.speed / 100.0;
            let t = 1.0 / (1.0 + Math.exp(-25.0 * (x - 0.5)));
            
            let hue = 240 - t * 240;
            const color = `hsl(${hue}, 100%, 50%)`;

            heatmapChart.data.datasets[0].data.push({x: x_meters, y: y_meters});
            heatmapChart.data.datasets[0].backgroundColor.push(color);
            if(heatmapChart.data.datasets[0].data.length > 2000) {
                heatmapChart.data.datasets[0].data.shift();
                heatmapChart.data.datasets[0].backgroundColor.shift();
            }

            // 히트맵 상의 현재 차량 위치 크게 강조
            heatmapChart.data.datasets[1].data = [{x: x_meters, y: y_meters}];
            heatmapChart.data.datasets[1].backgroundColor = color; // 현재 속도 색상 반영

            // 실시간 부드러움이 필요한 위치/궤적 차트는 40Hz로 매 프레임 업데이트
            gpsChart.update('none');
            heatmapChart.update('none');
            ggChart.update('none');
        }

        // Thermal History Chart 업데이트
        if(latestData.motor_temp !== undefined) {
            const labels = thermalsChart.data.labels;
            labels.push('');
            thermalsChart.data.datasets[0].data.push(latestData.motor_temp);
            thermalsChart.data.datasets[1].data.push(latestData.inverter_temp);
            thermalsChart.data.datasets[2].data.push(latestData.battery_temp);
            
            if(labels.length > 500) { // 약 50초 분량 히스토리
                labels.shift();
                thermalsChart.data.datasets[0].data.shift();
                thermalsChart.data.datasets[1].data.shift();
                thermalsChart.data.datasets[2].data.shift();
            }
        }

        // G-G Diagram 데이터 푸시 (업데이트는 위에서 40Hz로 처리)
        const ggHistory = ggChart.data.datasets[0].data;
        ggHistory.push({x: emaAy, y: emaAx});
        if(ggHistory.length > 100) ggHistory.shift();
        
        ggChart.data.datasets[1].data = [{x: emaAy, y: emaAx}];

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

    speedChart.data.datasets[0].data.push(latestData.speed);
    speedChart.data.datasets[0].data.shift();
    
    voltageChart.data.datasets[0].data.push(latestData.pack_voltage);
    voltageChart.data.datasets[0].data.shift();

    motorChart.data.datasets[0].data.push(latestData.id);
    motorChart.data.datasets[0].data.shift();
    motorChart.data.datasets[1].data.push(latestData.iq);
    motorChart.data.datasets[1].data.shift();

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
    
    // 부하가 큰 꺾은선 차트들(Line Charts)은 10Hz(매 4번째 프레임)로 업데이트하여 브라우저 CPU/GPU 최적화
    renderCounter++;
    if (renderCounter % 4 === 0) {
        thermalsChart.update('none');
        rpmChart.update('none');
        speedChart.update('none');
        voltageChart.update('none');
        motorChart.update('none');
        imuChart.update('none');
    }

}, 25);

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
