#!/usr/bin/env node

/**
 * Test Monitor Script for PixelSqueeze
 * Monitors test coverage, performance, and quality metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestMonitor {
  constructor() {
    this.coverageDir = path.join(__dirname, '../tests/coverage');
    this.reportsDir = path.join(__dirname, '../reports');
    this.thresholds = {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    };
  }

  /**
   * Run all tests and collect metrics
   */
  async runTests() {
    console.log('🧪 Running comprehensive test suite...\n');
    
    try {
      // Run tests with coverage
      const testOutput = execSync('npm run test:coverage', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..')
      });
      
      console.log('✅ All tests completed successfully!\n');
      return this.parseCoverageOutput(testOutput);
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Parse coverage output to extract metrics
   */
  parseCoverageOutput(output) {
    const lines = output.split('\n');
    const coverageLine = lines.find(line => line.includes('All files'));
    
    if (!coverageLine) {
      throw new Error('Could not parse coverage output');
    }

    const parts = coverageLine.split('|').map(part => part.trim());
    const metrics = {
      statements: parseFloat(parts[1]),
      branches: parseFloat(parts[2]),
      functions: parseFloat(parts[3]),
      lines: parseFloat(parts[4])
    };

    return metrics;
  }

  /**
   * Check if coverage meets thresholds
   */
  checkThresholds(metrics) {
    console.log('📊 Coverage Analysis:\n');
    
    let allPassed = true;
    
    Object.entries(metrics).forEach(([metric, value]) => {
      const threshold = this.thresholds[metric];
      const status = value >= threshold ? '✅' : '❌';
      const passFail = value >= threshold ? 'PASS' : 'FAIL';
      
      console.log(`${status} ${metric.toUpperCase()}: ${value}% (Threshold: ${threshold}%) - ${passFail}`);
      
      if (value < threshold) {
        allPassed = false;
      }
    });

    console.log();
    return allPassed;
  }

  /**
   * Generate coverage trend report
   */
  generateTrendReport(metrics) {
    const reportPath = path.join(this.reportsDir, 'coverage-trend.json');
    const timestamp = new Date().toISOString();
    
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    let trendData = [];
    if (fs.existsSync(reportPath)) {
      try {
        trendData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Could not parse existing trend data, starting fresh');
      }
    }

    // Add new data point
    trendData.push({
      timestamp,
      metrics,
      total: Object.values(metrics).reduce((sum, val) => sum + val, 0) / Object.keys(metrics).length
    });

    // Keep only last 30 data points
    if (trendData.length > 30) {
      trendData = trendData.slice(-30);
    }

    // Save trend data
    fs.writeFileSync(reportPath, JSON.stringify(trendData, null, 2));
    
    console.log('📈 Coverage trend data saved to:', reportPath);
    
    // Analyze trends
    this.analyzeTrends(trendData);
  }

  /**
   * Analyze coverage trends
   */
  analyzeTrends(trendData) {
    if (trendData.length < 2) {
      console.log('📈 Need more data points to analyze trends');
      return;
    }

    const recent = trendData.slice(-5);
    const older = trendData.slice(-10, -5);
    
    if (older.length === 0) return;

    const recentAvg = recent.reduce((sum, point) => sum + point.total, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.total, 0) / older.length;
    const change = recentAvg - olderAvg;

    console.log('📈 Trend Analysis:');
    console.log(`   Recent average: ${recentAvg.toFixed(1)}%`);
    console.log(`   Previous average: ${olderAvg.toFixed(1)}%`);
    console.log(`   Change: ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`);
    
    if (change > 1) {
      console.log('   🎉 Coverage is improving!');
    } else if (change < -1) {
      console.log('   ⚠️  Coverage is declining - investigate!');
    } else {
      console.log('   ➡️  Coverage is stable');
    }
  }

  /**
   * Generate HTML coverage report
   */
  generateHTMLReport() {
    const coveragePath = path.join(this.coverageDir, 'lcov-report', 'index.html');
    
    if (fs.existsSync(coveragePath)) {
      console.log('📄 HTML coverage report available at:', coveragePath);
      
      // Copy to reports directory for easy access
      const reportPath = path.join(this.reportsDir, 'coverage-report.html');
      fs.copyFileSync(coveragePath, reportPath);
      console.log('📄 Report copied to:', reportPath);
    }
  }

  /**
   * Check test performance
   */
  checkTestPerformance() {
    console.log('\n⚡ Performance Analysis:\n');
    
    try {
      // Run tests with timing
      const startTime = Date.now();
      const output = execSync('npm test', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..')
      });
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`⏱️  Total test duration: ${duration.toFixed(2)} seconds`);
      
      // Parse test count
      const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
      if (testMatch) {
        const totalTests = parseInt(testMatch[1]) + parseInt(testMatch[2]);
        const testsPerSecond = totalTests / duration;
        console.log(`📊 Test execution rate: ${testsPerSecond.toFixed(2)} tests/second`);
      }
      
      // Performance thresholds
      if (duration > 60) {
        console.log('⚠️  Tests are running slowly - consider optimization');
      } else if (duration < 10) {
        console.log('🚀 Tests are running fast!');
      } else {
        console.log('✅ Test performance is acceptable');
      }
      
    } catch (error) {
      console.error('❌ Could not measure test performance:', error.message);
    }
  }

  /**
   * Generate summary report
   */
  generateSummary(metrics, thresholdsMet) {
    const summaryPath = path.join(this.reportsDir, 'test-summary.md');
    
    const summary = `# Test Summary Report

Generated: ${new Date().toLocaleString()}

## Coverage Summary
- **Statements**: ${metrics.statements}% (Threshold: ${this.thresholds.statements}%)
- **Branches**: ${metrics.branches}% (Threshold: ${this.thresholds.branches}%)
- **Functions**: ${metrics.functions}% (Threshold: ${this.thresholds.functions}%)
- **Lines**: ${metrics.lines}% (Threshold: ${this.thresholds.lines}%)

## Status
${thresholdsMet ? '✅ All thresholds met' : '❌ Some thresholds not met'}

## Recommendations
${this.generateRecommendations(metrics)}
`;

    fs.writeFileSync(summaryPath, summary);
    console.log('📋 Summary report generated:', summaryPath);
  }

  /**
   * Generate recommendations based on coverage
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    Object.entries(metrics).forEach(([metric, value]) => {
      const threshold = this.thresholds[metric];
      
      if (value < threshold) {
        recommendations.push(`- Increase ${metric} coverage from ${value}% to at least ${threshold}%`);
      } else if (value < threshold + 5) {
        recommendations.push(`- ${metric} coverage is close to threshold, consider improving`);
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('- Excellent coverage! Consider adding more edge case tests');
      recommendations.push('- Focus on maintaining current quality standards');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🚀 PixelSqueeze Test Monitor\n');
    console.log('=' .repeat(50));
    
    try {
      // Run tests and collect metrics
      const metrics = await this.runTests();
      
      // Check thresholds
      const thresholdsMet = this.checkThresholds(metrics);
      
      // Generate reports
      this.generateTrendReport(metrics);
      this.generateHTMLReport();
      this.checkTestPerformance();
      this.generateSummary(metrics, thresholdsMet);
      
      console.log('=' .repeat(50));
      console.log(thresholdsMet ? '🎉 All quality checks passed!' : '⚠️  Some quality checks failed');
      
      // Exit with appropriate code
      process.exit(thresholdsMet ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Test monitoring failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the monitor if this script is executed directly
if (require.main === module) {
  const monitor = new TestMonitor();
  monitor.run();
}

module.exports = TestMonitor;
