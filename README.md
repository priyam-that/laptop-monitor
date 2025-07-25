# Laptop Monitor Dashboard

A real-time laptop monitoring system built with Flask and Redis that provides comprehensive system metrics through an intuitive web dashboard.

## Features

- **Real-time System Monitoring**: Track CPU, memory, disk, and network usage
- **Interactive Dashboard**: Modern, responsive web interface with live charts
- **Redis Integration**: Fast data storage and retrieval for historical metrics
- **Background Monitoring**: Continuous data collection with configurable intervals
- **Process Monitoring**: View top processes by CPU usage
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Health Checks**: Built-in health monitoring for system reliability

## System Metrics Tracked

### CPU Metrics
- Usage percentage
- Current frequency
- Number of cores
- Load average

### Memory Metrics
- Total, used, and available memory
- Usage percentage
- Swap memory statistics

### Disk Metrics
- Total, used, and free disk space
- Usage percentage
- Read/write statistics

### Network Metrics
- Bytes sent/received
- Packets sent/received
- Transfer rates

### System Information
- Hostname and platform details
- System uptime
- Boot time
- Python version

## Prerequisites

- Python 3.9+
- Redis server
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd laptop-monitor
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start Redis server:
```bash
redis-server
```

5. Run the application:
```bash
python run.py
```

### Docker Deployment

1. Build and start services:
```bash
docker-compose up -d
```

2. Access the dashboard at `http://localhost:5000`

## Usage

### Web Dashboard

Navigate to `http://localhost:5000` to access the monitoring dashboard:

- **Real-time Metrics**: View current system statistics
- **Historical Charts**: Analyze trends over time
- **Auto Refresh**: Enable automatic data updates every 5 seconds
- **Process Monitor**: See top CPU-consuming processes
- **System Info**: Check system and Redis statistics

### API Endpoints

- `GET /` - Main dashboard
- `GET /api/metrics` - Get current system metrics
- `GET /api/metrics/current` - Get cached metrics from Redis
- `GET /api/metrics/history?limit=50` - Get historical data
- `GET /api/stats` - Get system and Redis statistics
- `POST /api/monitoring/start` - Start background monitoring
- `POST /api/monitoring/stop` - Stop background monitoring
- `POST /api/clear` - Clear all stored metrics
- `GET /health` - Health check endpoint

### Configuration

Environment variables:

- `REDIS_HOST`: Redis server hostname (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_DB`: Redis database number (default: 0)
- `HOST`: Application host (default: 0.0.0.0)
- `PORT`: Application port (default: 5000)
- `FLASK_ENV`: Flask environment (development/production)

## Architecture

### Components

- **Flask Application**: Web server and API endpoints
- **Redis**: In-memory data store for metrics
- **psutil**: System information gathering
- **Chart.js**: Interactive data visualization
- **Background Monitor**: Continuous metrics collection

### Data Flow

1. System metrics collected using `psutil`
2. Data stored in Redis with timestamp
3. Web dashboard fetches data via API
4. Real-time updates through JavaScript
5. Historical data maintained in Redis lists

### Redis Data Structure

- `current_metrics`: Latest system metrics (JSON)
- `metrics_history`: Time-series data (Redis list, max 100 entries)

## Development

### Project Structure

```
laptop-monitor/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── monitor.py           # System monitoring logic
│   ├── redis_client.py      # Redis integration
│   ├── routes.py            # API endpoints
│   └── templates/
│       └── index.html       # Dashboard template
├── static/
│   ├── css/
│   │   └── style.css        # Dashboard styles
│   └── js/
│       └── script.js        # Dashboard JavaScript
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Multi-service setup
├── requirements.txt         # Python dependencies
└── run.py                   # Application entry point
```

### Adding New Metrics

1. Extend `SystemMonitor` class in `monitor.py`
2. Add collection method for new metric
3. Update `collect_all_metrics()` method
4. Modify dashboard template and JavaScript
5. Update API documentation

### Customization

- **Refresh Interval**: Modify JavaScript timer in `script.js`
- **Data Retention**: Adjust Redis list size in `redis_client.py`
- **Chart Configuration**: Customize Chart.js options
- **Styling**: Modify CSS in `static/css/style.css`

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check connection parameters
   - Verify network connectivity

2. **Permission Denied Errors**
   - Run with appropriate privileges for system monitoring
   - Use Docker privileged mode if needed

3. **Port Already in Use**
   - Change port in environment variables
   - Stop conflicting services

4. **Missing System Information**
   - Install required system libraries
   - Check psutil compatibility

### Logs

- Application logs: Check console output
- Redis logs: `docker-compose logs redis`
- Container logs: `docker-compose logs web`

## Performance Considerations

- **Memory Usage**: Redis stores metrics in memory
- **CPU Impact**: Monitoring has minimal CPU overhead
- **Network**: Dashboard updates create network traffic
- **Storage**: Historical data limited to 100 entries

## Security

- **Network Access**: Bind to localhost for local-only access
- **Redis Security**: Configure Redis authentication for production
- **Container Security**: Use non-root user in production
- **API Security**: Add authentication for production deployment

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review application logs
- Create an issue on GitHub
