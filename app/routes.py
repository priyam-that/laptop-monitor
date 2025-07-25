from flask import Blueprint, render_template, jsonify, request
from app.monitor import SystemMonitor
import threading
import time

bp = Blueprint('main', __name__)

# Global system monitor instance
monitor = SystemMonitor()

# Background thread for continuous monitoring
monitoring_active = False
monitoring_thread = None

def background_monitoring():
    """Background thread function for continuous system monitoring"""
    global monitoring_active
    while monitoring_active:
        try:
            monitor.collect_all_metrics()
            time.sleep(5)  # Collect metrics every 5 seconds
        except Exception as e:
            print(f"Error in background monitoring: {e}")
            time.sleep(10)  # Wait longer on error

@bp.route('/')
def index():
    """Main dashboard route"""
    return render_template('index.html')

@bp.route('/api/metrics')
def get_metrics():
    """API endpoint to get current system metrics"""
    try:
        metrics = monitor.collect_all_metrics()
        return jsonify({
            'success': True,
            'data': metrics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/metrics/current')
def get_current_metrics():
    """API endpoint to get the most recent metrics from Redis"""
    try:
        metrics = monitor.redis_client.get_current_metrics()
        if metrics:
            return jsonify({
                'success': True,
                'data': metrics
            })
        else:
            # If no cached metrics, collect fresh ones
            metrics = monitor.collect_all_metrics()
            return jsonify({
                'success': True,
                'data': metrics
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/metrics/history')
def get_metrics_history():
    """API endpoint to get historical metrics data"""
    try:
        limit = request.args.get('limit', 50, type=int)
        history = monitor.get_historical_data(limit)
        return jsonify({
            'success': True,
            'data': history,
            'count': len(history)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/stats')
def get_system_stats():
    """API endpoint to get system and Redis statistics"""
    try:
        redis_stats = monitor.get_redis_stats()
        system_info = monitor.get_system_info()
        
        stats = {
            'redis': redis_stats,
            'system': system_info,
            'monitoring_active': monitoring_active
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/monitoring/start', methods=['POST'])
def start_monitoring():
    """API endpoint to start background monitoring"""
    global monitoring_active, monitoring_thread
    
    try:
        if not monitoring_active:
            monitoring_active = True
            monitoring_thread = threading.Thread(target=background_monitoring, daemon=True)
            monitoring_thread.start()
            
            return jsonify({
                'success': True,
                'message': 'Background monitoring started'
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Background monitoring already active'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/monitoring/stop', methods=['POST'])
def stop_monitoring():
    """API endpoint to stop background monitoring"""
    global monitoring_active
    
    try:
        monitoring_active = False
        return jsonify({
            'success': True,
            'message': 'Background monitoring stopped'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/clear', methods=['POST'])
def clear_metrics():
    """API endpoint to clear all stored metrics"""
    try:
        success = monitor.redis_client.clear_all_metrics()
        if success:
            return jsonify({
                'success': True,
                'message': 'All metrics cleared successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to clear metrics'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        redis_stats = monitor.get_redis_stats()
        return jsonify({
            'status': 'healthy',
            'redis_connected': redis_stats.get('redis_connected', False),
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': time.time()
        }), 500
