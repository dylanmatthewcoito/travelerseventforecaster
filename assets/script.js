const weatherApiKey = '0fffcdb9d9732daced94e2c5d89e2a50';

// start cascade of events with the event listener(given user input) after the html loads
$().ready(function(){
    const cityInputValue = $('#city-form');
    cityInputValue.on('submit', getCityInputValue); 
})

// where the magic happens, the parameters get passed around
async function onCitySearch(cityName) { 
    const coordinates = await fetchCityCoordinates(cityName);

    const forecastData = await fetchForecast(coordinates);
    const filterData = filterForecastData(forecastData);

    const parse = parseForecastData(filterData);
    const render = renderForecastData(parse);
}

// checks if there is user input then proceeds to next step --> onCitySearch()
function getCityInputValue(event) {
    event.preventDefault();

    const cityInputValue = $('#city-input').val().trim();
        if (!cityInputValue) {
            throw new Error('No input.');
        }
    onCitySearch(cityInputValue) 
}

// gets coordinates from the geocoding API
function fetchCityCoordinates(cityInputValue) {

    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q='${cityInputValue}&appid=${weatherApiKey}`;
    const geoResponsePromise = fetch(geoUrl);
    const geoDataPromise = geoResponsePromise.then(function (response) {
            if (!response.ok) {
                throw response.json(); 
            }
            return response.json();
        })
    const coordinatesPromise = geoDataPromise.then(function (json) {
        return {
            lat: json[0].lat,
            lon: json[0].lon,
        }
    })
    return coordinatesPromise;
}
// gets the raw data from the weather API
function fetchForecast(coordinates) { 
    const lat = coordinates.lat;
    const lon = coordinates.lon;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=imperial`;

    const forecastResponsePromise = fetch(forecastUrl);
    const forecastDataPromise = forecastResponsePromise.then(function (response) {
            if (!response.ok) {
                throw response.json();
            }
            return response.json();
        })
    return forecastDataPromise; 
}

// procures the data for the 5 days by selecting the indices if they're multiples of 8
function filterForecastData (json) { 
    const forecastDataList = json.list;
    console.log(forecastDataList)
    const forecastDataArray = [];
        for (let i=0; i < forecastDataList.length; i++) {
            const isEighthIndex = i%8 === 0;
            if (isEighthIndex) {
                forecastDataArray.push(forecastDataList[i]);
            } 
        }
        return forecastDataArray;
}

// retrieves the desired forecast data from the API
function getConsolidatedForecastData (forecastDataList) {

    const dateForecasted = forecastDataList.dt_txt.split(' ')[0];
    const weatherIcon = forecastDataList.weather[0].icon;
    const temperature = forecastDataList.main.temp;
    const windSpeed = forecastDataList.wind.speed;
    const humidity = forecastDataList.main.humidity;

    return {dateForecasted, weatherIcon, temperature, windSpeed, humidity};
}

// puts retrieved data into an array
function parseForecastData(forecastDataArray) {
    return forecastDataArray.map(getConsolidatedForecastData);
}

// displays a list of weather forecast items on webpage
// uses renderForecastDataItem to create and format each forecast item
function renderForecastData (forecastDataArray) {
    console.log(forecastDataArray);
    const forecastParentNode = $('#five-day-weather-forecast');
    forecastParentNode.empty();
        for (let i=0; i < forecastDataArray.length; i++) {
            const forecastChildNodes = renderForecastDataItem(forecastDataArray[i]);
            forecastParentNode.append(forecastChildNodes);
        }
}
// takes a single data item and creates the corresponding html structure
function renderForecastDataItem (dataItem){
    const forecastChildNodes = document.createElement('section');

    forecastChildNodes.setAttribute('id', dataItem.dateForecasted);

    forecastChildNodes.className = forecastChildNodes.className 
        + 'z-depth-1 center padding background border margin-bottom';

    const dateForecastEl = document.createElement('li');
    dateForecastEl.setAttribute('style', 'list-style:none;');
    dateForecastEl.innerText = dayjs(dataItem.dateForecasted).format('dddd DD');

    const iconForecastEl = document.createElement('img');
    iconForecastEl.setAttribute('style', 'background-color: rgb(110 220 199);border-radius: 20px;');
    iconForecastEl.src = `https://openweathermap.org/img/wn/${dataItem.weatherIcon}.png`;

    const temperatureEl = document.createElement('li');
    temperatureEl.setAttribute('style', 'list-style:none;');
    temperatureEl.innerText = `${dataItem.temperature} ºF`;

    const windEl = document.createElement('li');
    windEl.setAttribute('style', 'list-style:none;');
    windEl.innerText = `${dataItem.windSpeed} mph`;

    const humidityEl = document.createElement('li');
    humidityEl.setAttribute('style', 'list-style:none;');
    humidityEl.innerText = `humidity: ${dataItem.humidity}%`;

    forecastChildNodes.appendChild(dateForecastEl);
    forecastChildNodes.appendChild(iconForecastEl);
    forecastChildNodes.appendChild(temperatureEl);
    forecastChildNodes.appendChild(windEl);
    forecastChildNodes.appendChild(humidityEl);

    return forecastChildNodes;
}

