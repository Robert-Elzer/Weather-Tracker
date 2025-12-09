const API_KEY = 'PH4GAUTPTTZHCTQXSCMUJXHVZ';

const messageArea = document.getElementById('message-area');
const weatherDisplay = document.getElementById('weather-display');
const currentWeatherDiv = document.getElementById('current-weather');
const hourlyForecastDiv = document.getElementById('hourly-forecast');
const apiKeyWarning = document.getElementById('api-key-warning');

if (API_KEY === 'YOUR_API_KEY_HERE' || API_KEY.length < 10) {
    apiKeyWarning.classList.remove('hidden');
}


function formatTime(datetime) {
    const date = new Date(datetime);
    const isToday = (date.toDateString() === new Date().toDateString());

    let timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hour = date.getHours();
    const nowHour = new Date().getHours();

    if (hour === nowHour && isToday) {
        return 'Now';
    }
    return timeString;
}

//main function to fetch and display weather data
async function fetchWeather() {
    const location = document.getElementById('city-input').value.trim();
    
    if (!location) {
        apiKeyWarning.innerHTML = 'Please enter a city name.';
        apiKeyWarning.classList.remove('hidden');
        return;
    }

    if (API_KEY === 'YOUR_API_KEY_HERE' || API_KEY.length < 10) {
        apiKeyWarning.innerHTML = 'Error: API key is missing or invalid.';
        apiKeyWarning.classList.remove('hidden');
        return;
    }
    //show loading state
    weatherDisplay.classList.add('hidden');
    messageArea.classList.remove('hidden');
    apiKeyWarning.innerHTML = '';
    apiKeyWarning.classList.add('hidden');
    messageArea.innerHTML = 'Loading weather data...';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/${yesterdayStr}/${tomorrowStr}?unitGroup=metric&key=${API_KEY}&contentType=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.status !== 200 || data.errorCode) {
            const error = data.message || `API Error: Status ${response.status}`;
            apiKeyWarning.innerHTML = `Error retrieving data for ${location}. ${error}`;
                apiKeyWarning.classList.remove('hidden');
                messageArea.classList.add('hidden');
            return;
        }

        const current = data.currentConditions;
        renderCurrentConditions(current, data.resolvedAddress);
        let allHours = [];
        data.days.forEach(day => {
            if (day.hours) {
            allHours = allHours.concat(day.hours);
            }            
        });

        const currentEpoch = data.currentConditions.datetimeEpoch;
        const currentIndex = allHours.findIndex(hour => hour.datetimeEpoch >= currentEpoch);
        const startIndex = Math.max(0, currentIndex - 24);
        const relevantHours = allHours.slice(startIndex, startIndex + 49);

        renderHourlyTimeline(relevantHours, currentEpoch);
        messageArea.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');
    } catch (error) {
        apiKeyWarning.innerHTML = 'Network error: Unable to fetch weather data.';
        apiKeyWarning.classList.remove('hidden');
        messageArea.classList.add('hidden');
    }
}

function renderCurrentConditions(current, locationAddress) {
    const tempValue = Math.round(current.temp);
    const windSpeed = current.windspeed !== null ? `${Math.round(current.windspeed)}km/h` : 'N/A';
    const precipProb = current.precipprob !== null ? `${Math.round(current.precipprob)}%` : 'N/A';
    const conditionText = current.conditions || 'Clear';
    const conditionEmoji = getIcon(current.icon);
    const addressShort = locationAddress.split(',').slice(0, 2).join(', ');

    const currentCardHtml = `
    <div class="current-details-layout">
        <h1 class="location-label">${addressShort}</h1>
        <p class="condition-label">${conditionText}</p>
        <div class="temp-display">
            <p>${tempValue}°C</p>
            <span class="icon">${conditionEmoji}</span>
        </div>
        
        
    </div>

    <div class="metric-row">
        <span>💨</span>
        <p>${windSpeed} Wind Speed</p>
    </div>

    <div class="metric-row">
        <span>💧</span>
        <p>${precipProb} Rain Chance</p>
    </div>

    <div class="metric-row">
        <span>👁️</span>
        <p>Visibility: ${current.visibility} km</p>
    </div>
    `;

    currentWeatherDiv.innerHTML = currentCardHtml;    
}

function renderHourlyTimeline (hours, currentEpoch) {
    hourlyForecastDiv.innerHTML = ''; //clear previous content

    const refDate = new Date(currentEpoch * 1000);
    
    const hourlyCards = hours.map((hour) => {
        const hourTime = new Date(hour.datetimeEpoch * 1000);
        const isNow = hourTime.getHours() === refDate.getHours() && hourTime.toDateString() === refDate.toDateString();
        const hourClass = isNow ? 'hour-item now' : 'hour-item';
        const timeLabel = formatTime(hourTime);

        return `
        <div class="${hourClass}">
            <p class="time">${formatTime(hourTime)}</p>
            <p class="icon">${getIcon(hour.icon)}</p>
            <p class="temp">${Math.round(hour.temp)}°C</p>
            <p class="condition">${hour.conditions}</p>
            <p class="precip">Rain: ${Math.round(hour.precipprob)}%</p>
        </div>
        `;
        
    }).join('');
        hourlyForecastDiv.innerHTML = hourlyCards;
        messageArea.classList.add('hidden');
}

function getIcon(icon) {
    switch (icon) {
        case 'clear-day':
        case 'clear-night':
            return '☀️';
        case 'rain':
            return '🌧️';
        case 'snow':
            return '❄️';
        case 'cloudy':
            return '☁️';
        case 'partly-cloudy-day':
        case 'partly-cloudy-night':
            return '⛅';
        case 'fog':
            return '🌫️';
        case 'wind':
            return '🌬️';
        default:
            return '❓';
    }
}

