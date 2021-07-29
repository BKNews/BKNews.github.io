(function () {
  const margin = { top: 40, right: 30, bottom: 20, left: 40 };
  const width = 700 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  // You'll probably need to edit this one
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const xPositionScale = d3.scaleLinear().domain([0, 13]).range([0, width])
  const yPositionScale = d3.scaleLinear().domain([30, 330]).range([height, 0])
  // If you are drawing lines or areas or radials
  // all of your d => xPositionScale(d.whatever)
  // and d => yPositionScale(d.whatever)
  // goes into a const line = const area = 
  // this is me describing what the line should
  // look like in terms of x and y - it isn't attr("x")
  // and attr("y") because it's a CONCEPT not an SVG thing
  const line = d3.line()
    .x(d => xPositionScale(d.month))
    .y(d => yPositionScale(d.shootings))
  const area = d3.area()
    .x(d => xPositionScale(d.month))
    // .y0(height)
    .y0(yPositionScale(0)) // or this, "whatever 0 is for the y axis"
    .y1(d => yPositionScale(d.shootings))

  d3.csv("d3ScrollHW_new.csv").then(ready);
  function ready(datapoints) {
    console.log(datapoints)
    const datapoints2014 = datapoints.filter((d) => d.year == 2014)
    console.log('2014 data is', datapoints2014)
    // make a set of datapoints for each color group
    const winter = datapoints.filter((d) => d.year == 2014 && d.month <= 3)
    const spring = datapoints.filter((d) => d.year == 2014 && d.month > 3 && d.month <= 6)
    const summer = datapoints.filter((d) => d.year == 2014 && d.month > 6 && d.month <= 9)
    const autumn = datapoints.filter((d) => d.year == 2014 && d.month > 9 && d.month <= 12)
    // if you have a BUNCH of datapoints that you
    // want to attach to ONE thing (typically a path)
    // you're going to use .append("...").datum(datapoints)
    // make it a LINE by saying fill none and stroke black
    
    // making the year label
    // use xPositionScale, yPositionScale
    const yearLabel = svg.append("text")
    .attr("x", xPositionScale(11))
    .attr("y", yPositionScale(200))
    .attr('text-anchor', 'end') // right align
    .attr('font-size', "26px")
    .text("2014")

    svg.append("path")
      .datum(datapoints2014) // data is plural, but we only have one path!
      .attr('d', area) // no d => or function(d) here bc line wants ALL THE DATA
      .attr('id', 'temperature')
      .attr('fill', 'lightblue')
      .attr('opacity', 0.5)

    // this is the base chart
    svg.append("path")
      .datum(datapoints2014) // data is plural, but we only have one path!
      .attr('d', area) // no d => or function(d) here bc line wants ALL THE DATA
      .attr('id', 'baseline')
      .attr('fill', 'lightgrey')
      .attr('opacity', 0.5)
      .lower() // this pushes the base chart as the bottom layer

      svg.append('line')
      .attr('x1', xPositionScale(3))
      .attr('y1', 0)
      .attr('x2', xPositionScale(3))
      .attr('y2', height)
      .attr('stroke', 'lightgrey')
      .attr('opacity', 0.7)
      .attr('stroke-dasharray', '3 3')

      svg.append('line')
      .attr('x1', xPositionScale(6))
      .attr('y1', 0)
      .attr('x2', xPositionScale(6))
      .attr('y2', height)
      .attr('stroke', 'lightgrey')
      .attr('opacity', 0.7)
      .attr('stroke-dasharray', '3 3')

      svg.append('line')
      .attr('x1', xPositionScale(9))
      .attr('y1', 0)
      .attr('x2', xPositionScale(9))
      .attr('y2', height)
      .attr('stroke', 'lightgrey')
      .attr('opacity', 0.7)
      .attr('stroke-dasharray', '3 3')

      // svg.append('line')
      // .attr('x1', xPositionScale(12))
      // .attr('y1', 0)
      // .attr('x2', xPositionScale(12))
      // .attr('y2', height)
      // .attr('stroke', 'lightgrey')
      // .attr('opacity', 0.7)
      // .attr('stroke-dasharray', '3 3')

    d3.select('#step-1').on('stepin', function() {
      console.log('stepped into step number one!!!!')
      // make a list of datapoints from 1983
      // called datapoints1983
      const datapoints2016 = datapoints.filter((d) => d.year == 2016)
      console.log('2016 data is', datapoints2016)
      yearLabel.text("2016")
      // Grab the <path> that is the graph off of the path
      // Give it new cool better data
      // and then update the d="...." so it redraws
      svg.select("#temperature")
        .datum(datapoints2016)
        .transition()
        .duration(500) // half a second?
        .attr('d', area)
        .attr('fill', '#FDA172')
    })

    // making area charts for each of the three steps
    d3.select('#step-1').on('stepout', function() {
      console.log('stepped back to the top, let us draw 2014')
      const datapoints2014 = datapoints.filter((d) => d.year == 2014)
      console.log('2014 data is', datapoints2014)
      yearLabel.text("2014")
      svg.select("#temperature")
        .datum(datapoints2014)
        .transition()
        .duration(500) // half a second?
        .attr('d', area)
        .attr('fill', '#9fd8fb')
        
    })

    d3.select('#step-2').on('stepin', function() {
      const datapoints2018 = datapoints.filter((d) => d.year == 2018)
      console.log('2018 data is', datapoints2018)
      yearLabel.text("2018")
      svg.select("#temperature")
        .datum(datapoints2018)
        .transition()
        .duration(500) // half a second?
        .attr('d', area)
        .attr('fill', '#99EDC3')
    })

    d3.select('#step-3').on('stepin', function() {
      const datapoints2020 = datapoints.filter((d) => d.year == 2020)
      console.log('2020 data is', datapoints2020)
      yearLabel.text("2020")
      svg.select("#temperature")
        .datum(datapoints2020)
        .transition()
        .duration(500) // half a second?
        .attr('d', area)
        .attr('fill', 'tomato')
    })
  }
})();






