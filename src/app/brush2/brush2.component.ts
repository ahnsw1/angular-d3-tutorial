import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-brush2',
  templateUrl: './brush2.component.html',
  styleUrls: ['./brush2.component.css']
})
export class Brush2Component implements OnInit {

  constructor() { }

  ngOnInit(): void {

    const width = 1000;
    const height = 100;
    const interval = d3.timeHour.every(12);
    const margin = ({top: 10, right: 0, bottom: 20, left: 0});

    const svg = d3.select("#brush2-chart").append("svg")
      .attr("viewBox", `0, 0, ${width}, ${height}`);

    const brush = d3.brushX() 
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on("end", brushended);

    const x = d3.scaleTime()
      .domain([new Date(2013, 7, 1), +new Date(2013, 7, width / 60) - 1])
      .rangeRound([margin.left, width - margin.right]);

    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(g => g.append("g")
      .call(d3.axisBottom(x)
            .ticks(interval)
            .tickSize(-height + margin.top + margin.bottom)
            .tickFormat(() => null))
     .call(g => g.select(".domain")
            .attr("fill", "#ddd")
            .attr("stroke", null))
     .call(g => g.selectAll(".tick line")
            .attr("stroke", "#fff")
            .attr("stroke-opacity", d => d <= d3.timeDay(d) ? 1 : 0.5)))
      .call(g => g.append("g")
        .call(d3.axisBottom(x)
            .ticks(d3.timeDay)
            .tickPadding(0))
        .attr("text-anchor", null)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text").attr("x", 6)));

    svg.append("g")
      .call(xAxis);

    svg.append("g")
      .call(brush);

    function brushended(event) {
      const selection = event.selection;
      if (!event.sourceEvent || !selection) return;
      const [x0, x1] = selection.map(d => interval.round(x.invert(d)));
      d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
    }
  }

}
