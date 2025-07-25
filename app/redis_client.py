import redis
import json
import os
from typing import Dict, List, Optional

class RedisClient:
    def __init__(self):
        """Initialize Redis client with connection parameters"""
        self.host = os.getenv('REDIS_HOST', 'localhost')
        self.port = int(os.getenv('REDIS_PORT', 6379))
        self.db = int(os.getenv('REDIS_DB', 0))
        self.client = None
        self.connect()
    
    def connect(self):
        """Establish connection to Redis server"""
        try:
            self.client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True
            )
            # Test connection
            self.client.ping()
            print(f"Connected to Redis at {self.host}:{self.port}")
        except redis.ConnectionError as e:
            print(f"Failed to connect to Redis: {e}")
            self.client = None
    
    def store_system_metrics(self, metrics: Dict) -> bool:
        """
        Store system metrics in Redis with timestamp
        
        Args:
            metrics: Dictionary containing system metrics
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            # Store current metrics
            self.client.set('current_metrics', json.dumps(metrics))
            
            # Store in time series (keep last 100 entries)
            pipe = self.client.pipeline()
            pipe.lpush('metrics_history', json.dumps(metrics))
            pipe.ltrim('metrics_history', 0, 99)  # Keep only last 100 entries
            pipe.execute()
            
            return True
        except Exception as e:
            print(f"Error storing metrics: {e}")
            return False
    
    def get_current_metrics(self) -> Optional[Dict]:
        """
        Get the most recent system metrics
        
        Returns:
            Dict: Current system metrics or None if not available
        """
        if not self.client:
            return None
        
        try:
            metrics_json = self.client.get('current_metrics')
            if metrics_json:
                return json.loads(metrics_json)
            return None
        except Exception as e:
            print(f"Error retrieving current metrics: {e}")
            return None
    
    def get_metrics_history(self, limit: int = 50) -> List[Dict]:
        """
        Get historical system metrics
        
        Args:
            limit: Number of historical entries to retrieve
            
        Returns:
            List[Dict]: List of historical metrics
        """
        if not self.client:
            return []
        
        try:
            history = self.client.lrange('metrics_history', 0, limit - 1)
            return [json.loads(entry) for entry in history]
        except Exception as e:
            print(f"Error retrieving metrics history: {e}")
            return []
    
    def get_system_stats(self) -> Dict:
        """
        Get system statistics from Redis
        
        Returns:
            Dict: System statistics including uptime, total metrics stored, etc.
        """
        if not self.client:
            return {}
        
        try:
            stats = {
                'redis_connected': True,
                'total_metrics_stored': self.client.llen('metrics_history'),
                'redis_memory_usage': self.client.info('memory').get('used_memory_human', 'N/A'),
                'redis_uptime': self.client.info('server').get('uptime_in_seconds', 0)
            }
            return stats
        except Exception as e:
            print(f"Error retrieving system stats: {e}")
            return {'redis_connected': False}
    
    def clear_all_metrics(self) -> bool:
        """
        Clear all stored metrics from Redis
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            pipe = self.client.pipeline()
            pipe.delete('current_metrics')
            pipe.delete('metrics_history')
            pipe.execute()
            return True
        except Exception as e:
            print(f"Error clearing metrics: {e}")
            return False
