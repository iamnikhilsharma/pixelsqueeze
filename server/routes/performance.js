const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const performanceMonitor = require('../services/performanceMonitor');
const advancedCache = require('../services/advancedCache');
const webAssemblyProcessor = require('../services/webAssemblyProcessor');
const { logger } = require('../utils/logger');

// Get current performance metrics
router.get('/metrics', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
}));

// Get detailed performance report
router.get('/report', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    
    if (!['15m', '1h', '6h', '24h'].includes(timeRange)) {
      return res.status(400).json({ error: 'Invalid time range. Use: 15m, 1h, 6h, 24h' });
    }

    const report = performanceMonitor.getDetailedReport(timeRange);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error getting performance report:', error);
    res.status(500).json({ error: 'Failed to get performance report' });
  }
}));

// Get cache statistics
router.get('/cache/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const cacheStats = await advancedCache.getStats();
    
    res.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
}));

// Get cache health status
router.get('/cache/health', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const health = await advancedCache.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting cache health:', error);
    res.status(500).json({ error: 'Failed to get cache health status' });
  }
}));

// Clear cache
router.post('/cache/clear', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { namespace } = req.body;
    
    if (namespace) {
      await advancedCache.invalidateByNamespace(namespace);
      res.json({
        success: true,
        message: `Cache cleared for namespace: ${namespace}`
      });
    } else {
      await advancedCache.clear();
      res.json({
        success: true,
        message: 'All cache cleared successfully'
      });
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
}));

// Invalidate cache by tags
router.post('/cache/invalidate', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    await advancedCache.invalidateByTags(tags);
    
    res.json({
      success: true,
      message: `Cache invalidated for tags: ${tags.join(', ')}`
    });
  } catch (error) {
    logger.error('Error invalidating cache:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
}));

// Get WebAssembly processor status
router.get('/wasm/status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const status = webAssemblyProcessor.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting WebAssembly status:', error);
    res.status(500).json({ error: 'Failed to get WebAssembly status' });
  }
}));

// Get WebAssembly processor health
router.get('/wasm/health', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const health = await webAssemblyProcessor.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting WebAssembly health:', error);
    res.status(500).json({ error: 'Failed to get WebAssembly health status' });
  }
}));

// Get system resource usage
router.get('/system/resources', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const resources = {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // ms
        system: Math.round(cpuUsage.system / 1000) // ms
      },
      process: {
        pid: process.pid,
        uptime: Math.round(process.uptime()), // seconds
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    logger.error('Error getting system resources:', error);
    res.status(500).json({ error: 'Failed to get system resources' });
  }
}));

// Get performance recommendations
router.get('/recommendations', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const report = performanceMonitor.getDetailedReport('1h');
    const recommendations = report.recommendations;
    
    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error getting performance recommendations:', error);
    res.status(500).json({ error: 'Failed to get performance recommendations' });
  }
}));

// Reset performance metrics (admin only)
router.post('/reset', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Check if user is admin (you can implement your own admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    performanceMonitor.resetMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting performance metrics:', error);
    res.status(500).json({ error: 'Failed to reset performance metrics' });
  }
}));

// Get real-time performance stream (Server-Sent Events)
router.get('/stream', authenticateToken, asyncHandler(async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial metrics
    res.write(`data: ${JSON.stringify({
      type: 'initial',
      data: performanceMonitor.getMetrics()
    })}\n\n`);

    // Set up event listeners
    const requestHandler = (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'request',
        data
      })}\n\n`);
    };

    const systemHandler = (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'system',
        data
      })}\n\n`);
    };

    const errorHandler = (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        data
      })}\n\n`);
    };

    const memoryHandler = (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'memory',
        data
      })}\n\n`);
    };

    // Add event listeners
    performanceMonitor.on('requestCompleted', requestHandler);
    performanceMonitor.on('systemMetricsUpdated', systemHandler);
    performanceMonitor.on('errorOccurred', errorHandler);
    performanceMonitor.on('memoryWarning', memoryHandler);

    // Send periodic updates
    const interval = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      res.write(`data: ${JSON.stringify({
        type: 'update',
        data: metrics
      })}\n\n`);
    }, 5000); // Update every 5 seconds

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      performanceMonitor.off('requestCompleted', requestHandler);
      performanceMonitor.off('systemMetricsUpdated', systemHandler);
      performanceMonitor.off('errorOccurred', errorHandler);
      performanceMonitor.off('memoryWarning', memoryHandler);
    });

  } catch (error) {
    logger.error('Error setting up performance stream:', error);
    res.status(500).json({ error: 'Failed to set up performance stream' });
  }
}));

// Get performance logs
router.get('/logs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    
    let logs = [];
    
    if (type === 'performance') {
      logs = performanceMonitor.performanceLog.slice(-limit);
    } else if (type === 'error') {
      logs = performanceMonitor.errorLog.slice(-limit);
    } else {
      logs = {
        performance: performanceMonitor.performanceLog.slice(-50),
        errors: performanceMonitor.errorLog.slice(-50)
      };
    }
    
    res.json({
      success: true,
      data: {
        logs,
        count: Array.isArray(logs) ? logs.length : logs.performance.length + logs.errors.length,
        type: type || 'all'
      }
    });
  } catch (error) {
    logger.error('Error getting performance logs:', error);
    res.status(500).json({ error: 'Failed to get performance logs' });
  }
}));

// Export performance data
router.get('/export', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { format = 'json', timeRange = '24h' } = req.query;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use: json, csv' });
    }

    const report = performanceMonitor.getDetailedReport(timeRange);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(report);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="performance-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="performance-${Date.now()}.json"`);
      res.json(report);
    }
  } catch (error) {
    logger.error('Error exporting performance data:', error);
    res.status(500).json({ error: 'Failed to export performance data' });
  }
}));

// Helper method to convert data to CSV
function convertToCSV(data) {
  // This is a simplified CSV conversion
  // In a real implementation, you'd want a more robust CSV library
  const lines = [];
  
  // Add headers
  lines.push('Metric,Value,Timestamp');
  
  // Add data
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        lines.push(`${key}.${subKey},${subValue},${new Date().toISOString()}`);
      });
    } else {
      lines.push(`${key},${value},${new Date().toISOString()}`);
    }
  });
  
  return lines.join('\n');
}

module.exports = router;
