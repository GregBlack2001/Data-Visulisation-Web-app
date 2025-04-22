document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("weatherChart").getContext("2d");
  
    const cities = [
      { name: "Glasgow", id: 2648579 },
      { name: "Edinburgh", id: 2650225 },
      { name: "London", id: 2643743 },
      { name: "New York", id: 5128581 }
    ];
  
    const apiKey = "8b75b75be1c0eece77407f3ecebfe195"; // Replace with your OpenWeatherMap API key
  
    Promise.all(
      cities.map(city =>
        fetch(`https://api.openweathermap.org/data/2.5/weather?id=${city.id}&appid=${apiKey}&units=metric`)
          .then(res => res.json())
      )
    ).then(results => {
      const labels = results.map(r => r.name);
      const temps = results.map(r => r.main.temp);
  
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Temperature (°C)",
            data: temps,
            backgroundColor: "#3498db"
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "City"
              }
            },
            y: {
              title: {
                display: true,
                text: "Temperature (°C)"
              },
              beginAtZero: true
            }
          }
        }
      });
    }).catch(error => {
      console.error("Error fetching weather data:", error);
    });
  });