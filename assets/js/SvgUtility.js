
/**
 * CODE FOR DRAWING MAP
 */
//Draw lines for map
var drawLine = d3.line()
.x(function(d) { return MAP_HEIGHT*d.x; })
.y(function(d) { return MAP_HEIGHT*d.y; })
.curve(d3.curveLinear);

/**
 *Draw map function 
 *parameter - one pair of xy co-ordinates
 */
function drawMap(item, container) {
    var lineGraph = container.append("path")
    .attr("d", drawLine(item))
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("fill", "white")
    .classed("line", true);
}


// Create Event Handlers for mouse
function handleMouseOver(g,d) {  // Add interactivity
    // Use D3 to select element, change color and size
    d3.select(g).select("circle").attr({
        fill: "orange",
        r: PUMP_RADIUS * 2
    });

    // Specify where to put label of text
    d3.select(g)
    .append("text")
    .text("Pump");
}

function handleMouseOut(g,d) {
    // Use D3 to select element, change color back to normal
    d3.select(g).select("circle").attr({
        fill: PUMP_COLOR,
        r: PUMP_RADIUS
    });

    // Select text by id and then remove
    d3.select(g).selectAll("text").remove();  // Remove text location
}

/**
 * Draw circles on map
 * @param {x,y coordinates} item 
 */

function drawCircle(item, radius, color, container, legend) {
    var g = container
    .append("g")
    .attr("transform", function(d) {
        return "translate(" + MAP_HEIGHT*item.x + ","+ MAP_HEIGHT*item.y +")" ;
    })
    
    // .on("mouseover", function(){return handleMouseOver(this, item);})
    // .on("mouseout", function(){return handleMouseOut(this, item);});

    g.append("circle")
    .attr("r", radius)
    .attr("fill", function() {
        if(legend) {
            return circleColor(item, legend)
        } else {
            return color;
        }
    })
    .attr("stroke", "#4f4f4f");
}

function drawCircles(data, radius, container, scale, legend, color) {
    container.selectAll(".dot-map")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", ".dot-map")
        .attr("fill", function(d) {
            if(color) {
                return color;
            }
            return circleColor(d, legend);
        })
        .attr("stroke", "#4f4f4f")
        .attr("cx", function(d, i) { 
            return scale*d.x })
        .attr("cy", function(d, i) { return scale*d.y })
        .attr("r", radius)
        .on("mouseover", function(item){return handleMouseOverForMap(this, item);})
        .on("mouseout", function(item){return handleMouseOutForMap(this, item);});
}

function drawRectangles(data, side, container, scale, legend, color) {
    container.selectAll(".male-bar")
    .data(data)
    .enter().append("rect")
    .attr("x", function(d,i) { return scale*d.x; })
    .attr("y", function(d) { 
        return scale*d.y; })
    .attr("width", side)
    .attr("height", side)
    .attr("fill", function(d) {
        if(color) {
            return color;
        }
        return circleColor(d, legend);
    })
    .attr("stroke", "#afafaf")
    ;
}

function circleColor(data, legend) {
    switch(legend) {
        case LEGEND_NONE:
            return DEATH_COLOR;
        case LEGEND_AGE:
            switch(parseInt(data.age)) {
                case AGE_1TO10:
                    return AGE_HASH_MAP.get(AGE_1TO10);
                case AGE_11TO20:
                    return AGE_HASH_MAP.get(AGE_11TO20);
                case AGE_21TO40:
                    return AGE_HASH_MAP.get(AGE_21TO40);
                case AGE_41TO60:
                    return AGE_HASH_MAP.get(AGE_41TO60);
                case AGE_61TO80:
                    return AGE_HASH_MAP.get(AGE_61TO80);
                default:
                    return AGE_HASH_MAP.get(AGE_80);
            }
        case LEGEND_SEX:
            if (data.gender==0) {
                return MALE_COLOR;
            } else {
                return FEMALE_COLOR;
            }
        default:
            return "#000"
    }
}

/**
 * Draw Bar Chart for death days
 * @param {deathdays csv data} data 
 */
function drawBarChart(data, svg, width, height) {
    console.log(data)
    var ageRanges = ["1 to 10", "11 to 20", "21 to 40", "41 to 60", "61 to 80", "> 80"]
    var maxValue = 0;
    d3.max(data, function(d) {
        if(parseInt(d.totalDeaths)>parseInt(maxValue)) {
            maxValue = d.totalDeaths;
        }
    });
    var xScale = d3.scaleBand()
    .domain(ageRanges)       // This is what is written on the Axis: from 0 to 100
    .range([0, width])                       // This is where the axis is placed: from 100 px to 800px
    .padding([0.6])    
    var yScale = d3.scaleLinear().range([height, 0]);
    yScale.domain([0, d3.max(data, function(d) { 
        return d.totalDeaths+17;
     })]);

    svg.selectAll(".male-bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "male-bar")
    .attr("x", function(d,i) { return xScale(ageRanges[i]); })
    .attr("y", function(d) { 
        return yScale(d.maleDeaths); })
    .attr("width", xScale.bandwidth())
    .attr("height", function(d) { return height - yScale(d.maleDeaths); });

    svg.selectAll(".female-bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "female-bar")
    .attr("x", function(d,i) { return xScale(ageRanges[i]); })
    .attr("y", function(d) { 
        return yScale(d.totalDeaths); })
    .attr("width", xScale.bandwidth())
    .attr("height", function(d) { return height - yScale(d.femaleDeaths); });
    
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("dx", "-2.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)" );

    svg.append("g")
    .call(d3.axisLeft(yScale).tickFormat(function(d){
        return d;
    })
    .ticks(10))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "-5.1em")
    .attr("text-anchor", "end")
    .attr("stroke", "black");

    svg.selectAll(".domain")
    .attr("class", "axes");

    svg.selectAll(".tick")
    .selectAll("line")
    .attr("class", "axes");

    // text label for the x axis
    svg.append("text")             
    .attr("transform",
            "translate(" + (width/2) + " ," + 
                        (height + 80) + ")")
    .style("text-anchor", "middle")
    .text("Age Range");

    // text label for the y axis
    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 60)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Deaths");  


}

