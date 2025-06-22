# ☁️ Fully Functional Weather App
This is a clean, responsive web application that displays current weather conditions for any city or country worldwide, powered by the Open-Meteo API.

# ✨ Features
1. Current Weather Display: Get real-time temperature, "feels like" temperature, humidity, wind speed, and estimated visibility.
2. City Search: Easily look up weather for any city by typing its name.
3. Current Location: Use your browser's geolocation to get weather data for your current position.
4. Dynamic Icons: Weather conditions are represented by intuitive Font Awesome icons.
5. Responsive Design: Optimized for seamless viewing on various devices (desktops, tablets, mobile phones) and screen orientations.
6. Estimated Visibility: Provides an estimated visibility value based on temperature and weather conditions, as direct visibility data is not offered by the API for current weather.
7. Loading & Error Handling: User-friendly loading indicators and error messages.


# ⚙️ How it Works
The application uses two main endpoints from the Open-Meteo API:
1. Geocoding API: Converts city names into geographical coordinates (latitude and longitude).
2. Weather Forecast API (/v1/forecast): Fetches current weather data using the obtained coordinates.

#### Note on Visibility: The Open-Meteo API's current weather endpoint does not provide direct visibility data. This app includes a custom, simplistic logic to estimate visibility based on temperature and weather conditions (e.g., fog, rain). This is an approximation and not a precise measurement.

#### Why data might differ from other sources (like Google): Weather data(specially wind speed) can vary slightly between different providers because they use diverse meteorological models, data sources, and update frequencies. This is normal in meteorology and doesn't indicate an error in the app's functionality.

# 🚀 Technologies Used
1. HTML5: Structure of the web page.
2. CSS3: Styling and visual presentation.
3. JavaScript (ES6+): Application logic, Asynchronous Programming, API calls, and DOM manipulation.
4. Bootstrap 5: For responsive layout, styling components, and utility classes.
5. Font Awesome 6: For scalable vector weather icons.
6. Open-Meteo API: Free and open-source weather data.

# 🙏 Feedback and Suggestions
Your feedback is highly welcome!
If you have any suggestions for improvements, feature requests, or encounter any issues, please feel free to share them.
