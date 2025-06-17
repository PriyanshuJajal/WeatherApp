// --- API Configuration ---
// Open-Meteo Geocoding API endpoint to convert city names to coordinates
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Open-Meteo Weather Forecast API endpoint to get weather data
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Variable to store the currently displayed weather data
let currentWeatherData = null;

document.addEventListener('DOMContentLoaded', function () {
    // Automatically searches for Ahmedabad weather on page load as a default
    searchWeatherByCity('Ahmedabad');
});

function handleKeyPress(e) {
    // If the pressed key is 'Enter', trigger the weather search
    if (e.key === 'Enter') {
        searchWeather();
    }
}

// --- Core Weather Search Functions ---
function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
        searchWeatherByCity(city);
    } else {
        showError('Please enter a city name');
    }
}

// Attempts to get the user's current geographical location and then fetches weather data for it.
function getCurrentLocation() {
    // Check if the browser supports the Geolocation API.
    if (navigator.geolocation) {
        showLoading(); // Show a loading indicator while fetching location.
        // Request the user's current position. This will prompt the user for permission.
        navigator.geolocation.getCurrentPosition(
            // Success callback: Executed if geolocation is successful. `position` object contains coordinates.
            (position) => {
                const lat = position.coords.latitude; 
                const lon = position.coords.longitude; 
                searchWeatherByCoordinates(lat, lon); 
            },
            // Error callback: Executed if geolocation fails (e.g., user denies permission, location unavailable).
            (error) => {
                hideLoading(); // Hide the loading indicator.
    
                showError('Unable to get your location. Please search for a city manually:(');
            }
        );
    } else {
        // If the browser does not support geolocation, display an appropriate error message.
        showError('Geolocation is not supported by this browser:(');
    }
}

// Asynchronously fetches weather data based on a city name.
async function searchWeatherByCity(city) {
    showLoading(); // Show loading indicator.

    try {
        // Use the Open-Meteo Geocoding API to convert the city name into geographical coordinates (latitude and longitude).
        // `encodeURIComponent` ensures the city name is properly formatted for a URL. `count=1` requests only the best match.
        const geoResponse = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoResponse.json(); 

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found'); 
        }

        const location = geoData.results[0]; // Get the first (most relevant) location result.

        // Use the Open-Meteo Weather API with the obtained coordinates to get current weather data.
        // IMPORTANT: The 'current' parameter lists ONLY the variables available for the 'current' endpoint.

        const weatherResponse = await fetch(
            `${WEATHER_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`
        );
        const weatherData = await weatherResponse.json(); 

        // --- Estimated Visibility Logic ---
        let estimatedVisibility;
        const tempC = weatherData.current.temperature_2m;
        const weatherCode = weatherData.current.weather_code;

        // Simple estimation based on temperature and weather code
        if (weatherCode === 45 || weatherCode === 48) { // Fog or rime fog
            estimatedVisibility = 0.5; // Very low visibility
        } else if (weatherCode >= 51 && weatherCode <= 65) { // Drizzle or Rain
            estimatedVisibility = 3; // Reduced visibility due to precipitation
        } else if (tempC < 0) { // Below freezing
            estimatedVisibility = 8; // Good, but potential for light haze/frost if other factors present
        } else if (tempC > 30) { // Hot
            estimatedVisibility = 7; // Good, but potential for heat haze
        } else {
            estimatedVisibility = 10; // Default good visibility
        }

        // Transform the raw API response into a more digestible format for displaying in the app.
        const transformedData = {
            name: location.name, // City name
            country: location.country_code || location.country || '', // Country code or full country name, if available
            temperature: Math.round(tempC), // Current temperature, rounded to nearest integer
            feels_like: Math.round(weatherData.current.apparent_temperature), // "Feels like" temperature, rounded
            humidity: weatherData.current.relative_humidity_2m, // Humidity percentage
            wind_speed: weatherData.current.wind_speed_10m, // Wind speed at 10 meters above ground (in m/s by default from API)
            weather_code: weatherData.current.weather_code, // Numerical weather interpretation code
            visibility: estimatedVisibility // Use our new estimated visibility
        };

        displayWeather(transformedData); // Call function to update the UI with the fetched data.
        hideLoading(); // Hide the loading indicator.

    } catch (error) {
        hideLoading(); 
        showError(`Error fetching weather data: ${error.message}`); 
    }
}

// Asynchronously fetches weather data based on provided latitude and longitude.
async function searchWeatherByCoordinates(lat, lon) {
    showLoading(); // Show loading indicator.

    try {
        // Fetch current weather data using the provided coordinates.

        const weatherResponse = await fetch(
            `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`
        );
        const weatherData = await weatherResponse.json(); 

        // Perform reverse geocoding to get a human-readable city name from the coordinates.
        const geoResponse = await fetch(`${GEOCODING_URL}?latitude=${lat}&longitude=${lon}&count=1`);
        const geoData = await geoResponse.json();

        const locationName = geoData.results && geoData.results.length > 0
            ? geoData.results[0].name
            : 'Your Location';

        let estimatedVisibility;
        const tempC = weatherData.current.temperature_2m;
        const weatherCode = weatherData.current.weather_code;

        if (weatherCode === 45 || weatherCode === 48) { // Fog or rime fog
            estimatedVisibility = 0.5; // Very low visibility
        } else if (weatherCode >= 51 && weatherCode <= 65) { // Drizzle or Rain
            estimatedVisibility = 3; // Reduced visibility due to precipitation
        } else if (tempC < 0) { // Below freezing
            estimatedVisibility = 8; // Good, but potential for light haze/frost if other factors present
        } else if (tempC > 30) { // Hot
            estimatedVisibility = 7; // Good, but potential for heat haze
        } else {
            estimatedVisibility = 10; // Default good visibility
        }

        // Transform the raw API response into a more digestible format.
        const transformedData = {
            name: locationName,
            country: geoData.results && geoData.results.length > 0
                ? (geoData.results[0].country_code || geoData.results[0].country || '')
                : '',
            temperature: Math.round(tempC),
            feels_like: Math.round(weatherData.current.apparent_temperature),
            humidity: weatherData.current.relative_humidity_2m,
            wind_speed: weatherData.current.wind_speed_10m,
            weather_code: weatherData.current.weather_code,
            visibility: estimatedVisibility 
        };

        displayWeather(transformedData); // Update the UI.
        hideLoading();

    } catch (error) {
        hideLoading(); 
        showError(`Error fetching weather data: ${error.message}`); 
    }
}

