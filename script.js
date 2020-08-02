const covid_csv = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv";

var myData = [];
var maxCases = 0;

var margin = 100;

// javascript month start from 0
var date = new Date(2020, 2, 1);

var drawChartInterval;
var paused = true;

var minPage = 1;
var maxPage = 3;
var currentPage = minPage;

var toggleFigures = false;

var filteredData = [];
var filterCase = false;
var filterPopulation = false;

async function onload() {
    await d3.csv(covid_csv)
        .then(
            function (data) {
                myData = data;
                maxCases = d3.max(myData, row => row.cases);
                return myData.length;
            }
        ).then(
            function (lineNumbers) {
                if (lineNumbers > 0) {
                    console.log("Data parsed ok");
                }
            }
        );
}


function getCurrentData(date) {
    var currentData = [];
    myData.forEach(element => {
        if (element.date == date) {

            var item = {
                state: element.state,
                cases: element.cases,
                ten_thousands: Math.floor(element.cases / 10000),
                thousands: Math.round((element.cases % 10000) / 1000)
            };
            currentData.push(item);
        }
    });
    return currentData;
}

function play_growth_chart() {
    if (paused) {
        paused = false;
        drawChart();
    }

    document.getElementById("btn-play")
        .setAttribute("class", "btn-action pressed relative float-right");

    document.getElementById("btn-pause")
        .setAttribute("class", "btn-action relative float-right");

}

function pause_growth_chart() {
    paused = true;
    clearInterval(drawChartInterval);

    document.getElementById("btn-play")
        .setAttribute("class", "btn-action relative float-right");

    document.getElementById("btn-pause")
        .setAttribute("class", "btn-action pressed relative float-right");

}

function drawChart() {
    if (paused) {
        pause_growth_chart();
        return;
    }

    clearInterval(drawChartInterval);

    date.setDate(date.getDate() + 1);
    var dateText = date.toISOString().slice(0, 10);
    document.getElementById("current-date").innerHTML = dateText;

    var today = new Date();
    // stops the time lapse on the day before yesterday because data is not available until the day after
    today.setDate(today.getDate() - 3);
    if (date > today) {
        console.log("reached today");
        pause_growth_chart();
        return;
    }

    drawCasesPlot(dateText);
    drawChartInterval = setInterval(drawChart, 150);
}

function drawCasesPlot(dateText) {
    var map_div = "div-map";
    var width = document.getElementById(map_div).clientWidth * 0.3;

    var currentData = getCurrentData(dateText);
    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(/ /g, "");

        var row_count_mod = 20;
        var rows = Math.ceil((currentData[i].ten_thousands + currentData[i].thousands) / row_count_mod);
        var height = 10 * (rows + 1);
        height = height >= 40 ? height : 40;

        var svg = d3.select("#" + stateNameNoSpace + "-cases-chart").select("svg");
        svg.attr("width", width)
            .attr("height", height);

        for (var j = 0; j < currentData[i].ten_thousands + currentData[i].thousands; j++) {
            var pos_offset = 12;
            var radius = j < currentData[i].ten_thousands ? 3.5 : 2;
            var cx = pos_offset * ((j % row_count_mod) + 1);
            var cy = pos_offset * (Math.floor(j / row_count_mod) + 0.5);
            svg.append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", radius)
                .style("fill", "darkorange");
        }

        if (toggleFigures) {
            var dom_element = document.getElementById(stateNameNoSpace + "-label");
            if (dom_element && dom_element.innerHTML) {
                document.getElementById(stateNameNoSpace + "-label").innerHTML = stateName + " (" + formatNumber(currentData[i].cases) + ")";
            }
        }
    }
}

function formatNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function nextPage() {
    pause_growth_chart();

    if (currentPage < maxPage) {
        currentPage++;

        showPage(currentPage);
        hidePage(currentPage - 1);

        document.getElementById("btn-before")
            .setAttribute("class", "btn-action relative float-right");
    }

    if (currentPage >= maxPage) {
        document.getElementById("btn-next")
            .setAttribute("class", "btn-action pressed relative float-right");
    }
}

