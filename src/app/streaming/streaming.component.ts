import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.component.html',
  styleUrls: ['./streaming.component.css']
})
export class StreamingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    let l = 21;
    const data = [];
    for (let i = 0; i < 100; i++) {
      data.push({ts: i, val: 10 + i})
    }
    let i = 0;
    setInterval(()=> {
      if (i < 99) {
        data[i] = { val: 10 + i, ts: i };
        data[i + 1] = { val: undefined, ts: i + 1};
      } else if (i === 99) {
        data[i] = { val: 10 + i, ts: i };
      }

      i++;
      l++;

      if (i > 99) {
        i = 0;
      }

      const width = 500;
      const height = 200;
      const margin = {
        left: 20, right: 30, top: 20, bottom: 10
      }

      d3.selectAll("svg").remove();

      const svg = d3.select("#streaming")
        .append("svg")
        .attr("viewBox", `0, 0, ${width}, ${height}`)
        
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      const g = svg.append("g");

      const xScale = d3.scaleLinear().range([0, width]).domain(d3.extent(data, d => d.ts));
      const yScale = d3.scaleLinear().range([height, 0]).domain(d3.extent(data, d => d.val));

      const line: any = d3.line()
        .defined((d:any) => !isNaN(d.val))
        .x((d: any) => xScale(d.ts))
        .y((d: any) => yScale(d.val))
        .curve(d3.curveBumpX);

      const chart = g.append("g")
        .attr("class", "chart")
        .attr("width", width);

      chart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("width", width)
        .attr("stroke-width", "1px")
        .attr("d", line);
    }, 100)
    

  }
}
