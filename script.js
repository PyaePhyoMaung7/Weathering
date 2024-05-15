var weathering = angular.module('weathering',[]);

weathering.controller('weatheringCtrl',['$scope', '$http', function($scope, $http){
    $scope.dataLoaded               = false;
    $scope.city                     = '';
    $scope.cityCoords               = {};
    $scope.country                  = '';
    $scope.haveSearched             = false;
    $scope.apiKey                   = 'e18f252be080cb78a48dc5538390b15b';
    $scope.currentWeatherUrlHalf    = 'https://api.openweathermap.org/data/2.5/weather?';
    $scope.forecastUrlHalf          = 'https://api.openweathermap.org/data/2.5/forecast?';
    $scope.airPollutionUrlHalf      = 'https://api.openweathermap.org/data/2.5/air_pollution?';   
    $scope.geoCodingUrlHalf         = 'http://api.openweathermap.org/geo/1.0/direct?';
    $scope.reverseGeoCodingUrlHalf  = 'http://api.openweathermap.org/geo/1.0/reverse?'; 
    
    $scope.getCity = function (position) {
        $scope.dataLoaded = false;
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        let reverseGeoCodingUrlFull = $scope.reverseGeoCodingUrlHalf + `lat=${lat}&lon=${lon}&appid=${$scope.apiKey}`;
        $http.get(reverseGeoCodingUrlFull)
        .then(
            function (res){
                $scope.city = res.data[0].name;
                $scope.country = res.data[0].country;
                $scope.cityCoords   = {
                    lat: lat,
                    lon: lon
                };
                $scope.getCurrentWeather();
            },
            function (error){
                $scope.errorHandle(error);
            }
        )
    }
    $scope.getCurrentLocation = function () {
        navigator.geolocation.getCurrentPosition($scope.getCity);
    }

    $scope.errorHandle = function (error) {
        $scope.dataLoaded = true;
        try{
            if(error.data.cod == '404'){
                alert('Sorry, the city cannot be found!');
                $scope.city = '';
            }
        }catch{
            console.log('Something went wrong!');
            alert('Something went wrong!');
        }
    }

    navigator.geolocation.getCurrentPosition($scope.getCity);

    $scope.cityEntered = function (event) {
        if(event.key.toLowerCase() == "enter"){
            $scope.getWeatherInfo();
        }
    }

    $scope.getWeatherInfo = function () {
        if($scope.city == ''){
            alert('Please enter a city!');
            return;
        }
        $scope.setHistory();
        $scope.getGeoData();
    }

    $scope.getGeoData = function () {
        $scope.dataLoaded = false;
        $scope.geoCodingUrlFull      = $scope.geoCodingUrlHalf + `q=${$scope.city}&appid=${$scope.apiKey}`;
        $http.get($scope.geoCodingUrlFull)
        .then(
            function (res) {
                if(res.data.length == 0) {
                    $scope.dataLoaded = true;
                    $scope.city = '';
                    alert('Sorry, the city cannot be found!');
                    return;
                }
                let geoCodingData = res.data[0];
                $scope.country    = geoCodingData.country;
                $scope.cityCoords   = {
                    lat: geoCodingData.lat,
                    lon: geoCodingData.lon
                };
                $scope.getCurrentWeather();
            },
            function (error) {
                $scope.errorHandle(error);
            }
        )
    }

    $scope.getCurrentWeather = function () {
        $scope.currentWeatherUrlFull = $scope.currentWeatherUrlHalf + `q=${$scope.city}&appid=${$scope.apiKey}`;
        $http.get($scope.currentWeatherUrlFull)
        .then(
            function (res) {
                let currentWeather = res.data;
                $scope.displayCurrentWeather(currentWeather);
                $scope.displaySunRiseSet(currentWeather.sys.sunrise, currentWeather.sys.sunset, currentWeather.timezone);
                $scope.displayAdditionalConditions(currentWeather);
                $scope.getForecastWeather();
            },
            function (error) {
                $scope.errorHandle(error);
            }
        )
    }

    $scope.getForecastWeather = function () {
        $scope.forecastUrlFull = $scope.forecastUrlHalf + `q=${$scope.city}&appid=${$scope.apiKey}`;
        $http.get($scope.forecastUrlFull)
        .then(
            function (res) {
                let hourlyForecastWeather = res.data.list;
                $scope.displayHourlyForecast(hourlyForecastWeather);
                $scope.display5DaysForecast(hourlyForecastWeather);
                $scope.getAirPollutionData();
            },
            function (error) {
                $scope.errorHandle(error);
            }
        )
    }

    $scope.getAirPollutionData = function () {
        $scope.airPollutionUrlFull = $scope.airPollutionUrlHalf + `lat=${$scope.cityCoords.lat}&lon=${$scope.cityCoords.lon}&appid=${$scope.apiKey}`;
        $http.get($scope.airPollutionUrlFull)
        .then(
            function (res) {
                let airPollutionData = res.data.list[0];
                $scope.displayAirPollution(airPollutionData);
            },
            function (error) {
                $scope.errorHandle(error);
            }
        )
    }

    $scope.getFormatDate = function (dt) {
        let dateTime = new Date(dt * 1000);
        let months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let day = days[dateTime.getDay()];
        let month = months[dateTime.getMonth()];
        let dateOfMonth = dateTime.getDate();
        let formattedDate = `${day} ${dateOfMonth}, ${month}`;
        return formattedDate;
    }

    $scope.getCurrentTime = function () {
        let currentDate = new Date();

        let year = currentDate.getFullYear();
        let month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        let day = String(currentDate.getDate()).padStart(2, '0');
        let hours = String(currentDate.getHours()).padStart(2, '0');
        let minutes = String(currentDate.getMinutes()).padStart(2, '0');
        let seconds = String(currentDate.getSeconds()).padStart(2, '0');

        let formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        return formattedDate;
    }

    $scope.setHistory = function () {
        $scope.haveSearched = true;
        let searchHistory = document.querySelector('#search-history');
        let searchTimeStamp = $scope.getCurrentTime();
        let searchCity = $scope.city;
        let searchData = '';
        searchData += `
        <div class="d-flex justify-content-between text-white">
            <span>${searchCity}</span>
            <span>${searchTimeStamp}</span>
        </div>
        `;
        if(searchHistory.innerHTML.trim() !== ''){
            searchData += '<hr class="text-white" style="border-top:1px dashed #fff;">'
        }
        searchHistory.innerHTML = searchData + searchHistory.innerHTML;
    }

    $scope.displayCurrentWeather = function (currentWeather) {
        let currentWeatherDiv = document.querySelector('#current-weather');
        currentWeatherDiv.innerHTML = '';
        let city = currentWeather.name;
        let dateTime = $scope.getFormatDate(currentWeather.dt);
        let temperature = Math.round(currentWeather.main.temp - 273.15);
        let description = currentWeather.weather[0].description;
        let iconCode = currentWeather.weather[0].icon;
        let iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
        currentWeatherDiv.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center">
                <span class="fs-1 me-5 text-white">${temperature}&deg;C</span>
                <div class="ms-3" style="width: 60px;"><img src="${iconUrl}" alt="today weather icon" class="w-100 me-3" style="transform: scale(1.5) translateX(-0.5rem);"></div>
            </div>
            <span class="text-white">${description}</span>
            <hr>
            <div><i class="fa-regular fa-calendar me-2 text-white"></i> <span class="text-secondary">${dateTime}</span></div>
            <div><i class="fa-solid fa-location-dot me-2 text-white"></i> <span class="text-secondary" style="margin-left: 1px;">${city}, ${$scope.country}</span></div>
        </div>`;
    }

    $scope.displayHourlyForecast    = function (hourlyData) {
        let firstHalf            = document.querySelector('#hourly-forecast-first-half');
        let secHalf              = document.querySelector('#hourly-forecast-sec-half');

        firstHalf.innerHTML  = '';
        secHalf.innerHTML    = '';
        let row1 = document.createElement('div');
        let row2 = document.createElement('div');
        row1.className = 'row g-2 row-cols-4';
        row2.className = 'row g-2 row-cols-4';
        let next12HoursForecast = '';

        let next24Hours = hourlyData.slice(0, 8);
        for (let i = 0; i < 4; i++) {
            next12HoursForecast += $scope.makeHourlyForecast(next24Hours, i);
        }
        row1.innerHTML       += next12HoursForecast;
        firstHalf.appendChild(row1);
        next12HoursForecast = '';

        for (let i = 4; i < next24Hours.length; i++) {
            next12HoursForecast += $scope.makeHourlyForecast(next24Hours, i);
        }
        row2.innerHTML       += next12HoursForecast;
        secHalf.appendChild(row2);
        next12HoursForecast = '';
    }

    $scope.makeHourlyForecast = function (next24Hours, i, row){
        let item = next24Hours[i];
        let dateTime = new Date(item.dt * 1000);
        let hour = dateTime.getUTCHours();
        let temperature = Math.round(item.main.temp - 273.15);
        let iconCode    = item.weather[0].icon;
        let next3HoursForecast = '';
        let iconUrl     = `https://openweathermap.org/img/wn/${iconCode}.png`;
        next3HoursForecast += `
        <div class="col">
            <div class="card rounded-4 card-bg-color">
                <div class="card-body text-center">
                    <span class="text-secondary">${hour}:00</span>
                    <div class="d-flex justify-content-center">
                        <div style="width: 25px;" class="">
                            <img src="${iconUrl}" alt="" class="w-100 object-fit-cover" style="transform: scale(1.7);">
                        </div>
                    </div>
                    <span class="text-secondary">${temperature}&deg;C</span>
                </div>
            </div>
        </div>
        `;
        return next3HoursForecast;
    }

    $scope.display5DaysForecast = function (hourlyData) {
        let fiveDaysForecastDiv = document.querySelector('#five-days-forecast');
        fiveDaysForecastDiv.innerHTML = '';
        let fiveDaysData = [hourlyData[0], hourlyData[8], hourlyData[16], hourlyData[24], hourlyData[32]] ;
        let fiveDaysForecast = '';
        fiveDaysData.forEach((item, index)=>{
            let dateTime = $scope.getFormatDate(item.dt);
            let temperature = Math.round(item.main.temp - 273.15);
            let iconCode    = item.weather[0].icon;
            let iconUrl     = `https://openweathermap.org/img/wn/${iconCode}.png`;
            
            let classes = 'd-flex justify-content-between align-items-center';
            if (index != 4){
                classes += ' mb-2';
            }
            fiveDaysForecast += `
            <div class="${classes}">
                <span class="d-flex align-items-center">
                    <div style="width: 25px;" class="me-2">
                        <img src="${iconUrl}" alt="" class="w-100" style="transform: scale(1.5) translateY(-1px);">
                    </div>
                    <span class="text-white">${temperature}&deg;C</span>
                </span>
                <span class="text-secondary">${dateTime}</span>
            </div>
            `;
        })
        fiveDaysForecastDiv.innerHTML = fiveDaysForecast;
    }

    $scope.displayAirPollution = function (airPollution) {
        let aqiTypes = ['Good','Fair','Moderate','Poor','Very Poor'];
        let pm25 =  document.querySelector('#pm-25');
        pm25.innerHTML = '';
        pm25.innerHTML = airPollution.components.pm2_5;

        let so2 =  document.querySelector('#so2');
        so2.innerHTML = '';
        so2.innerHTML = airPollution.components.so2;
        
        let no2 =  document.querySelector('#no2');
        no2.innerHTML = '';
        no2.innerHTML = airPollution.components.no2;

        let o3 =  document.querySelector('#o3');
        o3.innerHTML = '';
        o3.innerHTML = airPollution.components.o3;

        let aqiDiv = document.querySelector('#aqi');
        let aqi = airPollution.main.aqi
        aqiDiv.innerHTML = '';
        aqiDiv.innerHTML = aqiTypes[aqi-1];
        switch(aqi){
            case 1:
                aqiDiv.style.backgroundColor = '#64ffda';
                aqiDiv.style.color = 'black';
                break;
            case 2:
                aqiDiv.style.backgroundColor = '#eeff41';
                aqiDiv.style.color = 'black';
                break;
            case 3:
                aqiDiv.style.backgroundColor = '#ff9800';
                aqiDiv.style.color = 'white';
                break;
            case 4:
                aqiDiv.style.backgroundColor = '#f44336';
                aqiDiv.style.color = 'white';
                break;
            case 5:
                aqiDiv.style.backgroundColor = '#d500f9';
                aqiDiv.style.color = 'white';
                break;
            default:
                aqiDiv.style.backgroundColor = '#5d4037';
                aqiDiv.style.color = 'white';
                break;
        }

        $scope.city = '';
        $scope.dataLoaded = true;
    }

    $scope.displaySunRiseSet = function (sunRise, sunSet, timezone) {
        let sunRisePara = document.querySelector('#sun-rise-time');
        let sunSetPara = document.querySelector('#sun-set-time');

        let sunRiseTime = new Date((sunRise+timezone) * 1000);
        let sunSetTime  = new Date((sunSet+timezone) * 1000);
        let sunRiseHour = sunRiseTime.getUTCHours();
        let sunRiseMinute = sunRiseTime.getUTCMinutes();
        let sunSetHour = sunSetTime.getUTCHours() - 12;
        let sunSetMinute = sunSetTime.getUTCMinutes();
       
        sunRisePara.innerHTML   = `${sunSetHour}:${sunRiseMinute} AM`;
        sunSetPara.innerHTML    = `${sunRiseHour}:${sunSetMinute} PM`;
    }

    $scope.displayAdditionalConditions = function (currentWeather) {
        let humidity = document.querySelector('#humidity');
        let pressure = document.querySelector('#pressure');
        let visibility = document.querySelector('#visibility');
        let feels_like = document.querySelector('#feels-like');
        
        humidity.innerHTML = '';
        pressure.innerHTML = '';
        visibility.innerHTML = '';
        feels_like.innerHTML = '';

        humidity.innerHTML = `${currentWeather.main.humidity}%`;
        pressure.innerHTML = `${currentWeather.main.pressure} hPa`;
        visibility.innerHTML = `${currentWeather.visibility/1000} km`;
        feels_like.innerHTML = `${(currentWeather.main.feels_like - 273.15).toFixed(2)}&deg;C`;
    }
    
}])