function previousPage() {
    if (currentPage > minPage) {
        currentPage--;

        showPage(currentPage);
        hidePage(currentPage + 1);

        document.getElementById("btn-next")
            .setAttribute("class", "btn-action relative float-right");
    }

    if (currentPage <= minPage) {
        document.getElementById("btn-before")
            .setAttribute("class", "btn-action pressed relative float-right");
    }
}

function showPage(pageNumber) {
    document.getElementById("div-step-" + pageNumber).setAttribute("class", "");

    switch (pageNumber) {
        case 1:
            loadPageOne();
            break;
        case 2:
            loadPageTwo();
            break;
        case 3:
            loadPageThree();
            break;
    }

    document.getElementById("page-number").innerHTML = "Page " + pageNumber;
}

function hidePage(pageNumber) {
    document.getElementById("div-step-" + pageNumber).setAttribute("class", "hidden");
}

function loadPageOne() {
    resetPlotCircleSvg();
    resetFilter();
    toggleFigures = false;
    drawCasesPlot(date.toISOString().slice(0, 10));
}

function resetPlotCircleSvg() {
    d3.select("#div-map").selectAll("svg").selectAll("circle").remove();
}

function resetPlotPolygonSvg() {
    d3.select("#div-map").selectAll("svg").selectAll("polygon").remove();
}

function resetFilter() {
    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    var currentData = getCurrentData(dateText);

    filterPopulation = false;
    filterCase = false;

    document.getElementById("btn-filter-case")
        .setAttribute("class", "btn-action btn-border orange");
    document.getElementById("btn-filter-population")
        .setAttribute("class", "btn-action btn-border blue");

    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(/ /g, "");
        var div_state = document.getElementById(stateNameNoSpace);
        if (div_state) {
            document.getElementById(stateNameNoSpace).setAttribute("class", "width-100");
        }
    }
}

function loadPageTwo() {
    resetPlotCircleSvg();
    resetPlotPolygonSvg();

    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    document.getElementById("last-date").innerHTML = dateText;

    drawCasesPlot(dateText);
    drawPopoulationPlot(dateText);
}

function loadPageThree() {
    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    document.getElementById("last-date-page-3").innerHTML = dateText;

    drawAreaPlot(dateText);
}

function top10case() {
    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    var currentData = getCurrentData(dateText);
    var filteredDataSet = getCurrentData(dateText);

    if (filterCase) {
        document.getElementById("btn-filter-case")
            .setAttribute("class", "btn-action btn-border orange");
        filterCase = false;
    }
    else {
        document.getElementById("btn-filter-case")
            .setAttribute("class", "btn-action pressed btn-border orange");
        document.getElementById("btn-filter-population")
            .setAttribute("class", "btn-action btn-border blue");
        filterCase = true;
        filterPopulation = false;

        filteredDataSet.sort(function (first, second) {
            return second.cases - first.cases;
        });

        filteredDataSet = filteredDataSet.slice(0, 10);
    }

    filteredData = [];
    (filteredDataSet).forEach(element => {
        filteredData.push(element.state);
    });

    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(/ /g, "");
        var div_state = document.getElementById(stateNameNoSpace);
        if (filterCase && filteredData && filteredData.length > 0 && filteredData.indexOf(stateName) < 0) {
            if (div_state) {
                document.getElementById(stateNameNoSpace).setAttribute("class", "hidden");
            }
            continue;
        }
        if (div_state) {
            document.getElementById(stateNameNoSpace).setAttribute("class", "width-100");
        }
    }
}

