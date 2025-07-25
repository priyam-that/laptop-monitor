class Dashboard {
    constructor() {
        this.autoRefreshInterval = null;
        this.autoRefreshActive = false;
        this.chart = null;
        this.chartData = {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Memory Usage (%)',
                    data: [],
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#f093fb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Disk Usage (%)',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4ecdc4',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initChart();
        this.loadMetrics();
        this.checkHealth();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadMetrics();
        });

        document.getElementById('autoRefreshBtn').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearData();
        });
    }

    initChart() {
        const canvas = document.getElementById('usageChart');
        console.log('Canvas element found:', canvas);
        
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('Chart context:', ctx);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            color: '#666',
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            maxTicksLimit: 10,
                            color: '#666',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
        console.log('Chart initialized:', this.chart);
        
        // Add some initial test data to make the chart visible
        this.addTestData();
    }
    
    addTestData() {
        // Add some sample data points to test the chart
        const testData = [
            { time: '10:00:00', cpu: 45, memory: 60, disk: 35 },
            { time: '10:01:00', cpu: 52, memory: 58, disk: 35 },
            { time: '10:02:00', cpu: 38, memory: 62, disk: 36 },
            { time: '10:03:00', cpu: 42, memory: 65, disk: 36 },
            { time: '10:04:00', cpu: 55, memory: 63, disk: 37 }
        ];
        
        testData.forEach(point => {
            this.chartData.labels.push(point.time);
            this.chartData.datasets[0].data.push(point.cpu);
            this.chartData.datasets[1].data.push(point.memory);
            this.chartData.datasets[2].data.push(point.disk);
        });
        
        this.chart.update();
        console.log('Test data added to chart');
    }

    async loadMetrics() {
        try {
            this.showLoading();
            const response = await fetch('/api/metrics');
            const result = await response.json();

            if (result.success) {
                this.updateMetricsDisplay(result.data);
                this.updateChart(result.data);
                this.updateSystemInfo(result.data);
                this.updateProcesses(result.data);
                this.updateLastUpdated();
                this.updateConnectionStatus('online');
            } else {
                this.showError('Failed to load metrics: ' + result.error);
                this.updateConnectionStatus('error');
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
            this.showError('Failed to connect to server');
            this.updateConnectionStatus('offline');
        } finally {
            this.hideLoading();
        }
    }

    updateMetricsDisplay(data) {
        console.log('Updating metrics with data:', data);
        
        // Test if elements exist
        const cpuUsageElement = document.getElementById('cpuUsage');
        const cpuCoresElement = document.getElementById('cpuCores');
        console.log('CPU Usage element found:', !!cpuUsageElement);
        console.log('CPU Cores element found:', !!cpuCoresElement);
        
        // CPU Metrics
        const cpu = data.cpu || {};
        console.log('CPU data:', cpu);
        
        if (cpuUsageElement) cpuUsageElement.textContent = `${cpu.usage_percent || 0}%`;
        if (document.getElementById('cpuFreq')) document.getElementById('cpuFreq').textContent = `${cpu.frequency_mhz || 0} MHz`;
        if (cpuCoresElement) cpuCoresElement.textContent = cpu.cores || 0;
        if (document.getElementById('loadAvg')) document.getElementById('loadAvg').textContent = (cpu.load_average && cpu.load_average[0]) ? cpu.load_average[0].toFixed(2) : '0.00';
        this.updateProgressBar('cpuProgress', cpu.usage_percent || 0);

        // Memory Metrics
        const memory = data.memory || {};
        document.getElementById('memoryUsage').textContent = `${memory.usage_percent || 0}%`;
        document.getElementById('memoryUsed').textContent = `${memory.used_gb || 0} GB`;
        document.getElementById('memoryTotal').textContent = `${memory.total_gb || 0} GB`;
        document.getElementById('memoryAvailable').textContent = `${memory.available_gb || 0} GB`;
        this.updateProgressBar('memoryProgress', memory.usage_percent || 0);

        // Disk Metrics
        const disk = data.disk || {};
        document.getElementById('diskUsage').textContent = `${disk.usage_percent || 0}%`;
        document.getElementById('diskUsed').textContent = `${disk.used_gb || 0} GB`;
        document.getElementById('diskTotal').textContent = `${disk.total_gb || 0} GB`;
        document.getElementById('diskFree').textContent = `${disk.free_gb || 0} GB`;
        this.updateProgressBar('diskProgress', disk.usage_percent || 0);

        // Network Metrics
        const network = data.network || {};
        document.getElementById('networkSent').textContent = `${network.bytes_sent_mb || 0} MB`;
        document.getElementById('networkReceived').textContent = `${network.bytes_recv_mb || 0} MB`;
        document.getElementById('packetsSent').textContent = this.formatNumber(network.packets_sent || 0);
        document.getElementById('packetsReceived').textContent = this.formatNumber(network.packets_recv || 0);
    }

    updateProgressBar(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            
            // Color coding based on usage
            if (percentage > 80) {
                progressBar.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
            } else if (percentage > 60) {
                progressBar.style.background = 'linear-gradient(45deg, #ffc107, #fd7e14)';
            } else {
                progressBar.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            }
        }
    }

    updateChart(data) {
        const currentTime = new Date().toLocaleTimeString();
        const maxDataPoints = 20;

        // Add new data point
        this.chartData.labels.push(currentTime);
        this.chartData.datasets[0].data.push(data.cpu?.usage_percent || 0);
        this.chartData.datasets[1].data.push(data.memory?.usage_percent || 0);
        this.chartData.datasets[2].data.push(data.disk?.usage_percent || 0);

        // Remove old data points if we have too many
        if (this.chartData.labels.length > maxDataPoints) {
            this.chartData.labels.shift();
            this.chartData.datasets.forEach(dataset => dataset.data.shift());
        }

        this.chart.update('none');
    }

    updateSystemInfo(data) {
        const system = data.system || {};
        document.getElementById('hostname').textContent = system.hostname || 'Unknown';
        document.getElementById('platform').textContent = system.platform || 'Unknown';
        document.getElementById('uptime').textContent = `${system.uptime_hours || 0} hours`;
        document.getElementById('bootTime').textContent = system.boot_time || 'Unknown';
    }

    updateProcesses(data) {
        const processes = data.top_processes || [];
        const tbody = document.getElementById('processesBody');
        
        if (processes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No process data available</td></tr>';
            return;
        }

        tbody.innerHTML = processes.map(proc => `
            <tr>
                <td>${proc.pid || 'N/A'}</td>
                <td>${this.truncateText(proc.name || 'Unknown', 20)}</td>
                <td>${(proc.cpu_percent || 0).toFixed(1)}%</td>
                <td>${(proc.memory_percent || 0).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const result = await response.json();

            if (result.success) {
                this.updateRedisStats(result.data.redis);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateRedisStats(redisStats) {
        document.getElementById('redisConnected').textContent = redisStats.redis_connected ? 'Yes' : 'No';
        document.getElementById('redisConnected').className = 'info-value ' + 
            (redisStats.redis_connected ? 'status-online' : 'status-offline');
        
        document.getElementById('metricsStored').textContent = redisStats.total_metrics_stored || 0;
        document.getElementById('redisMemory').textContent = redisStats.redis_memory_usage || 'N/A';
        document.getElementById('redisUptime').textContent = this.formatUptime(redisStats.redis_uptime || 0);
    }

    toggleAutoRefresh() {
        const btn = document.getElementById('autoRefreshBtn');
        const statusElement = document.getElementById('autoRefreshStatus');

        if (this.autoRefreshActive) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshActive = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Auto Refresh';
            btn.className = 'btn btn-secondary';
            statusElement.textContent = 'Off';
        } else {
            this.autoRefreshInterval = setInterval(() => {
                this.loadMetrics();
            }, 5000); // Refresh every 5 seconds
            
            this.autoRefreshActive = true;
            btn.innerHTML = '<i class="fas fa-pause"></i> Stop Auto';
            btn.className = 'btn btn-warning';
            statusElement.textContent = 'On (5s)';
        }
    }

    async clearData() {
        if (!confirm('Are you sure you want to clear all stored metrics data?')) {
            return;
        }

        try {
            const response = await fetch('/api/clear', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.showSuccess('All metrics data cleared successfully');
                this.clearChart();
                this.loadStats();
            } else {
                this.showError('Failed to clear data: ' + result.error);
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showError('Failed to clear data');
        }
    }

    clearChart() {
        this.chartData.labels = [];
        this.chartData.datasets.forEach(dataset => {
            dataset.data = [];
        });
        this.chart.update();
    }

    async checkHealth() {
        try {
            const response = await fetch('/health');
            const result = await response.json();

            if (result.status === 'healthy') {
                this.updateConnectionStatus('online');
                this.loadStats();
            } else {
                this.updateConnectionStatus('error');
            }
        } catch (error) {
            this.updateConnectionStatus('offline');
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        
        switch (status) {
            case 'online':
                statusElement.textContent = 'Connected';
                statusElement.className = 'status-value status-online';
                break;
            case 'offline':
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'status-value status-offline';
                break;
            case 'error':
                statusElement.textContent = 'Error';
                statusElement.className = 'status-value status-warning';
                break;
        }
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
    }

    showLoading() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.innerHTML = '<div class="loading"></div> Loading...';
        refreshBtn.disabled = true;
    }

    hideLoading() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        const container = document.querySelector('.container');
        container.insertBefore(alert, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    try {
        const dashboard = new Dashboard();
        console.log('Dashboard initialized successfully');
        
        // Add a test function to window for manual testing
        window.testMetrics = () => {
            console.log('Testing metrics manually...');
            dashboard.loadMetrics();
        };
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});
