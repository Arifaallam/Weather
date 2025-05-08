const API_KEY = 'YOUR_API_KEY'; //// API key for OpenWeatherMap (replace with your own if needed)

// Fetch current weather by city name
async function fetchWeatherByCity(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Invalid city or network error');
    return response.json();
}

// Fetch 5-day forecast by city name
async function fetchForecastByCity(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Invalid city or network error');
    return response.json();
}

// Fetch current weather by geographic coordinates
async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Error fetching weather data');
    return response.json();
}

// Fetch 5-day forecast by geographic coordinates
async function fetchForecastByCoords(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Error fetching forecast data');
    return response.json();
}

// Get references to HTML elements
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const locateBtn = document.getElementById('locateBtn');
const recentCitiesDropdown = document.getElementById('recentCities');
const currentWeatherDiv = document.getElementById('currentWeather');
const extendedForecastDiv = document.getElementById('extendedForecast');
const errorMsgDiv = document.getElementById('errorMsg');

// Load recent cities from local storage (or start with empty list)
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Populate the dropdown with recent cities
function populateRecentCities() {
    recentCitiesDropdown.innerHTML = '<option value="">Select a city</option>';
    recentCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        recentCitiesDropdown.appendChild(option);
    });
}

// Save a city to recent cities (max 5), update dropdown and local storage
function saveRecentCity(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) recentCities.pop();
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        populateRecentCities();
    }
}

// Update the current weather display section
function displayCurrentWeather(data) {
    const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    currentWeatherDiv.innerHTML = `
        <h2 class="text-2xl sm:text-3xl font-semibold mb-4 text-gray-800">${data.name}</h2>
        <img src="${iconUrl}" alt="${data.weather[0].description}" class="w-16 h-16 mx-auto mb-4" />
        <p class="text-lg sm:text-xl text-gray-700">Temperature: ${data.main.temp}°C</p>
        <p class="text-lg sm:text-xl text-gray-700">Humidity: ${data.main.humidity}%</p>
        <p class="text-lg sm:text-xl text-gray-700">Wind Speed: ${data.wind.speed} m/s</p>
    `;
}

// Update the extended 5-day forecast display section
function displayForecast(forecastData) {
    const forecastPerDay = {};
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!forecastPerDay[date]) forecastPerDay[date] = [];
        forecastPerDay[date].push(item);
    });

    const days = Object.keys(forecastPerDay).slice(0, 5);
    let html = '';

    days.forEach(day => {
        const dayData = forecastPerDay[day].find(item => item.dt_txt.includes('12:00')) || forecastPerDay[day][0];
        const date = new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const icon = `http://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png`;
        html += `
            <div class="bg-white bg-opacity-80 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <h3 class="font-semibold text-gray-800 mb-2">${date}</h3>
                <img src="${icon}" alt="${dayData.weather[0].description}" class="w-12 h-12 mx-auto mb-2"/>
                <p class="text-gray-700">Temp: ${dayData.main.temp}°C</p>
                <p class="text-gray-700">Wind: ${dayData.wind.speed} m/s</p>
                <p class="text-gray-700">Humidity: ${dayData.main.humidity}%</p>
            </div>
        `;
    });

    extendedForecastDiv.innerHTML = html;
}

// Handle search form submission (search by city)
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    errorMsgDiv.textContent = '';
    if (!city) {
        errorMsgDiv.textContent = 'Please enter a city name.';
        return;
    }
    try {
        const weatherData = await fetchWeatherByCity(city);
        displayCurrentWeather(weatherData);
        const forecastData = await fetchForecastByCity(city);
        displayForecast(forecastData);
        saveRecentCity(city);
    } catch (err) {
        errorMsgDiv.textContent = err.message;
    }
});

// Handle recent city selection from dropdown
recentCitiesDropdown.addEventListener('change', async () => {
    const city = recentCitiesDropdown.value;
    if (!city) return;
    errorMsgDiv.textContent = '';
    try {
        const weatherData = await fetchWeatherByCity(city);
        displayCurrentWeather(weatherData);
        const forecastData = await fetchForecastByCity(city);
        displayForecast(forecastData);
    } catch (err) {
        errorMsgDiv.textContent = err.message;
    }
});

// Handle "Use Current Location" button click
locateBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            errorMsgDiv.textContent = '';
            try {
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                displayCurrentWeather(weatherData);
                const forecastData = await fetchForecastByCoords(latitude, longitude);
                displayForecast(forecastData);
            } catch (err) {
                errorMsgDiv.textContent = err.message;
            }
        }, () => {
            errorMsgDiv.textContent = 'Unable to retrieve your location';
        });
    }
});

// Initialize dropdown with saved cities on page load
populateRecentCities();
