(function () {
  // Margin convention
  const margin = { top: 80, right: 30, bottom: 50, left: 120 }
  const width = 700 - margin.left - margin.right
  const height = 800 - margin.top - margin.bottom

  // You'll probably need to edit this one
  const svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  const xPositionScale = d3.scaleLinear()
    .domain([0, 38])
    .range([0, width])
    .clamp(true)

  const colorScale = d3.scaleThreshold()
    .domain([20, 25, 30])
    .range(["#b35806", "#f1a340", "#fee0b6", "#d8daeb"].reverse())
  const continent = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"]
  const yPositionScale = d3.scalePoint()
    .domain(continent)
    .range([0, height])
  const radiusScale = d3.scaleSqrt()
    .domain([0, 1000])
    .range([0, 10])
  // hey!!
  // let's simulate how these datapoints interact
  // and we'll make sure they don't overlap
  const forceX = d3.forceX(d => xPositionScale(d.rate)).strength(2)
  const forceYSplit = d3.forceY(d => yPositionScale(d.continent))
  const forceYCombined = d3.forceY(height / 5)
  const forceCollide = d3.forceCollide(d => radiusScale(d.gdp) + 1)
  const simulation = d3.forceSimulation()
    .force("overlap", forceCollide)
    .force("y", forceYCombined)
    .force("x", forceX)
  d3.tsv("filename.tsv")
    .then(ready)
  function ready (datapoints) {
    console.log("I'm here!!!!")
    datapoints.forEach(d => {
      d.x = xPositionScale(d.rate);
      d.y = height / 2;
    })

    // Put a text element for every single sector
    // And space them out on the y axis according to the scale
    
    svg.selectAll('circle')
      .data(datapoints)
      .join('circle')
      .attr('r', d => radiusScale(d.gdp))
      .attr('cx', d => xPositionScale(d.rate))
      .attr('fill', d => colorScale(d.rate))
      .attr('cy', d => yPositionScale(d.continent))
      .attr('stroke', '#333333')
    svg.selectAll('text')
      .data(continent)
      .join('text')
      .attr('text-anchor', 'end')
      .attr('y', d => yPositionScale(d))
      .attr('dx', -10)
      .text(d => d)

    d3.select("#combined")
      .on('click', function () {
        // Substitute forceYCombined as our y force
        // instead of whatever was there before
        simulation.force("y", forceYCombined)
        // reheat the simulation (restart it)
        simulation
          .alpha(0.05)
          .alphaTarget(0.05)
          .restart();
        svg.selectAll("text")
          .transition()
          .style('opacity', 0)
      })

      d3.select("#continent")
        .on('click', function () {
          // Substitute forceYCombined as our y force
          // instead of whatever was there before
          simulation.force("y", forceYSplit)
          // reheat the simulation (restart it)
          simulation
            .alpha(0.1)
            .alphaTarget(0.1)
            .restart();
            svg.selectAll("text")
            .transition()
            .style('opacity', 1)
          })

    simulation.nodes(datapoints)
      .on('tick', ticked)
    function ticked() {
      console.log("tick tick tick")
      svg.selectAll('circle')
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      // adding x-axis at the top
      let xAxis = g => g
      .attr("transform", `translate(0,${-margin.top/2})`)
      .call(d3.axisTop(xPositionScale))
      svg.append("g")
      .call(xAxis);
    }
  }
})();