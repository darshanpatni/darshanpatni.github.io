const MAP_HEIGHT = 20;
const PUMP_RADIUS = 7;
const PUMP_COLOR = "#20272F";

const DEATH_RADIUS = 2;
const DEATH_COLOR = "#ff0000";
const MALE_COLOR = "#d95f02"
const FEMALE_COLOR = "#1b9e77";

const viewBox = "0 0 500 400";
const WIDTH = 600;
const HEIGHT = 400;

const LEGEND_NONE = 1;
const LEGEND_AGE = 2;
const LEGEND_SEX = 3;

const LEGEND_NONE_ID = "none-legend";
const LEGEND_SEX_ID = "sex-legend";
const LEGEND_AGE_ID = "age-legend";

const AGE_1TO10 = 0;
const AGE_11TO20 = 1;
const AGE_21TO40 = 2;
const AGE_41TO60 = 3;
const AGE_61TO80 = 4;
const AGE_80 = 5;

var AGE_HASH_MAP = new Map();
AGE_HASH_MAP.set(AGE_1TO10, "#4575b4")
AGE_HASH_MAP.set(AGE_11TO20, "#91bfdb")
AGE_HASH_MAP.set(AGE_21TO40, "#e0f3f8")
AGE_HASH_MAP.set(AGE_41TO60, "#fee090")
AGE_HASH_MAP.set(AGE_61TO80, "#fc8d59")
AGE_HASH_MAP.set(AGE_80, "#d73027")

var DEATH_DAYS_LIST = [];
var DEATHS_AGE_SEX_LIST = [];
var PUMPS_LIST = [];
var DEATH_DATE_HASH_MAP = new Map();

var ageDeathSample = {
    totalDeaths: 0,
    maleDeaths: 0,
    femaleDeaths: 0
}
var AGE_DEATH_HASH_MAP = new Map();
AGE_DEATH_HASH_MAP.set(AGE_1TO10, Object.assign({}, ageDeathSample));
AGE_DEATH_HASH_MAP.set(AGE_11TO20, Object.assign({}, ageDeathSample));
AGE_DEATH_HASH_MAP.set(AGE_21TO40, Object.assign({}, ageDeathSample));
AGE_DEATH_HASH_MAP.set(AGE_41TO60, Object.assign({}, ageDeathSample));
AGE_DEATH_HASH_MAP.set(AGE_61TO80, Object.assign({}, ageDeathSample));
AGE_DEATH_HASH_MAP.set(AGE_80, Object.assign({}, ageDeathSample));

var selectedLegend = 1;
var currentDisplayedList = [];
var selectedCircleData = undefined;
var selectedCircleG = undefined;

function onLegendUpdate() {
    var eID = document.getElementById("legend-selector");
    selectedLegend = parseInt(eID.options[eID.selectedIndex].value);
    if(deathsSVGContainer!=null) {
        deathsSVGContainer.selectAll("circle").remove();
    }
    displayAllDeaths(currentDisplayedList);
    displayLegend(selectedLegend);
}

showDefaultLegend();

function displayLegend(legend) {
    switch(legend) {
        case LEGEND_NONE:
            showDefaultLegend();
            break;
        case LEGEND_SEX:
            showSexLegend();
            break;
        case LEGEND_AGE:
            showAgeLegend();
            break;
    }
}

function showDefaultLegend() {
    document.getElementById(LEGEND_NONE_ID).style.display = "block";
    document.getElementById(LEGEND_SEX_ID).style.display = "none";
    document.getElementById(LEGEND_AGE_ID).style.display = "none";
}

function showSexLegend() {
    document.getElementById(LEGEND_SEX_ID).style.display = "block";
    document.getElementById(LEGEND_NONE_ID).style.display = "none";
    document.getElementById(LEGEND_AGE_ID).style.display = "none";
}

function showAgeLegend() {
    document.getElementById(LEGEND_AGE_ID).style.display = "block";
    document.getElementById(LEGEND_SEX_ID).style.display = "none";
    document.getElementById(LEGEND_NONE_ID).style.display = "none";
}

var brushTooltip = d3.select("body").append("div")	
    .attr("class", "tooltip-brush")				
    .style("opacity", 0);

