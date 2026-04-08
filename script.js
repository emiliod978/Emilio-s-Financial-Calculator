// Global variables to store data
let stockData = [];
let benchmarkData = [];
let stockReturns = [];
let benchmarkReturns = [];
let returnsChart = null;
let regressionChart = null;

// Show manual input section
function showManualInput() {
    const manualSection = document.getElementById('manualSection');
    manualSection.style.display = manualSection.style.display === 'none' ? 'block' : 'none';
}

// Calculate returns from prices
function calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
        returns.push(ret);
    }
    return returns;
}

// Calculate mean of array
function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Calculate variance
function variance(arr) {
    if (arr.length <= 1) return 0;
    const avg = mean(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
}

// Calculate standard deviation
function standardDeviation(arr) {
    return Math.sqrt(variance(arr));
}

// Calculate covariance between two arrays
function covariance(arr1, arr2) {
    if (arr1.length !== arr2.length || arr1.length <= 1) return 0;
    const mean1 = mean(arr1);
    const mean2 = mean(arr2);
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += (arr1[i] - mean1) * (arr2[i] - mean2);
    }
    return sum / (arr1.length - 1);
}

// Calculate correlation
function correlation(arr1, arr2) {
    const cov = covariance(arr1, arr2);
    const std1 = standardDeviation(arr1);
    const std2 = standardDeviation(arr2);
    if (std1 === 0 || std2 === 0) return 0;
    return cov / (std1 * std2);
}

// Calculate beta
function calculateBeta(stockReturns, marketReturns) {
    const cov = covariance(stockReturns, marketReturns);
    const marketVar = variance(marketReturns);
    if (marketVar === 0) return 0;
    return cov / marketVar;
}

// Linear regression for alpha
function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

// Main calculation function
function performCalculations(stockPrices, benchmarkPrices, riskFreeRate) {
    // Calculate daily returns
    stockReturns = calculateReturns(stockPrices);
    benchmarkReturns = calculateReturns(benchmarkPrices);
    
    // Number of trading days
    const tradingDays = stockReturns.length;
    const annualizationFactor = 252; // Assuming 252 trading days per year
    
    // Basic statistics - Daily
    const avgStockReturn = mean(stockReturns);
    const avgBenchmarkReturn = mean(benchmarkReturns);
    const stockVolatility = standardDeviation(stockReturns);
    const benchmarkVolatility = standardDeviation(benchmarkReturns);
    
    // Annualized metrics
    const annualizedStockReturn = avgStockReturn * annualizationFactor;
    const annualizedBenchmarkReturn = avgBenchmarkReturn * annualizationFactor;
    const annualizedStockVolatility = stockVolatility * Math.sqrt(annualizationFactor);
    
    // Holding period return
    const stockHPR = (stockPrices[stockPrices.length - 1] - stockPrices[0]) / stockPrices[0];
    const benchmarkHPR = (benchmarkPrices[benchmarkPrices.length - 1] - benchmarkPrices[0]) / benchmarkPrices[0];
    
    // Beta and correlation
    const beta = calculateBeta(stockReturns, benchmarkReturns);
    const corr = correlation(stockReturns, benchmarkReturns);
    
    // CAPM calculations
    const dailyRiskFreeRate = riskFreeRate / 100 / annualizationFactor;
    const annualRiskFreeRate = riskFreeRate / 100;
    
    // Market risk premium (annualized)
    const marketRiskPremium = annualizedBenchmarkReturn - annualRiskFreeRate;
    
    // Expected return from CAPM (annualized)
    const capmExpectedReturn = annualRiskFreeRate + beta * marketRiskPremium;
    
    // Alpha (annualized) = Actual return - CAPM expected return
    const alpha = annualizedStockReturn - capmExpectedReturn;
    
    // Excess return over benchmark
    const excessReturn = stockHPR - benchmarkHPR;
    
    // Sharpe Ratio (annualized)
    const sharpeRatio = (annualizedStockReturn - annualRiskFreeRate) / annualizedStockVolatility;
    
    // Treynor Ratio (annualized)
    const treynorRatio = beta !== 0 ? (annualizedStockReturn - annualRiskFreeRate) / beta : 0;
    
    // Information Ratio
    const trackingError = standardDeviation(
        stockReturns.map((r, i) => r - benchmarkReturns[i])
    ) * Math.sqrt(annualizationFactor);
    const infoRatio = trackingError !== 0 ? (annualizedStockReturn - annualizedBenchmarkReturn) / trackingError : 0;
    
    // Linear regression for Security Characteristic Line
    const regression = linearRegression(benchmarkReturns, stockReturns);
    
    return {
        // Risk measures
        beta: beta,
        alpha: alpha,
        volatility: annualizedStockVolatility,
        correlation: corr,
        
        // Return measures
        holdingPeriodReturn: stockHPR,
        annualizedReturn: annualizedStockReturn,
        excessReturn: excessReturn,
        benchmarkReturn: benchmarkHPR,
        
        // Performance ratios
        sharpeRatio: sharpeRatio,
        treynorRatio: treynorRatio,
        infoRatio: infoRatio,
        
        // CAPM
        capmExpectedReturn: capmExpectedReturn,
        marketRiskPremium: marketRiskPremium,
        
        // Regression
        regression: regression,
        
        // Raw data for verification
        tradingDays: tradingDays,
        avgDailyStockReturn: avgStockReturn,
        avgDailyBenchmarkReturn: avgBenchmarkReturn,
        dailyStockVolatility: stockVolatility
    };
}

