import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { easeLinear } from 'd3';

@Component({
  selector: 'app-realtime2',
  templateUrl: './realtime2.component.html',
  styleUrls: ['./realtime2.component.css']
})
export class Realtime2Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
    var n      = 40,
    random = d3.randomNormal(0, .5),
    data   = d3.range(n).map(random),
    data2  = d3.range(n).map(random);

var margin = {top: 20, right: 20, bottom: 20, left: 40},
    width  = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleLinear()
        .domain([0, n - 1])
        .range([0, width]);

var y: any = d3.scaleLinear()
        .domain([d3.min(data), d3.max(data)])
        .range([height, 0]);

var line: any = d3.line()
        .x((d,i) => x(i))
        .y(d => y(d))
        .curve(d3.curveBumpX);

var svg = d3.select("#realtime2-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom(x));
        // .call(d3.svg.axis().scale(x).orient("bottom"));

svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));
        // .call(d3.svg.axis().scale(y).orient("left"));

var path = svg.append("g")
        .attr("clip-path", "url(#clip)")
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("d", line);

tick();

function tick() {

    // push a new data point onto the back
    data.push(random());

    // redraw the line, and slide it to the left
    path
            .attr("d", line)
            .attr("transform", null)
            .transition()
            .duration(500)
            .ease(easeLinear)
            // .ease("linear")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("transform", "translate(" + x(-1) + ",0)")
            .on("end", tick);

    // pop the old data point off the front
    data.shift();

}
    
  }
}
