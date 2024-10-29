// index.js


document.addEventListener("DOMContentLoaded", () => {
    let currencyChart;
    const currency1Dropdown = document.getElementById('currency1');
    const currency2Dropdown = document.getElementById('currency2');
    const currencyNamesDiv = document.getElementById('currencyNames');
    const ctx = document.getElementById('currencyChart').getContext('2d');
    const timeControls = document.getElementById('timeControls');
    const avgexchangerate = document.getElementById("price");
    const percentage = document.getElementById("percentage");
    const loadingIndicator = document.getElementById('loadingIndicator');
    const flag1 = document.querySelector(".flag1");
    const flag2 = document.querySelector(".flag2");
    const storedCurrency1 = localStorage.getItem('selectedCurrency1');
    const storedCurrency2 = localStorage.getItem('selectedCurrency2');
    const storedInterval =  '15m';
    const errorMessageElement = document.querySelector(".errorMessage")
    let currentTimeRange = storedInterval;

    if (storedCurrency1) currency1Dropdown.value = storedCurrency1;
    if (storedCurrency2) currency2Dropdown.value = storedCurrency2;




    setActiveTimeButton(storedInterval);

    fetchCurrencies()
        .then(response => {
            const currencies = response.data.available_currencies;
            hideLoadingIndicator(loadingIndicator);
            displayDropdownList(currency1Dropdown, currencies, storedCurrency1 || 'EUR');
            displayDropdownList(currency2Dropdown, currencies, storedCurrency2 || 'USD');
            setFlag(currency1Dropdown.value, flag1);
            setFlag(currency2Dropdown.value, flag2);
            updateChart(currentTimeRange);
        })
        .catch(error => {
            hideLoadingIndicator(loadingIndicator);
            console.error('Error fetching the data:', error);
            errorMessageElement.textContent = `Failed to load data. Please check your internet connection or try again later.`;
            errorMessageElement.classList.replace("d-none" ,"d-block")
        });

    currency1Dropdown.addEventListener('change', () => {
        localStorage.setItem('selectedCurrency1', currency1Dropdown.value);
        console.log(currency1Dropdown.value)
        console.log(currencyToFlagCode[currency1Dropdown.value])
        setFlag(currency1Dropdown.value, flag1);
        updateChart(currentTimeRange);
    });

    currency2Dropdown.addEventListener('change', () => {
        localStorage.setItem('selectedCurrency2', currency2Dropdown.value);
        setFlag(currency2Dropdown.value, flag2);
        updateChart(currentTimeRange);
    });

    timeControls.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const clickedInterval = e.target.dataset.interval;
            setActiveTimeButton(clickedInterval);
            currentTimeRange = clickedInterval;
            localStorage.setItem('selectedInterval', clickedInterval);
            updateChart(clickedInterval);
        }
    });


function updateChart(clickedInterval) {
    const currency1 = currency1Dropdown.value;
    const currency2 = currency2Dropdown.value;
    showLoadingIndicator(loadingIndicator);

    if (!currency1 || !currency2) return;


    const currencyPair = `${currency1}${currency2}`;
    const { startDate, interval } = calculateStartDate(clickedInterval || storedInterval); 
    const endDate = new Date().toISOString().slice(0, 19);
           const currency1Text = currency1Dropdown.options[currency1Dropdown.selectedIndex].text;
      const currency2Text = currency2Dropdown.options[currency2Dropdown.selectedIndex].text;
     currencyNamesDiv.textContent = `${currency1Text} vs ${currency2Text} (${clickedInterval || storedInterval})`;

    fetchTimeSeries(currencyPair, startDate, endDate, interval) 
        .then(response => {
            const timeSeriesData = response.data.quotes;
            const dates = timeSeriesData.map(item => item.date);
            const prices = timeSeriesData.map(item => item.close);
            hideLoadingIndicator(loadingIndicator);

            const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            avgexchangerate.innerHTML = "$" + avg;
            const firstPrice = prices[0];
            const lastPrice = prices[prices.length - 1];
            const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

            
            const changeClass = percentageChange < 0 ? 'text-danger' : 'text-success';
    
            
            percentage.classList.remove('text-danger', 'text-success');
            percentage.classList.add(changeClass , "fw-bold");
        
          
            percentage.textContent = `${lastPrice} (${parseFloat(percentageChange).toFixed(2)}%)`;
        

            renderChart(ctx, dates, prices);
        })
        .catch(error => {
            hideLoadingIndicator(loadingIndicator);
            console.error('Error fetching the time series data:', error);
        });
}
function renderChart(ctx, labels, data) {
   
    if (currencyChart ) {
        currencyChart.destroy(); 
    }

    
    currencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Currency Exchange Rate',
                data: data,
                fill: true,
                backgroundColor: 'rgb(242,250,234)',
                borderColor: 'rgb(116,193,19)',
                tension: 0.2,
                pointRadius: 0,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: false,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: false,
                    title: {
                        display: true,
                        text: 'Exchange Rate'
                    }
                }
            }
        }
    });
}

});