// Update UI with results
function displayResults(results) {
    document.getElementById('results').style.display = 'block';
    
    // Format and display values
    const formatPercent = (val) => (val * 100).toFixed(2) + '%';
    const formatNumber = (val) => val.toFixed(4);
    
    // Risk measures
    document.getElementById('betaValue').textContent = formatNumber(results.beta);
    document.getElementById('alphaValue').textContent = formatPercent(results.alpha);
    document.getElementById('volatilityValue').textContent = formatPercent(results.volatility);
    document.getElementById('correlationValue').textContent = formatNumber(results.correlation);
    
    // Return measures
    document.getElementById('hprValue').textContent = formatPercent(results.holdingPeriodReturn);
    document.getElementById('annualReturnValue').textContent = formatPercent(results.annualizedReturn);
    document.getElementById('excessReturnValue').textContent = formatPercent(results.excessReturn);
    document.getElementById('benchmarkReturnValue').textContent = formatPercent(results.benchmarkReturn);
    
    // Performance ratios
    document.getElementById('sharpeValue').textContent = formatNumber(results.sharpeRatio);
    document.getElementById('treynorValue').textContent = formatNumber(results.treynorRatio);
    document.getElementById('infoRatioValue').textContent = formatNumber(results.infoRatio);
    
    // CAPM
    document.getElementById('capmExpectedValue').textContent = formatPercent(results.capmExpectedReturn);
    document.getElementById('marketPremiumValue').textContent = formatPercent(results.marketRiskPremium);
    
    // Color coding
    colorCode('excessReturnValue', results.excessReturn);
    colorCode('alphaValue', results.alpha);
    colorCode('sharpeValue', results.sharpeRatio);
    
    // Create charts
    createReturnsChart();
    createRegressionChart(results.regression);
    
    // Create data table for verification
    createDataTable(results);
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Color code positive/negative values
function colorCode(elementId, value) {
    const element = document.getElementById(elementId);
    element.classList.remove('positive', 'negative');
    if (value > 0) {
        element.classList.add('positive');
    } else if (value < 0) {
        element.classList.add('negative');
    }
}

// Create returns comparison chart
function createReturnsChart() {
    const ctx = document.getElementById('returnsChart').getContext('2d');
    
    // Calculate cumulative returns
    let stockCumulative = [0];
    let benchmarkCumulative = [0];
    
    stockReturns.forEach((ret, i) => {
        stockCumulative.push(stockCumulative[i] + ret);
    });
    
    benchmarkReturns.forEach((ret, i) => {
        benchmarkCumulative.push(benchmarkCumulative[i] + ret);
    });
    
    // Destroy existing chart if exists
    if (returnsChart) {
        returnsChart.destroy();
    }
    
    returnsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: stockCumulative.length}, (_, i) => `Day ${i}`),
            datasets: [
                {
                    label: 'Stock Cumulative Return',
                    data: stockCumulative.map(r => r * 100),
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Benchmark Cumulative Return',
                    data: benchmarkCumulative.map(r => r * 100),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#aaa' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    ticks: { 
                        color: '#aaa',
                        callback: (value) => value + '%'
                    },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

// Create regression chart (Security Characteristic Line)
function createRegressionChart(regression) {
    const ctx = document.getElementById('regressionChart').getContext('2d');
    
    // Scatter points
    const scatterData = benchmarkReturns.map((bmRet, i) => ({
        x: bmRet * 100,
        y: stockReturns[i] * 100
    }));
    
    // Regression line
    const minX = Math.min(...benchmarkReturns) * 100;
    const maxX = Math.max(...benchmarkReturns) * 100;
    const lineData = [
        { x: minX, y: (regression.intercept + regression.slope * minX / 100) * 100 },
        { x: maxX, y: (regression.intercept + regression.slope * maxX / 100) * 100 }
    ];
    
    if (regressionChart) {
        regressionChart.destroy();
    }
    
    regressionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Daily Returns',
                    data: scatterData,
                    backgroundColor: 'rgba(0, 212, 255, 0.5)',
                    pointRadius: 4
                },
                {
                    label: `Regression Line (β=${regression.slope.toFixed(2)})`,
                    data: lineData,
                    type: 'line',
                    borderColor: '#ff6b6b',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Benchmark Return (%)',
                        color: '#aaa'
                    },
                    ticks: { color: '#aaa' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Stock Return (%)',
                        color: '#aaa'
                    },
                    ticks: { color: '#aaa' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

// Create data table for verification
function createDataTable(results) {
    const tableContainer = document.getElementById('dataTable');
    
    // Show first 10 and last 5 data points
    const displayReturns = Math.min(15, stockReturns.length);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Stock Return</th>
                    <th>Benchmark Return</th>
                    <th>Excess Return</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 0; i < displayReturns; i++) {
        const excess = stockReturns[i] - benchmarkReturns[i];
        html += `
            <tr>
                <td>Day ${i + 1}</td>
                <td>${(stockReturns[i] * 100).toFixed(4)}%</td>
                <td>${(benchmarkReturns[i] * 100).toFixed(4)}%</td>
                <td>${(excess * 100).toFixed(4)}%</td>
            </tr>
        `;
    }
    
    if (stockReturns.length > 15) {
        html += `<tr><td colspan="4">... (${stockReturns.length - 15} more rows) ...</td></tr>`;
    }
    
    html += `
            </tbody>
        </table>
        <br>
        <h4>Summary Statistics for Excel Verification:</h4>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Formula for Excel</th></tr>
            <tr>
                <td>Number of Daily Returns</td>
                <td>${results.tradingDays}</td>
                <td>COUNT(returns)</td>
            </tr>
            <tr>
                <td>Average Daily Stock Return</td>
                <td>${(results.avgDailyStockReturn * 100).toFixed(6)}%</td>
                <td>=AVERAGE(stock_returns)</td>
            </tr>
            <tr>
                <td>Average Daily Benchmark Return</td>
                <td>${(results.avgDailyBenchmarkReturn * 100).toFixed(6)}%</td>
                <td>=AVERAGE(benchmark_returns)</td>
            </tr>
            <tr>
                <td>Daily Stock Volatility (Std Dev)</td>
                <td>${(results.dailyStockVolatility * 100).toFixed(6)}%</td>
                <td>=STDEV.S(stock_returns)</td>
            </tr>
            <tr>
                <td>Covariance</td>
                <td>${covariance(stockReturns, benchmarkReturns).toFixed(8)}</td>
                <td>=COVARIANCE.S(stock_returns, benchmark_returns)</td>
            </tr>
            <tr>
                <td>Benchmark Variance</td>
                <td>${variance(benchmarkReturns).toFixed(8)}</td>
                <td>=VAR.S(benchmark_returns)</td>
            </tr>
            <tr>
                <td>Beta</td>
                <td>${results.beta.toFixed(4)}</td>
                <td>=COVARIANCE.S(...)/VAR.S(...) or =SLOPE(stock_returns, benchmark_returns)</td>
            </tr>
        </table>
    `;
    
    tableContainer.innerHTML = html;
}

// Fetch data from API (using a free API or sample data)
async function fetchDataAndCalculate() {
    const stockTicker = document.getElementById('stockTicker').value.toUpperCase();
    const benchmarkTicker = document.getElementById('benchmarkTicker').value.toUpperCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value);
    
    // For GitHub Pages, we'll use sample data since we can't make API calls to Yahoo Finance directly
    // In a real implementation, you would use a backend or a CORS-friendly API
    
    alert('Note: Due to browser security restrictions on GitHub Pages, we will use sample data for demonstration.\n\nFor real data, please use the "Enter Data Manually" option and paste your stock prices from Yahoo Finance.');
    
    // Generate sample data for demonstration
    const sampleData = generateSampleData(100, stockTicker, benchmarkTicker);
    
    const results = performCalculations(
        sampleData.stockPrices,
        sampleData.benchmarkPrices,
        riskFreeRate
    );
    
    displayResults(results);
}

