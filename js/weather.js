document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("weatherChart").getContext("2d");
    const weatherView = document.getElementById("weatherView");
    const temperatureUnit = document.getElementById("temperatureUnit");
    const weatherCardsContainer = document.getElementById("weatherCards");
    const addCityBtn = document.getElementById("addCityBtn");
    const searchCityBtn = document.getElementById("searchCityBtn");
    const citySearch = document.getElementById("citySearch");
    const citySearchResults = document.getElementById("citySearchResults");
    
    let weatherChart = null;
    const apiKey = "8b75b75be1c0eece77407f3ecebfe195"; // Replace with your OpenWeatherMap API key
    
    // Default cities
    let cities = [
      { name: "Glasgow", id: 2648579 },
      { name: "Edinburgh", id: 2650225 },
      { name: "London", id: 2643743 },
      { name: "New York", id: 5128581 }
    ];
    
    // Load saved cities from localStorage if available
    const loadSavedCities = () => {
      const savedCities = localStorage.getItem('weatherDashboardCities');
      if (savedCities) {
        try {
          cities = JSON.parse(savedCities);
        } catch (e) {
          console.error("Error loading saved cities:", e);
          // If there's an error, use the default cities
        }
      }
    };
    
    // Save cities to localStorage
    const saveCities = () => {
      localStorage.setItem('weatherDashboardCities', JSON.stringify(cities));
    };
    
    // Try to load saved cities
    loadSavedCities();
    
    // Function to create a loading indicator
    function createLoadingIndicator(parentId) {
      const parent = document.getElementById(parentId).parentElement;
      const existingIndicator = parent.querySelector(".loading-indicator");
      
      if (existingIndicator) {
        return existingIndicator;
      }
      
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "text-center p-5 loading-indicator";
      loadingDiv.innerHTML = "Loading weather data...";
      parent.appendChild(loadingDiv);
      return loadingDiv;
    }
    
    // Function to remove city
    function removeCity(cityId) {
      cities = cities.filter(city => city.id !== cityId);
      saveCities();
      fetchWeatherData();
    }
    
    // Function to show weather cards
    function showWeatherCards(weatherData) {
      weatherCardsContainer.innerHTML = "";
      
      weatherData.forEach(city => {
        const temp = city.main.temp;
        const unit = temperatureUnit.value === 'metric' ? '°C' : temperatureUnit.value === 'imperial' ? '°F' : 'K';
        const weatherIcon = city.weather[0].icon;
        const weatherDesc = city.weather[0].description;
        const humidity = city.main.humidity;
        const windSpeed = city.wind.speed;
        const pressure = city.main.pressure;
        const windUnit = temperatureUnit.value === 'imperial' ? 'mph' : 'm/s';
        
        const card = document.createElement("div");
        card.className = "col-lg-3 col-md-6 mb-4";
        card.innerHTML = `
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="m-0">${city.name}</h5>
              <button class="btn btn-sm btn-outline-danger remove-city" data-city-id="${city.id}">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <div class="card-body text-center">
              <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="${weatherDesc}" class="mb-2">
              <h3>${Math.round(temp)}${unit}</h3>
              <p class="text-capitalize mb-0">${weatherDesc}</p>
              <div class="row mt-3">
                <div class="col-4">
                  <small class="d-block text-muted">Humidity</small>
                  <span>${humidity}%</span>
                </div>
                <div class="col-4">
                  <small class="d-block text-muted">Wind</small>
                  <span>${Math.round(windSpeed)} ${windUnit}</span>
                </div>
                <div class="col-4">
                  <small class="d-block text-muted">Pressure</small>
                  <span>${pressure} hPa</span>
                </div>
              </div>
            </div>
          </div>
        `;
        weatherCardsContainer.appendChild(card);
        
        // Add event listener to remove button
        const removeBtn = card.querySelector(".remove-city");
        removeBtn.addEventListener("click", () => {
          removeCity(city.id);
        });
      });
    }
    
    // Function to create or update the chart
    function updateWeatherChart(weatherData) {
      // Define chart colors
      const chartColors = [
        '#3498db', '#2980b9', '#1abc9c', '#f39c12', 
        '#e74c3c', '#9b59b6', '#34495e', '#2ecc71', 
        '#d35400', '#c0392b', '#7f8c8d', '#27ae60'
      ];
      
      // Get data based on the selected view
      const labels = weatherData.map(city => city.name);
      let data;
      let label;
      let unit;
      
      switch(weatherView.value) {
        case 'temperature':
          data = weatherData.map(city => city.main.temp);
          unit = temperatureUnit.value === 'metric' ? '°C' : temperatureUnit.value === 'imperial' ? '°F' : 'K';
          label = `Temperature (${unit})`;
          break;
        case 'humidity':
          data = weatherData.map(city => city.main.humidity);
          unit = '%';
          label = 'Humidity (%)';
          break;
        case 'windspeed':
          data = weatherData.map(city => city.wind.speed);
          unit = temperatureUnit.value === 'imperial' ? 'mph' : 'm/s';
          label = `Wind Speed (${unit})`;
          break;
        case 'pressure':
          data = weatherData.map(city => city.main.pressure);
          unit = 'hPa';
          label = 'Pressure (hPa)';
          break;
        default:
          data = weatherData.map(city => city.main.temp);
          unit = temperatureUnit.value === 'metric' ? '°C' : temperatureUnit.value === 'imperial' ? '°F' : 'K';
          label = `Temperature (${unit})`;
      }
      
      // Destroy existing chart if it exists
      if (weatherChart !== null) {
        weatherChart.destroy();
      }
      
      // Create new chart
      weatherChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: data,
            backgroundColor: labels.map((_, index) => chartColors[index % chartColors.length]),
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  return `${label}: ${value}${unit === '°C' || unit === '°F' || unit === 'K' ? '' : ' '}${unit}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "City",
                font: {
                  weight: 'bold'
                }
              },
              grid: {
                display: false
              }
            },
            y: {
              title: {
                display: true,
                text: label,
                font: {
                  weight: 'bold'
                }
              },
              beginAtZero: weatherView.value === 'humidity' || weatherView.value === 'windspeed',
              ticks: {
                callback: function(value) {
                  return `${value}${unit === '°C' || unit === '°F' || unit === 'K' ? '' : ' '}${unit}`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
    }
    
    // Function to fetch weather data
    function fetchWeatherData() {
      // Show loading indicator
      const loadingIndicator = createLoadingIndicator("weatherChart");
      
      // Clear existing content
      weatherCardsContainer.innerHTML = "";
      
      // Check if we have cities to display
      if (cities.length === 0) {
        loadingIndicator.remove();
        weatherCardsContainer.innerHTML = `
          <div class="col-12 text-center py-5">
            <p>No cities added. Click the "Add City" button to add cities to the dashboard.</p>
          </div>
        `;
        
        // Clear chart
        if (weatherChart !== null) {
          weatherChart.destroy();
          weatherChart = null;
        }
        
        return;
      }
      
      Promise.all(
        cities.map(city =>
          fetch(`https://api.openweathermap.org/data/2.5/weather?id=${city.id}&appid=${apiKey}&units=${temperatureUnit.value}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
              }
              return res.json();
            })
        )
      ).then(results => {
        // Remove loading indicator
        loadingIndicator.remove();
        
        // Update weather cards
        showWeatherCards(results);
        
        // Update chart
        updateWeatherChart(results);
      }).catch(error => {
        // Remove loading indicator and show error
        loadingIndicator.remove();
        
        weatherCardsContainer.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger">
              Error loading weather data: ${error.message}
            </div>
          </div>
        `;
        
        console.error("Error fetching weather data:", error);
      });
    }
    
    // Function to search for cities
    function searchCity(query) {
      if (!query.trim()) return;
      
      citySearchResults.innerHTML = `<div class="text-center py-3">Searching...</div>`;
      
      fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&appid=${apiKey}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          citySearchResults.innerHTML = '';
          
          if (data.count === 0) {
            citySearchResults.innerHTML = `<div class="alert alert-warning">No cities found matching "${query}"</div>`;
            return;
          }
          
          // Display results
          data.list.forEach(city => {
            // Check if city is already in our list
            const isAlreadyAdded = cities.some(c => c.id === city.id);
            
            const resultItem = document.createElement('button');
            resultItem.className = `list-group-item list-group-item-action ${isAlreadyAdded ? 'disabled' : ''}`;
            resultItem.innerHTML = `
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>${city.name}</strong>, ${city.sys.country}
                  <small class="d-block text-muted">${city.coord.lat.toFixed(2)}, ${city.coord.lon.toFixed(2)}</small>
                </div>
                ${isAlreadyAdded ? '<span class="badge bg-secondary">Already Added</span>' : ''}
              </div>
            `;
            
            if (!isAlreadyAdded) {
              resultItem.addEventListener('click', () => {
                // Add city to the list
                cities.push({ name: city.name, id: city.id });
                saveCities();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCityModal'));
                modal.hide();
                
                // Reload data
                fetchWeatherData();
              });
            }
            
            citySearchResults.appendChild(resultItem);
          });
        })
        .catch(error => {
          citySearchResults.innerHTML = `<div class="alert alert-danger">Error searching for cities: ${error.message}</div>`;
          console.error("Error searching for cities:", error);
        });
    }
    
    // Add event listener to add city button
    addCityBtn.addEventListener("click", () => {
      // Reset the search
      citySearch.value = '';
      citySearchResults.innerHTML = '';
      
      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById('addCityModal'));
      modal.show();
    });
    
    // Add event listener to search button
    searchCityBtn.addEventListener("click", () => {
      searchCity(citySearch.value);
    });
    
    // Also search when pressing enter in the search field
    citySearch.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        searchCity(citySearch.value);
      }
    });
    
    // Add event listeners for view and unit changes
    weatherView.addEventListener("change", fetchWeatherData);
    temperatureUnit.addEventListener("change", fetchWeatherData);
    
    // Initial data fetch
    fetchWeatherData();
  });