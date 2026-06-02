// Chart Configuration
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Turn off for real-time performance
    plugins: { 
        legend: { display: false },
        tooltip: { enabled: false }
    },
    scales: {
        x: { display: false },
        y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            beginAtZero: true
        }
    },
    elements: {
        point: { radius: 0 } // Hide points, just show line
    }
};

// Initialize RPM Chart
const ctxRpm = document.getElementById('rpmChart').getContext('2d');
const rpmChart = new Chart(ctxRpm, {
    type: 'line',
    data: {
        labels: Array(200).fill(''),
        datasets: [{
            data: Array(200).fill(0),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3 // Smooth curves
        }]
    },
    options: {
        ...commonOptions,
        scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, max: 12000 } }
    }
});

// Initialize Speed Chart
const ctxSpeed = document.getElementById('speedChart').getContext('2d');
const speedChart = new Chart(ctxSpeed, {
    type: 'line',
    data: {
        labels: Array(200).fill(''),
        datasets: [{
            data: Array(200).fill(0),
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        ...commonOptions,
        scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, max: 200 } }
    }
});

// WebSocket Connection Logic
const WS_URL = 'wss://gef27test.store/ws';
const statusBadge = document.getElementById('connection-status');
const statusText = statusBadge.querySelector('.status-text');
let ws;

function connectWebSocket() {
    console.log(`Attempting to connect to ${WS_URL}...`);
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('Connected to Telemetry Server');
        statusBadge.className = 'status-badge connected';
        statusText.textContent = 'LIVE';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // --- Update RPM ---
            const rpmEl = document.getElementById('rpm-value');
            rpmEl.textContent = data.rpm;
            
            // Danger Zone Styling
            if(data.rpm > 10000) {
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

            rpmChart.data.datasets[0].data.shift();
            rpmChart.data.datasets[0].data.push(data.rpm);
            rpmChart.update();

            // --- Update Speed ---
            document.getElementById('speed-value').textContent = data.speed;
            
            speedChart.data.datasets[0].data.shift();
            speedChart.data.datasets[0].data.push(data.speed);
            speedChart.update();

        } catch (e) {
            console.error("Error parsing message: ", e);
        }
    };

    ws.onclose = () => {
        console.log('Disconnected. Attempting reconnect...');
        statusBadge.className = 'status-badge disconnected';
        statusText.textContent = 'RECONNECTING...';
        
        // Auto Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

// Initial connection
connectWebSocket();