function top10population() {
    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    var currentData = getCurrentData(dateText);

    var filteredDataSet = Object.keys(populationData).map(function (key) {
        return [key, populationData[key]];
    });

    if (filterPopulation) {
        document.getElementById("btn-filter-population")
            .setAttribute("class", "btn-action btn-border blue");
        filterPopulation = false;
    }
    else {
        document.getElementById("btn-filter-population")
            .setAttribute("class", "btn-action pressed btn-border blue");
        document.getElementById("btn-filter-case")
            .setAttribute("class", "btn-action btn-border orange");
        filterPopulation = true;
        filterCase = false;

        filteredDataSet.sort(function (first, second) {
            return second[1] - first[1];
        });

        filteredDataSet = filteredDataSet.slice(0, 10);
    }

    filteredData = [];
    (filteredDataSet).forEach(element => {
        filteredData.push(element[0]);
    });

    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(/ /g, "");
        var div_state = document.getElementById(stateNameNoSpace);
        if (filterPopulation && filteredData && filteredData.length > 0 && filteredData.indexOf(stateName) < 0) {
            if (div_state) {
                document.getElementById(stateNameNoSpace).setAttribute("class", "hidden");
            }
            continue;
        }
        if (div_state) {
            document.getElementById(stateNameNoSpace).setAttribute("class", "width-100");
        }
    }
}

function drawPopoulationPlot(dateText) {
    var map_div = "div-map";
    var width = document.getElementById(map_div).clientWidth * 0.3;

    var currentData = getCurrentData(dateText);
    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(" ", "");

        var populationValue = populationData[stateName];
        var millions = Math.floor(populationValue / 1000000);
        var hundread_thousands = Math.round((populationValue % 1000000) / 100000);

        var row_count_mod = 20;
        var rows = Math.ceil((millions + hundread_thousands) / row_count_mod);
        var height = 10 * (rows + 1);
        height = height >= 40 ? height : 40;

        var svg = d3.select("#" + stateNameNoSpace + "-population-chart").select("svg");
        svg.attr("width", width)
            .attr("height", height);

        for (var j = 0; j < millions + hundread_thousands; j++) {
            var pos_offset = 12;
            var radius = j < millions ? 5.5 : 4;
            var cx = pos_offset * ((j % row_count_mod) + 1);
            var cy = pos_offset * (Math.floor(j / row_count_mod) + 0.5);
            svg.append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", radius)
                .style("fill", "#77BBEE");
        }
    }
}

function drawAreaPlot(dateText) {

    var map_div = "div-map";
    var width = document.getElementById(map_div).clientWidth * 0.2;

    var currentData = getCurrentData(dateText);
    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateNameNoSpace = stateName.replace(" ", "");

        var areaValue = areaData[stateName];
        var ten_thousands = Math.floor(areaValue / 10000);
        var thoudsands = Math.round((areaValue % 10000) / 1000);

        var row_count_mod = 12;
        var rows = Math.ceil((ten_thousands + thoudsands) / row_count_mod);
        var height = 10 * (rows + 1);
        height = height >= 40 ? height : 40;

        var svg = d3.select("#" + stateNameNoSpace + "-area-chart").select("svg");
        svg.attr("width", width)
            .attr("height", height);

        for (var j = 0; j < ten_thousands + thoudsands; j++) {
            var pos_offset = 12;
            var x1 = pos_offset * ((j % row_count_mod) + 0.5);
            var x2 = pos_offset * ((j % row_count_mod) + 0);
            var x3 = pos_offset * ((j % row_count_mod) + 1);
            var y1 = pos_offset * (Math.floor(j / row_count_mod) + 0);
            var y2 = pos_offset * (Math.floor(j / row_count_mod) + 1);
            var y3 = pos_offset * (Math.floor(j / row_count_mod) + 1);

            var y1_s = pos_offset * (Math.floor(j / row_count_mod) + 0.4);
            var x2_s = pos_offset * ((j % row_count_mod) + 0.2);
            var x3_s = pos_offset * ((j % row_count_mod) + 0.8);
            if (j < ten_thousands) {
                svg.append("polygon")
                    .attr("points", x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3)
                    .style("fill", "#77aa44");
            }
            else {
                svg.append("polygon")
                    .attr("points", x1 + "," + y1_s + " " + x2_s + "," + y2 + " " + x3_s + "," + y3)
                    .style("fill", "#77aa44");
            }
        }
    }
}