// Define the div for the tooltip
var chartTooltip = d3.select("body").append("div")	
    .attr("class", "tooltip-chart")				
    .style("opacity", 0);

function equalToEventTarget() {
    return this == d3.event.target;
}

// Create Event Handlers for mouse
function handleMouseOverForLineChat(g,d) {  // Add interactivity
    if(!selectedCircleData) {
        showLineChartTooltip(g,d);
    }
}

function showLineChartTooltip(g,d) {
    // Use D3 to select element, change color and size
    d3.select(g)
    .attr("r", 7)
    .attr("class", "dot-selected");

    var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d.date);
    var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d.date);
    var dateString = `${day}-${month}`;
    filterDeathDaysByDateV2(dateString);

    // Specify where to put label of text
    d3.select(g)
    .append("text")
    .text(dateString);

    chartTooltip.transition()		
        .duration(200)		
        .style("opacity", .9);		
    chartTooltip.html(
        dateString 
        + "<br/>"  
        + "<b>Deaths: </b>"+d.deaths
        + "<br/>"
        + "<b>Male: </b>"+DEATH_DATE_HASH_MAP.get(dateString).maleDeaths
        + "<br/>"
        + "<b>Female: </b>"+DEATH_DATE_HASH_MAP.get(dateString).femaleDeaths)	
        .style("left", (d3.event.pageX + 20) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");
}

function handleMouseOutForLineChat(g,d) {
    if(!selectedCircleData) {
        removeLineChartTooltip(g,d);
    }
}

function removeLineChartTooltip(g, d) {
    // Use D3 to select element, change color back to normal
    d3.select(g)
    .attr("r", 5)
    .attr("class", "dot");

    deathsSVGContainer.selectAll("g").remove();
    currentDisplayedList = DEATHS_AGE_SEX_LIST;
    displayAllDeaths(DEATHS_AGE_SEX_LIST);

    chartTooltip.transition()		
    .duration(500)		
    .style("opacity", 0);	
    d3.select(g).selectAll("text").remove();  // Remove text location
}

function handleMouseClickForLineChart(g, d) {    
    if(!selectedCircleData) {
        selectedCircleG = g;
        selectedCircleData = d;
        showLineChartTooltip(selectedCircleG, selectedCircleData);
    } else if(selectedCircleData && d && g && selectedCircleData.date!=d.date) {
        removeLineChartTooltip(selectedCircleG,selectedCircleData)
        selectedCircleG = g;
        selectedCircleData = d;
        showLineChartTooltip(selectedCircleG, selectedCircleData);
    } else {
        removeLineChartTooltip(selectedCircleG,selectedCircleData)
        selectedCircleG = undefined;
        selectedCircleData = undefined;
    }
}

function handleMouseClickOutsideLineChart() {
    console.log(d3.event.target)
    console.log(selectedCircleG)
    if(selectedCircleData) {
        if(d3.event.target!=selectedCircleG) {
            removeLineChartTooltip(selectedCircleG, selectedCircleData);
            selectedCircleG = undefined;
            selectedCircleData = undefined;
        }
    }
}

function getAgeRangeInString(sex) {
    switch(parseInt(sex)) {
        case AGE_1TO10:
            return "1 to 10";
        case AGE_11TO20:
            return "11 to 20";
        case AGE_21TO40:
            return "21 to 40";
        case AGE_41TO60:
            return "41 to 60";
        case AGE_61TO80:
            return "61 to 80";
        case AGE_80:
            return "> 80";
    }
}

function getSexString(sex) {
    if(sex==0) {
        return "Male";
    } else {
        return "Female";
    }
}

// Define the div for the tooltip
var mapTooltip = d3.select("body").append("div")	
    .attr("class", "tooltip-map")				
    .style("opacity", 0);

// Create Event Handlers for mouse
function handleMouseOverForMap(g,d) {  // Add interactivity
    // Use D3 to select element, change color and size
    d3.select(g)
    .attr("class", ".circle-hover")
    .attr("fill", circleColor(d, selectedLegend))
    .attr("r", 6);
    // Specify where to put label of text
    var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d.date);
    var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d.date);
    var dateString = `${day}-${month}`;

    d3.select(g)
    .append("text")
    .text(dateString);

    mapTooltip.transition()		
        .duration(200)		
        .style("opacity", .9);		
    mapTooltip.html(dateString 
        + "<br/>"  
        + "<b>Sex: </b>"+getSexString(parseInt(d.gender))
        + "<br/>"
        + "<b>Age: </b>"+getAgeRangeInString(d.age))	
        .style("left", (d3.event.pageX + 20) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");
}

