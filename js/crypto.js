document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("cryptoChart").getContext("2d");
  
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7")
      .then((res) => res.json())
      .then((data) => {
        const prices = data.prices;
        const labels = prices.map(item => new Date(item[0]).toLocaleDateString());
        const values = prices.map(item => item[1]);
  
        new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [{
              label: "Bitcoin Price (USD)",
              data: values,
              borderColor: "#f39c12",
              backgroundColor: "rgba(243, 156, 18, 0.1)",
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date"
                }
              },
              y: {
                title: {
                  display: true,
                  text: "Price in USD"
                }
              }
            }
          }
        });
      })
      .catch((error) => {
        console.error("Error fetching crypto data:", error);
      });
  });