// --- UI Update Functions ---
function displayWeather(data) {
    currentWeatherData = data; // Store the current weather data globally.

    const cityNameElement = document.getElementById('cityName');
    const currentDateElement = document.getElementById('currentDate');
    const temperatureElement = document.getElementById('temperature');
    const weatherDescriptionElement = document.getElementById('weatherDescription');
    const weatherIconElement = document.getElementById('weatherIcon');
    const visibilityElement = document.getElementById('visibility');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('windSpeed');
    const feelsLikeElement = document.getElementById('feelsLike');
    const weatherDisplayElement = document.getElementById('weatherDisplay');

    if (cityNameElement) {
        cityNameElement.textContent = `${data.name}${data.country ? ', ' + data.country : ''}`;
    }

    if (currentDateElement) {
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',   // e.g., "Monday"
            year: 'numeric',   // e.g., "2025"
            month: 'long',     // e.g., "June"
            day: 'numeric'     // e.g., "16"
        });
    }

    if (temperatureElement) {
        temperatureElement.textContent = `${data.temperature}°C`;
    }

    // Get the human-readable description and Font Awesome icon class based on the weather code.
    const weatherInfo = getWeatherInfo(data.weather_code);
    if (weatherDescriptionElement) {
        weatherDescriptionElement.textContent = weatherInfo.description;
    }

    if (weatherIconElement) {
        weatherIconElement.className = weatherInfo.icon; // This updates the Font Awesome icon.
    }

    if (visibilityElement) {
        visibilityElement.textContent = `${data.visibility} km`;
    }

    if (humidityElement) {
        humidityElement.textContent = `${data.humidity}%`;
    }

    if (windSpeedElement) {
        // Converted wind speed from meters/second (API default) to kilometers/hour and rounded it.
        windSpeedElement.textContent = `${Math.round(data.wind_speed * 3.6)} km/h`;
    }

    if (feelsLikeElement) {
        feelsLikeElement.textContent = `${data.feels_like}°C`;
    }

    if (weatherDisplayElement) {
        weatherDisplayElement.style.display = 'block';
    }
    hideError(); 
}

// Maps Open-Meteo's numerical weather codes to user-friendly descriptions and Font Awesome icon classes.
function getWeatherInfo(code) {
    const weatherCodes = {
        0: { description: 'Clear sky', icon: 'fas fa-sun text-warning' },
        1: { description: 'Mainly clear', icon: 'fas fa-sun text-warning' },
        2: { description: 'Partly cloudy', icon: 'fas fa-cloud-sun text-info' },
        3: { description: 'Overcast', icon: 'fas fa-cloud text-secondary' },
        45: { description: 'Foggy', icon: 'fas fa-smog text-muted' },
        48: { description: 'Depositing rime fog', icon: 'fas fa-smog text-muted' },
        51: { description: 'Light drizzle', icon: 'fas fa-cloud-drizzle text-info' },
        53: { description: 'Moderate drizzle', icon: 'fas fa-cloud-drizzle text-info' },
        55: { description: 'Dense drizzle', icon: 'fas fa-cloud-drizzle text-info' },
        61: { description: 'Slight rain', icon: 'fas fa-cloud-rain text-primary' },
        63: { description: 'Moderate rain', icon: 'fas fa-cloud-rain text-primary' },
        65: { description: 'Heavy rain', icon: 'fas fa-cloud-showers-heavy text-primary' },
        71: { description: 'Slight snow', icon: 'fas fa-snowflake text-light' },
        73: { description: 'Moderate snow', icon: 'fas fa-snowflake text-light' },
        75: { description: 'Heavy snow', icon: 'fas fa-snowflake text-light' },
        95: { description: 'Thunderstorm', icon: 'fas fa-bolt text-warning' },
        96: { description: 'Thunderstorm with hail', icon: 'fas fa-bolt text-warning' },
        99: { description: 'Thunderstorm with heavy hail', icon: 'fas fa-bolt text-warning' }
    };

    // Return the corresponding description and icon based on the code, or a default 'Unknown' if the code is not found.
    return weatherCodes[code] || { description: 'Unknown', icon: 'fas fa-question text-muted' };
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    const weatherDisplayElement = document.getElementById('weatherDisplay');

    if (loadingElement) {
        loadingElement.classList.add('show'); // Add the 'show' class to make the loading spinner visible.
    }
    if (weatherDisplayElement) {
        weatherDisplayElement.style.display = 'none'; 
    }
    hideError(); 
}

// Hides the loading spinner.
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.remove('show'); 
    }
}

// Displays an error message to the user and hides the weather display.
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const weatherDisplayElement = document.getElementById('weatherDisplay');

    if (errorElement) {
        errorElement.textContent = message; 
        errorElement.style.display = 'block'; 
    } else {
        console.error("Error: 'errorMessage' element not found in the DOM.");
    }

    if (weatherDisplayElement) {
        weatherDisplayElement.style.display = 'none'; 
    }
}

// Hides the error message.
function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none'; 
    }
}