// Generate sample data for demonstration
function generateSampleData(days, stockTicker, benchmarkTicker) {
    // Start prices
    let stockPrice = 150;
    let benchmarkPrice = 450;
    
    const stockPrices = [stockPrice];
    const benchmarkPrices = [benchmarkPrice];
    
    // Different characteristics based on ticker
    let stockVolatility = 0.02;
    let stockDrift = 0.0003;
    let beta = 1.2;
    
    if (stockTicker === 'AAPL') {
        stockVolatility = 0.018;
        beta = 1.1;
    } else if (stockTicker === 'MSFT') {
        stockVolatility = 0.016;
        beta = 0.95;
    } else if (stockTicker === 'TSLA') {
        stockVolatility = 0.035;
        beta = 1.8;
    }
    
    for (let i = 1; i < days; i++) {
        // Benchmark follows random walk
        const benchmarkReturn = (Math.random() - 0.5) * 0.02 + 0.0002;
        benchmarkPrice = benchmarkPrice * (1 + benchmarkReturn);
        benchmarkPrices.push(benchmarkPrice);
        
        // Stock correlated with benchmark
        const idiosyncraticReturn = (Math.random() - 0.5) * stockVolatility;
        const stockReturn = beta * benchmarkReturn + idiosyncraticReturn + stockDrift;
        stockPrice = stockPrice * (1 + stockReturn);
        stockPrices.push(stockPrice);
    }
    
    return { stockPrices, benchmarkPrices };
}

// Calculate from manually entered data
function calculateFromManual() {
    const stockPricesText = document.getElementById('stockPrices').value;
    const benchmarkPricesText = document.getElementById('benchmarkPrices').value;
    const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value);
    
    // Parse prices
    const stockPrices = stockPricesText.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    const benchmarkPrices = benchmarkPricesText.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    
    if (stockPrices.length < 2 || benchmarkPrices.length < 2) {
        alert('Please enter at least 2 prices for each series.');
        return;
    }
    
    if (stockPrices.length !== benchmarkPrices.length) {
        alert('Stock and benchmark must have the same number of prices.');
        return;
    }
    
    const results = performCalculations(stockPrices, benchmarkPrices, riskFreeRate);
    displayResults(results);
}

// Export data for Excel verification
function exportToCSV() {
    let csv = 'Day,Stock Return,Benchmark Return,Excess Return\n';
    
    for (let i = 0; i < stockReturns.length; i++) {
        const excess = stockReturns[i] - benchmarkReturns[i];
        csv += `${i + 1},${stockReturns[i]},${benchmarkReturns[i]},${excess}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data_verification.csv';
    a.click();
}