function handleMouseOutForMap(g,d) {
    // Use D3 to select element, change color back to normal
    d3.select(g)
    .attr("class", ".dot-map")
    .attr("fill",circleColor(d, selectedLegend))
    .attr("r", DEATH_RADIUS);
    mapTooltip.transition()		
    .duration(500)		
    .style("opacity", 0);	
    // Select text by id and then remove
    d3.select(g).selectAll("text").remove();  // Remove text location
}

// Create Event Handlers for mouse
function handleMouseOverForBarGraph(g,d,totalDeaths) {  // Add interactivity
    // Use D3 to select element, change color and size
    d3.select(g)
    .attr("stroke", "#fff")

    d3.select(g)
    .append("text")
    .text(d);

    mapTooltip.transition()		
        .duration(200)		
        .style("opacity", .9);		
    mapTooltip.html(d
        + " out of "+totalDeaths+"<br/>")	
        .style("left", (d3.event.pageX + 20) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");
}

function handleMouseOutBarGraph(g,d) {
    // Use D3 to select element, change color back to normal
    d3.select(g)
    .attr("stroke","none");
    mapTooltip.transition()		
    .duration(500)		
    .style("opacity", 0);	
    // Select text by id and then remove
    d3.select(g).selectAll("text").remove();  // Remove text location
}

function createDateDeathHashMapV2() {    
    d3.csv("knowledge/deathdays.csv", function(daysData) {
        d3.csv("knowledge/deaths_age_sex.csv", function(data) {
            var sumOfDeathsTillDate = 0;

            for (let daysIndex = 0; daysIndex < daysData.length; daysIndex++) {
                const element = daysData[daysIndex];
                sumOfDeathsTillDate = sumOfDeathsTillDate + parseInt(element.deaths);

                var deathData = {
                    sumOfDeathsTillDate: sumOfDeathsTillDate,
                    deathsOnDate: element.deaths
                }
                DEATH_DATE_HASH_MAP.set(element.date, deathData);
                
                var maleDeaths = 0;
                var femaleDeaths = 0;
                var ageRange = 0;
                var deathList = [];
                var deathsOnDate = DEATH_DATE_HASH_MAP.get(element.date).deathsOnDate;
                var sumOfDeathsTillDate = DEATH_DATE_HASH_MAP.get(element.date).sumOfDeathsTillDate;
                for (let index = 0; index < deathsOnDate; index++) {
                    var death = data[sumOfDeathsTillDate-1+index];
                    var parseTime = d3.timeParse("%d-%b");
                    death["date"] = parseTime(element.date);
                    deathList.push(death);
                    DEATHS_AGE_SEX_LIST.push(death);
                    if (death.gender==0) {
                        maleDeaths = maleDeaths+1;
                        AGE_DEATH_HASH_MAP.get(parseInt(death.age)).maleDeaths = AGE_DEATH_HASH_MAP.get(parseInt(death.age)).maleDeaths + 1;   
                    } else {
                        femaleDeaths = femaleDeaths+1;
                        AGE_DEATH_HASH_MAP.get(parseInt(death.age)).femaleDeaths = AGE_DEATH_HASH_MAP.get(parseInt(death.age)).femaleDeaths + 1;   
                    }
                    AGE_DEATH_HASH_MAP.get(parseInt(death.age)).totalDeaths = AGE_DEATH_HASH_MAP.get(parseInt(death.age)).totalDeaths + 1;                       
                }
                DEATH_DATE_HASH_MAP.get(element.date)["deathList"] = deathList;
                DEATH_DATE_HASH_MAP.get(element.date)["maleDeaths"] = maleDeaths;
                DEATH_DATE_HASH_MAP.get(element.date)["femaleDeaths"] = femaleDeaths;
            }
            currentDisplayedList = DEATHS_AGE_SEX_LIST;
            displayAllDeaths(currentDisplayedList);
            var barChartContainer = d3.select("#bar-chart"),
            margin = 110,
            width = 650 - margin,
            height = barChartContainer.attr("height") - 200

            var barSvg = barChartContainer.append("g")
            .attr("transform", "translate(" + 100 + "," + 80 + ")");

            drawBarChart(Array.from(AGE_DEATH_HASH_MAP.values()), barSvg, width, height);
        });
    });
}

createDateDeathHashMapV2();

function filterDeathDaysByDateV2(date) {
    console.log(date)
    deathsSVGContainer.selectAll("circle").remove();
    var deathsOnDate = DEATH_DATE_HASH_MAP.get(date).deathsOnDate;
    var sumOfDeathsTillDate = DEATH_DATE_HASH_MAP.get(date).sumOfDeathsTillDate;
    currentDisplayedList = DEATH_DATE_HASH_MAP.get(date).deathList;
    drawCircles(currentDisplayedList, DEATH_RADIUS, deathsSVGContainer, MAP_HEIGHT, selectedLegend)
}

var scale = 1.0;

var zoom = d3.zoom()
    .scaleExtent([1, 5])
    .on("zoom", zoomed);

var mapSVGContainer = d3.select("#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", viewBox)
    .classed("svg-content-responsive", true)
    // .call(zoom);
    ;

d3.json("knowledge/streets.json", function(data) {
    data.forEach(element => {
        drawMap(element, mapSVGContainer)
    });
});

var lineChartContainer = d3.select("#main"),
            margin = 110,
            width = 750 - margin,
            height = lineChartContainer.attr("height") - 250

lineChartContainer.on("click", handleMouseClickOutsideLineChart);

var lineChartSvg = lineChartContainer.append("g")
            .attr("transform", "translate(" + 70 + "," + 100 + ")");
            
d3.csv("knowledge/deathdays.csv", function(data) {
    DEATH_DAYS_LIST = data.slice(0);
    // drawBarChart(data, g);
    drawLineChart(data, lineChartSvg, width, height);
});

var deathsSVGContainer = d3.select("#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", viewBox)
    .classed("svg-content-responsive", true)
    // .call(zoom);

function drawDeathCircles(death, radius) {
    if (death.gender==0) {
        drawCircle(death, radius, MALE_COLOR, deathsSVGContainer, selectedLegend)
    } else {
        drawCircle(death, radius, FEMALE_COLOR, deathsSVGContainer, selectedLegend)
    }
}

function displayAllDeaths(list) {
    drawCircles(list, DEATH_RADIUS, deathsSVGContainer, MAP_HEIGHT, selectedLegend)
}

var pumpSVGContainer = d3.select("#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", viewBox)
    .classed("svg-content-responsive-pumps", true)
    // .call(zoom);

d3.csv("knowledge/pumps.csv", function(data) {
    PUMPS_LIST = data;
    drawRectangles(PUMPS_LIST, PUMP_RADIUS, pumpSVGContainer, MAP_HEIGHT, selectedLegend, PUMP_COLOR)
});

function zoomed() {
    console.log(d3.event)
    var translateX = d3.event.transform.x;
    var translateY = d3.event.transform.y;
    var xScale = d3.event.transform.k;
    mapSVGContainer.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
    deathsSVGContainer.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
    pumpSVGContainer.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
  }
  
function reset() {
    scale = 1.0;
    mapSVGContainer.attr("transform", "translate(0,0)scale(1,1)");
    deathsSVGContainer.attr("transform", "translate(0,0)scale(1,1)");
    pumpSVGContainer.attr("transform", "translate(0,0)scale(1,1)");
    zoom.scale(scale)
    .translate([0,0]);
}

function handleBrushToggle(cb){
    console.log(cb.checked)
    if(cb.checked) {
        if(selectedCircleData) {
            removeLineChartTooltip(selectedCircleG, selectedCircleData);
        }
        addBursh(lineChartSvg)
    } else {
        removeBrush(lineChartSvg)
        deathsSVGContainer.selectAll("circle").remove();
        currentDisplayedList = DEATHS_AGE_SEX_LIST;
        displayAllDeaths(DEATHS_AGE_SEX_LIST);
        d3.select('.line-chart-bg').dispatch('click');
    }
}