import psutil
import time
import socket
import platform
from datetime import datetime
from typing import Dict, List
from app.redis_client import RedisClient

class SystemMonitor:
    def __init__(self):
        """Initialize system monitor with Redis client"""
        self.redis_client = RedisClient()
        self.start_time = time.time()
    
    def get_cpu_info(self) -> Dict:
        """
        Get CPU usage information
        
        Returns:
            Dict: CPU usage statistics
        """
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_freq = psutil.cpu_freq()
            cpu_count = psutil.cpu_count()
            
            return {
                'usage_percent': round(cpu_percent, 2),
                'frequency_mhz': round(cpu_freq.current, 2) if cpu_freq else 0,
                'cores': cpu_count,
                'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
            }
        except Exception as e:
            print(f"Error getting CPU info: {e}")
            return {'usage_percent': 0, 'frequency_mhz': 0, 'cores': 0, 'load_average': [0, 0, 0]}
    
    def get_memory_info(self) -> Dict:
        """
        Get memory usage information
        
        Returns:
            Dict: Memory usage statistics
        """
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2),
                'usage_percent': round(memory.percent, 2),
                'swap_total_gb': round(swap.total / (1024**3), 2),
                'swap_used_gb': round(swap.used / (1024**3), 2),
                'swap_percent': round(swap.percent, 2)
            }
        except Exception as e:
            print(f"Error getting memory info: {e}")
            return {
                'total_gb': 0, 'available_gb': 0, 'used_gb': 0,
                'usage_percent': 0, 'swap_total_gb': 0, 'swap_used_gb': 0, 'swap_percent': 0
            }
    
    def get_disk_info(self) -> Dict:
        """
        Get disk usage information
        
        Returns:
            Dict: Disk usage statistics
        """
        try:
            disk = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            return {
                'total_gb': round(disk.total / (1024**3), 2),
                'used_gb': round(disk.used / (1024**3), 2),
                'free_gb': round(disk.free / (1024**3), 2),
                'usage_percent': round((disk.used / disk.total) * 100, 2),
                'read_bytes': disk_io.read_bytes if disk_io else 0,
                'write_bytes': disk_io.write_bytes if disk_io else 0
            }
        except Exception as e:
            print(f"Error getting disk info: {e}")
            return {
                'total_gb': 0, 'used_gb': 0, 'free_gb': 0,
                'usage_percent': 0, 'read_bytes': 0, 'write_bytes': 0
            }
    
    def get_network_info(self) -> Dict:
        """
        Get network usage information
        
        Returns:
            Dict: Network usage statistics
        """
        try:
            net_io = psutil.net_io_counters()
            
            return {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'bytes_sent_mb': round(net_io.bytes_sent / (1024**2), 2),
                'bytes_recv_mb': round(net_io.bytes_recv / (1024**2), 2)
            }
        except Exception as e:
            print(f"Error getting network info: {e}")
            return {
                'bytes_sent': 0, 'bytes_recv': 0, 'packets_sent': 0,
                'packets_recv': 0, 'bytes_sent_mb': 0, 'bytes_recv_mb': 0
            }
    
    def get_system_info(self) -> Dict:
        """
        Get general system information
        
        Returns:
            Dict: System information
        """
        try:
            boot_time = psutil.boot_time()
            current_time = time.time()
            uptime_seconds = current_time - boot_time
            
            return {
                'hostname': socket.gethostname(),
                'platform': platform.platform(),
                'processor': platform.processor(),
                'python_version': platform.python_version(),
                'boot_time': datetime.fromtimestamp(boot_time).strftime('%Y-%m-%d %H:%M:%S'),
                'uptime_seconds': int(uptime_seconds),
                'uptime_hours': round(uptime_seconds / 3600, 2),
                'current_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
            return {
                'hostname': 'Unknown', 'platform': 'Unknown', 'processor': 'Unknown',
                'python_version': 'Unknown', 'boot_time': 'Unknown',
                'uptime_seconds': 0, 'uptime_hours': 0, 'current_time': 'Unknown'
            }
    
    def get_process_info(self, limit: int = 10) -> List[Dict]:
        """
        Get top processes by CPU usage
        
        Args:
            limit: Number of top processes to return
            
        Returns:
            List[Dict]: List of top processes
        """
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    processes.append(proc.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            # Sort by CPU usage and return top processes
            processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
            return processes[:limit]
        except Exception as e:
            print(f"Error getting process info: {e}")
            return []
    
    def collect_all_metrics(self) -> Dict:
        """
        Collect all system metrics
        
        Returns:
            Dict: Complete system metrics
        """
        timestamp = datetime.now().isoformat()
        
        metrics = {
            'timestamp': timestamp,
            'cpu': self.get_cpu_info(),
            'memory': self.get_memory_info(),
            'disk': self.get_disk_info(),
            'network': self.get_network_info(),
            'system': self.get_system_info(),
            'top_processes': self.get_process_info()
        }
        
        # Store metrics in Redis
        self.redis_client.store_system_metrics(metrics)
        
        return metrics
    
    def get_historical_data(self, limit: int = 50) -> List[Dict]:
        """
        Get historical metrics data from Redis
        
        Args:
            limit: Number of historical entries to retrieve
            
        Returns:
            List[Dict]: Historical metrics data
        """
        return self.redis_client.get_metrics_history(limit)
    
    def get_redis_stats(self) -> Dict:
        """
        Get Redis connection and storage statistics
        
        Returns:
            Dict: Redis statistics
        """
        return self.redis_client.get_system_stats()