function drawLineChart(data, svg, width, height) {
    // parse the date / time
    var parseTime = d3.timeParse("%d-%b");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.deaths); });

    // format the data
    data.forEach(function(d) {
        d.date = parseTime(d.date);
        d.deaths = +d.deaths;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.deaths+17; })]);

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line-chart")
        .attr("d", valueline);
    
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d, i) { 
            return x(d.date) })
        .attr("cy", function(d, i) { return y(d.deaths) })
        .attr("r", 5)
        .on("click", function(item){return handleMouseClickForLineChart(this, item)})
        .on("mouseover", function(item){return handleMouseOverForLineChat(this, item);})
        .on("mouseout", function(item){return handleMouseOutForLineChat(this, item);});

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".domain")
    .attr("class", "axes");

    svg.selectAll(".tick")
    .selectAll("line")
    .attr("class", "axes");

    // text label for the x axis
    svg.append("text")             
    .attr("transform",
            "translate(" + (width/2) + " ," + 
                        (height + 50) + ")")
    .style("text-anchor", "middle")
    .text("Timeline");

    // text label for the y axis
    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 60)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Deaths");  

}

function addBursh(svg) {
     // Add brushing
     var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
     .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
     .on("end", updateChart )               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    var line = svg.append('g')
    .attr("clip-path", "url(#clip)")

    // Add the brushing
    line
    .append("g")
    .attr("class", "brush")
    .call(brush);

    svg.on("dblclick", function() {
        line.select(".brush").call(brush.move, null)
        // This remove the grey brush area as soon as the selection has been done
    })
}

function removeBrush(svg) {
    brushTooltip.transition()		
    .duration(500)		
    .style("opacity", 0);	
    // Select text by id and then remove
    d3.select(".brush").selectAll("text").remove();  // Remove text location
    svg.selectAll(".brush").remove();
}

function updateChart() {
    var maleDeaths = 0,
        femaleDeaths = 0,
        totalDeaths = 0;
    var firstDate = undefined,
        lastDate = undefined;
    // Define the div for the tooltip
    
    if(d3.event.selection!=null) {
        eventXPoints = d3.event.selection;
        var listOfCircles = lineChartSvg.selectAll(".dot")._groups[0]
        var listOfDeaths = [];
        for (let index = 0; index < listOfCircles.length; index++) {
            var self = d3.select(listOfCircles[index]);
            var element = d3.select(listOfCircles[index]).data()[0];
            x = parseFloat(self.attr('cx')) + parseFloat(2)
            if(x<eventXPoints[1]) {
                if(eventXPoints[0]<x) {
                    var element = d3.select(listOfCircles[index]).data()[0];
                    listOfDeaths.push.apply(listOfDeaths, getDeathsForDate(getStringFromDate(element.date)))
                    maleDeaths = maleDeaths + DEATH_DATE_HASH_MAP.get(getStringFromDate(element.date)).maleDeaths;
                    femaleDeaths = femaleDeaths + DEATH_DATE_HASH_MAP.get(getStringFromDate(element.date)).femaleDeaths;
                    totalDeaths = totalDeaths + DEATH_DATE_HASH_MAP.get(getStringFromDate(element.date)).deathList.length;
                    if(!firstDate) {
                        firstDate = getStringFromDate(element.date);
                    }
                    lastDate = getStringFromDate(element.date);
                }
            } else break;
        }
        deathsSVGContainer.selectAll("circle").remove();
        currentDisplayedList = listOfDeaths;
        drawCircles(listOfDeaths, DEATH_RADIUS, deathsSVGContainer, MAP_HEIGHT, selectedLegend)

        d3.select(".brush")
        .append("text")
        .text(firstDate+" to "+lastDate);
        console.log(firstDate+" to "+lastDate)
        brushTooltip.transition()		
            .duration(200)		
            .style("opacity", .9);		
        brushTooltip.html(firstDate+" to "+lastDate 
            + "<br/>"  
            + "<b>Deaths: </b>" + totalDeaths
            + "<br/>"
            + "<b>Male: </b>" +maleDeaths
            + "<br/>"
            + "<b>Female: </b>" +femaleDeaths)	
            .style("left", (d3.event.sourceEvent.screenX + 20) + "px")		
            .style("top", (230) + "px");
            console.log(d3.event)
    } else {
        deathsSVGContainer.selectAll("circle").remove();
        brushTooltip.transition()		
        .duration(500)		
        .style("opacity", 0);	
        // Select text by id and then remove
        d3.select(".brush").selectAll("text").remove();  // Remove text location
        currentDisplayedList = DEATHS_AGE_SEX_LIST;
        displayAllDeaths(DEATHS_AGE_SEX_LIST);
    }
}

function getDeathsForDate(date) {
    return DEATH_DATE_HASH_MAP.get(date).deathList
}

function getStringFromDate(date) {
    var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
    var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
    var dateString = `${day}-${month}`;
    return dateString;
}