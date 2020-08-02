const covid_csv = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv";
const poluation_csv = "population.csv";
// population data was retrieved from US Census from the following link and reporocessed
// https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/state/detail/

var myData = [];
var maxCases = 0;

var margin = 100;

var us;
var features;

// javascript month start from 0
var date = new Date(2020, 2, 1);

var drawChartInterval;
var paused = true;

var minPage = 1;
var maxPage = 3;
var currentPage = minPage;

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

    var today = new Date();
    if (date > today) {
        console.log("reached today");
        pause_growth_chart();
        return;
    }

    var dateText = date.toISOString().slice(0, 10);

    drawCasesPlot(dateText);

    document.getElementById("current-date").innerHTML = dateText;

    drawChartInterval = setInterval(drawChart, 150);
}

function drawCasesPlot(dateText) {
    var map_div = "div-map";
    var width = document.getElementById(map_div).clientWidth * 0.3;
    //var height = document.getElementById(map_div).clientHeight;

    var currentData = getCurrentData(dateText);
    for (var i = 0; i < currentData.length; i++) {
        var stateName = currentData[i].state;
        stateName = stateName.replace(" ", "");

        var row_count_mod = 20;
        var rows = Math.ceil((currentData[i].ten_thousands + currentData[i].thousands) / row_count_mod);
        var height = 10 * (rows + 1);
        height = height >= 40 ? height : 40;

        var svg = d3.select("#" + stateName + "-cases-chart").select("svg");
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
    }
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
    }

    document.getElementById("page-number").innerHTML = "Page " + pageNumber;

}

function hidePage(pageNumber) {
    document.getElementById("div-step-" + pageNumber).setAttribute("class", "hidden");
}

function loadPageOne() {
    resetPlotCircleSvg();

}

function resetPlotCircleSvg() {
    d3.select("#div-map").selectAll("svg").selectAll("circle").remove();
}

function loadPageTwo() {
    resetPlotCircleSvg();

    var today = new Date();
    today.setDate(today.getDate() - 2);
    var dateText = today.toISOString().slice(0, 10);
    document.getElementById("last-date").innerHTML = dateText;

    drawCasesPlot(dateText);
    drawPopoulationPlot(dateText);
}

function drawPopoulationPlot(dateText) {
    //populationData;

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
                .style("fill", "#77aa44");
        }
    }
}