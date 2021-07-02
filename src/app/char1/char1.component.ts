import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

@Component({
  selector: 'app-char1',
  templateUrl: './char1.component.html',
  styleUrls: ['./char1.component.css']
})
export class Char1Component implements OnInit {

  constructor() { 
    
  }

  ngOnInit(): void {
      const svg: any = d3.select('#linechart1').append('svg').attr('width', 1200).attr("height", 500);

      const width = +svg.attr("width");
      const height = +svg.attr("height");

      const render = (data: {temperature: number, timestamp: Date}[]) => {
        const title = 'A week in Sanfrancisco';
        const xValue = d => d.timestamp;
        const xAxisLabel = 'Time';

        const yValue = d => d.temperature;
        const yAxisLabel = 'Temperature';
        const margin = {
          top: 80,
          right: 40,
          left: 100,
          bottom: 70,
        };
        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;
        const circleRadius = 10;

        const xScale = d3Scale.scaleTime().domain(d3Array.extent(data, xValue)).range([0, innerWidth]).nice();
        const yScale = d3Scale.scaleLinear().domain(d3Array.extent(data, yValue)).range([innerHeight, 0]). nice();

        // console.log(d3Array.extent(data, xValue));

        const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

        const xAxis = d3Axis.axisBottom(xScale).tickSize(-innerHeight).tickPadding(15);
        const yAxis = d3Axis.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10);

        const yAxisG = g.append('g').call(yAxis);
        yAxisG.selectAll(".domain").remove();
        yAxisG
          .append("text")
          .attr("class", "axis-label")
          .attr('y', -50)
          .attr('x', -innerHeight / 2)
          .attr('fill', 'black')
          .attr('transform', `rotate(-90)`)
          .attr('text-anchor', `middle`)
          .text(yAxisLabel);
        
          const xAxisG = g.append("g").call(xAxis).attr("transform", `translate(0, ${innerHeight})`);

          xAxisG.select(".domain").remove();
          xAxisG.append("text")
            .attr("class", "axis-label")
            .attr('y', 60)
            .attr('x', innerWidth / 2)
            .attr('fill', 'black')
            .text(xAxisLabel);
          
          g.append("text").attr("class", "title").attr("y", -10).text(title);

          const lineGenerator: any = d3.line()
            .x(d => xScale(xValue(d)))
            .y(d => yScale(yValue(d)))
            .curve(d3.curveBasis); 

          g.append("path")
          .datum(data)
          .attr("class", "line-path")
          .attr("fill", "none")
          .attr("stroke", "blue")
          .attr("stroke-width", "1.5px")
          .attr("d", lineGenerator);

      }
      d3.csv('https://vizhub.com/curran/datasets/temperature-in-san-francisco.csv')
        .then(data => {
          let newArr: {temperature: number, timestamp: Date}[] = [];        
          for (let i = 0; i < data.length; i++){
            newArr.push({
              temperature: +data[i].temperature,
              timestamp: new Date(data[i].timestamp)
            })
          }
          // console.log(newArr);
          render(newArr);
        })
        .catch(error => console.log(error));
      }


}