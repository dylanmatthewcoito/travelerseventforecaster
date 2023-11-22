const weatherApiKey = '0fffcdb9d9732daced94e2c5d89e2a50';
const toggleSwitch = $('#checkbox');

let counts = 0;
let countsarray = [];
let favItems = JSON.parse(localStorage.getItem('favorites')) || [];

// start cascade of events with the event listener(given user input) after the html loads
$().ready(function () {
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
function filterForecastData(json) {
    const forecastDataList = json.list;
    const forecastDataArray = [];
    for (let i = 0; i < forecastDataList.length; i++) {
        const isEighthIndex = i % 8 === 0;
        if (isEighthIndex) {
            forecastDataArray.push(forecastDataList[i]);
        }
    }
    return forecastDataArray;
}

// retrieves the desired forecast data from the API
function getConsolidatedForecastData(forecastDataList) {

    const dateForecasted = forecastDataList.dt_txt.split(' ')[0];
    const weatherIcon = forecastDataList.weather[0].icon;
    const temperature = forecastDataList.main.temp;
    const windSpeed = forecastDataList.wind.speed;
    const humidity = forecastDataList.main.humidity;

    return { dateForecasted, weatherIcon, temperature, windSpeed, humidity };
}

// puts retrieved data into an array
function parseForecastData(forecastDataArray) {
    return forecastDataArray.map(getConsolidatedForecastData);
}

// displays a list of weather forecast items on webpage
// uses renderForecastDataItem to create and format each forecast item
function renderForecastData (forecastDataArray) {

    const forecastParentNode = $('#five-day-weather-forecast');
    forecastParentNode.empty();
    for (let i = 0; i < forecastDataArray.length; i++) {
        const forecastChildNodes = renderForecastDataItem(forecastDataArray[i]);
        forecastParentNode.append(forecastChildNodes);
    }
}

// takes a single data item and creates the corresponding html structure
function renderForecastDataItem(dataItem) {
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

// fetches and displays list of events in a given city
function handleClick(event) {
    event.preventDefault();

    const resultsNode = $('#results');
    resultsNode.empty();

    const currentCity = $('#city-input').val().trim();

    $.ajax({
        type: "GET",
        url: `https://app.ticketmaster.com/discovery/v2/events.json?size=25&city=${currentCity}&apikey=bAIpre2uuGdnYkcqGpCKhwkHIGblGZCp`,
        async: true,
        dataType: "json",
    }).then(function (json) {
        console.log(json);
        // Append name, date, and ticket sales url to html cards.
        const events = json._embedded.events;

        $.each(events, function (_, event) {
            const eventName = event.name;
            const eventDate = event.dates.start.localDate;
            const forecastDate = dayjs().add(6, 'day').unix();
            const eventA = dayjs(eventDate).unix();

            if (eventA < forecastDate) {
                const ticketSalesUrl = event.url;
                const htmlCard = `<section class="card z-depth-1 center padding background border margin-bottom">
                                    <h5>${eventName}</h5>
                                    <h6>Date: ${eventDate}</h6>
                                    <a href="${ticketSalesUrl}">Ticket Sales</a>
                                    <button class="favoriteButton" data-ticketid= ${counts}>Favorite</button>
                                  </section>`;
                // Save information into an object
                const testObj = {name: eventName, date: eventDate}; 
                // Save object above into an array
                countsarray.push(testObj); 
                // Increment unique identifier named count
                counts += 1; 
    
                $('#results').append(htmlCard);
            }
        });

        if (counts === 0) {
            $('#results').append(`<h1> No Events </h1>`)
        }
    }).catch(function (error) {
        console.log(error);
    });
}

// saves and prints a user's favorite event
function handleFavoriteclick(event){
    // This refers to the index position in the array named countsarray
    const ticketid = $(event.target).data('ticketid');

    const favorites = $("#favorites"); 
    const favoriteItem = countsarray[ticketid];

    let addItems = true
    
    //to only save one item in local storage (no more duplicates)
    for (const item of favItems) {
  
        if (item.name === favoriteItem.name && item.date === favoriteItem.date) {
            addItems = false
        }
    }

    if (addItems) {
        let favhtml = `<section class="favorite-item">
                        <div>${favoriteItem.name}, ${favoriteItem.date}</div>
                        <button class="deleteButton" data-ticketid="${ticketid}">🗑️</button>
                       </section>`;
        
        favorites.append(favhtml);
        favItems.push(favoriteItem);
        localStorage.setItem('favorites',JSON.stringify(favItems));                
    }
}

//removes event from user's favorite list
function handleDeleteClick(event) {
    const ticketid = $(event.target).data('ticketid');
    // Remove the item from the HTML
    $(event.target).closest('.favorite-item').remove(); 
    // Optionally remove the item from the countsarray if needed
    countsarray.splice(ticketid,1);
    localStorage.setItem('favorites', JSON.stringify(countsarray));
}

// prints favorite events upon page refresh
function loadFavorites(){
    let storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    storedFavorites.forEach((item) => {
        let favhtml = `<section class="favorite-item">
                        <div>${item.name}, ${item.date}</div>
                        <button class="deleteButton">🗑️</button>
                       </section>`;
        $('#favorites').append(favhtml);
    });
}

// toggles between light and dark viewing mode
toggleSwitch.on('change', () => {
    document.body.classList.toggle('dark-mode');
});

$('#city-form').on('submit', handleClick);
$('#favorites').on('click', '.deleteButton', handleDeleteClick);
$('#results').on('click','.favoriteButton', handleFavoriteclick);

loadFavorites();

// changed section background for dark mode to a darker color
// cleaned up code: deleted unused variables & unused/un-necessary code, pushed globlal variables at the top, added and removed comments, made code more consistent
// emptied results node after each city search (so the results do not stack up anymore)
// resolved issue where you could save the same event endlessly

