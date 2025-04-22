document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
    const cryptoSelect = document.getElementById("cryptoSelect");
    const timeRangeSelect = document.getElementById("timeRangeSelect");
    let cryptoChart = null;
  
    // Helper function to format time ranges for display
    function getTimeRangeText(days) {
      if (days === "max") return "All Time";
      if (days <= 0.04) return "Past Hour";
      if (days <= 1) return "Past Day";
      if (days <= 7) return "Past 7 Days";
      if (days <= 30) return "Past Month";
      if (days <= 90) return "Past 3 Months";
      if (days <= 365) return "Past Year";
      return `Past ${days} Days`;
    }
    
    // Function to create a loading indicator
    function createLoadingIndicator(parentId) {
      const parent = document.getElementById(parentId).parentElement;
      const existingIndicator = parent.querySelector(".loading-indicator");
      
      if (existingIndicator) {
        return existingIndicator;
      }
      
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "text-center p-5 loading-indicator";
      loadingDiv.innerHTML = "Loading cryptocurrency data...";
      parent.appendChild(loadingDiv);
      return loadingDiv;
    }
    
    // Function to remove existing price change element if it exists
    function removePriceChangeElement() {
      const parentElement = document.getElementById("cryptoChart").parentElement;
      const existingPriceChangeElement = parentElement.querySelector(".price-change");
      
      if (existingPriceChangeElement) {
        existingPriceChangeElement.remove();
      }
    }
    
    // Helper function to format date labels based on time range
    function formatDateLabels(timestamp, timeRange) {
      const date = new Date(timestamp);
      
      if (timeRange <= 0.04) { // 1 hour
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange <= 1) { // 1 day
        return date.toLocaleTimeString('en-US', { hour: '2-digit' });
      } else if (timeRange <= 7) { // 7 days
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeRange <= 30) { // 1 month
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else { // > 1 month
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
    }
  
    // Function to fetch and display data for selected cryptocurrency and time range
    function fetchCryptoData(cryptoId, timeRange) {
      // Show loading indicator
      const loadingIndicator = createLoadingIndicator("cryptoChart");
      
      // Clear any existing price change display
      removePriceChangeElement();
      
      // Destroy existing chart if it exists
      if (cryptoChart !== null) {
        cryptoChart.destroy();
      }
  
      fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${timeRange}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          // Remove loading indicator
          loadingIndicator.remove();
          
          const prices = data.prices;
          
          // Format dates for labels based on time range
          const labels = prices.map(item => formatDateLabels(item[0], parseFloat(timeRange)));
          
          // For short time ranges, we may have too many data points. Let's sample them.
          let sampledPrices = prices;
          
          // For long time ranges, sample the data to avoid overcrowding
          if (timeRange === "max" || timeRange >= 365) {
            // Weekly samples for long time ranges
            sampledPrices = prices.filter((_, index) => index % 7 === 0);
          } else if (timeRange >= 30) {
            // Daily samples for medium time ranges
            sampledPrices = prices.filter((_, index) => index % 3 === 0);
          }
          
          // For hourly data, make sure we don't have too many points
          if (timeRange <= 0.04) {
            // Limit to one sample every few minutes
            sampledPrices = prices.filter((_, index) => index % 2 === 0);
          }
          
          // Use the sampled data for labels and values
          const sampledLabels = sampledPrices.map(item => formatDateLabels(item[0], parseFloat(timeRange)));
          const values = sampledPrices.map(item => parseFloat(item[1].toFixed(2)));
          
          // Calculate price change percentage
          const firstPrice = values[0];
          const lastPrice = values[values.length - 1];
          const priceChange = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
          const isPositive = priceChange >= 0;
          
          // Get time range text for display
          const timeRangeText = getTimeRangeText(parseFloat(timeRange));
          
          // Get crypto symbol and name
          let cryptoSymbol = "BTC";
          let cryptoName = "Bitcoin";
          
          switch(cryptoId) {
            case "ethereum":
              cryptoSymbol = "ETH";
              cryptoName = "Ethereum";
              break;
            case "ripple":
              cryptoSymbol = "XRP";
              cryptoName = "Ripple";
              break;
            case "cardano":
              cryptoSymbol = "ADA";
              cryptoName = "Cardano";
              break;
            case "solana":
              cryptoSymbol = "SOL";
              cryptoName = "Solana";
              break;
            case "dogecoin":
              cryptoSymbol = "DOGE";
              cryptoName = "Dogecoin";
              break;
            default:
              cryptoSymbol = "BTC";
              cryptoName = "Bitcoin";
          }
          
          // Display price change
          const parentElement = document.getElementById("cryptoChart").parentElement;
          const priceChangeElement = document.createElement("div");
          priceChangeElement.className = `text-end mt-3 mb-2 fw-bold price-change ${isPositive ? 'text-success' : 'text-danger'}`;
          priceChangeElement.innerHTML = `${timeRangeText} change: ${isPositive ? '+' : ''}${priceChange}%`;
          parentElement.appendChild(priceChangeElement);
          
          // Get color based on cryptocurrency
          const cryptoColors = {
            "bitcoin": "#f39c12",
            "ethereum": "#627EEA",
            "ripple": "#23292F",
            "cardano": "#0033AD",
            "solana": "#14F195",
            "dogecoin": "#C2A633"
          };
          
          const color = cryptoColors[cryptoId] || "#f39c12";
          
          // Set chart type based on time range
          const chartType = timeRange <= 0.04 ? "line" : "line";
          
          // Create chart
          cryptoChart = new Chart(ctx, {
            type: chartType,
            data: {
              labels: sampledLabels,
              datasets: [{
                label: `${cryptoName} (${cryptoSymbol}) Price (USD) - ${timeRangeText}`,
                data: values,
                borderColor: color,
                backgroundColor: `${color}20`,  // Add transparency
                borderWidth: 3,
                pointRadius: sampledLabels.length > 50 ? 0 : 4,  // Hide points if there are too many
                pointBackgroundColor: color,
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    font: {
                      size: 14,
                      weight: 'bold'
                    }
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context) {
                      return `Price: $${context.raw.toLocaleString()}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: timeRange <= 1 ? "Time" : "Date",
                    font: {
                      weight: 'bold'
                    }
                  },
                  grid: {
                    display: false
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 15
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: "Price in USD",
                    font: {
                      weight: 'bold'
                    }
                  },
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              },
              interaction: {
                mode: 'nearest',
                intersect: false
              },
              animation: {
                duration: 1000,
                easing: 'easeOutQuart'
              }
            }
          });
        })
        .catch((error) => {
          // Remove loading indicator and show error
          loadingIndicator.remove();
          
          // Remove any existing error messages
          const existingErrors = document.querySelectorAll(".crypto-error");
          existingErrors.forEach(el => el.remove());
          
          // Create error message
          const errorDiv = document.createElement("div");
          errorDiv.className = "alert alert-danger crypto-error";
          errorDiv.innerHTML = `Error loading cryptocurrency data: ${error.message}`;
          
          const parentElement = document.getElementById("cryptoChart").parentElement;
          parentElement.appendChild(errorDiv);
          
          console.error("Error fetching crypto data:", error);
        });
    }
    
    // Initial data load with default selections
    fetchCryptoData(cryptoSelect.value, timeRangeSelect.value);
    
    // Add event listeners for dropdown changes
    cryptoSelect.addEventListener("change", () => {
      fetchCryptoData(cryptoSelect.value, timeRangeSelect.value);
    });
    
    timeRangeSelect.addEventListener("change", () => {
      fetchCryptoData(cryptoSelect.value, timeRangeSelect.value);
    });
  });