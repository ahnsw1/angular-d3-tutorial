import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-stream',
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.css']
})
export class StreamComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    //realtime 차트 만들기
    var chart = this.realTimeChartMulti()
            .title("Chart Title")
            .yTitle("Categories")
            .xTitle("Time")
            .yDomain(["Category1"]) // initial y domain (note array)
            .border(true)
            .width(900)
            .height(350);

    //chart 호출하기
    var chartDiv = d3.select("#stream-chart")
            .call(chart);
    // chart(chartDiv) //똑같다
    
    // Mean and deviation for generation of time intervals
        var tX = 5; // time constant, multiple of one second
        var meanMs = 1000 * tX; // milliseconds
        var dev = 200 * tX; // std dev

        // Define time scale
        var timeScale = d3.scaleLinear()
            .domain([300 * tX, 1700 * tX])
            .range([300 * tX, 1700 * tX])
            .clamp(true);

        // Define function that returns normally distributed random numbers
        var normal = d3.randomNormal(meanMs, dev);

        // Define color scale
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // In a normal use case, real time data would arrive through the network or some other mechanism
        var d = -1;
        var shapes = ["rect", "circle"];
        var timeout = 0;
    
        function dataGenerator() {
            setTimeout(function () {
                // Add categories dynamically
                d++;
                switch (d) {
                    case 5:
                        chart.yDomain(["Category1", "Category2"]);
                        break;
                    case 10:
                        chart.yDomain(["Category1", "Category2", "Category3"]);
                        break;
                    default:
                }

                // Output a sample for each category, each interval (five seconds)
                chart.yDomain().forEach(function (cat, i) {

                    // Create randomized timestamp for this category data item
                    var now = new Date(new Date().getTime() + i * (Math.random() - 0.5) * 1000);

                    // Create new data item
                    var obj;
                    var doSimple = false;
                    if (doSimple) {
                        obj = {
                            // Simple data item (simple black circle of constant size)
                            time: now,
                            color: "black",
                            opacity: 1,
                            category: "Category" + (i + 1),
                            type: "circle",
                            size: 5,
                        };

                    } else {
                        obj = {
                            // Complex data item; four attributes (type, color, opacity and size) are changing dynamically with each iteration (as an example)
                            time: now,
                            color: color(d % 10 + ""),
                            opacity: Math.max(Math.random(), 0.3),
                            category: "Category" + (i + 1),
                            // type: shapes[Math.round(Math.random() * (shapes.length - 1))], // the module currently doesn't support dynamically changed svg types (need to add key function to data, or method to dynamically replace svg object – tbd)
                            type: "circle",
                            size: Math.max(Math.round(Math.random() * 12), 4),
                        };
                    }

                    // Send the datum to the chart
                    chart.datum(obj);
                });

                // Drive data into the chart at average interval of five seconds
                // here, set the timeout to roughly five seconds
                timeout = Math.round(timeScale(normal()));

                // Do forever
                dataGenerator();
            }, timeout);
        }
        dataGenerator();
    
  }

  realTimeChartMulti() {
    var version = "0.1.0",
      datum, data,
      maxSeconds = 300, pixelsPerSecond = 10,
      svgWidth = 700, svgHeight = 300,
      margin = { top: 20, bottom: 20, left: 100, right: 30, topNav: 10, bottomNav: 20 },
      dimension = { chartTitle: 20, xAxis: 20, yAxis: 20, xTitle: 20, yTitle: 20, navChart: 70 },
      maxY = 100, minY = 0,
      chartTitle, yTitle, xTitle,
      drawXAxis = true, drawYAxis = true, drawNavChart = true,
      border,
      selection,
      barId = 0,
      yDomain = [],
      debug = false,
      barWidth = 5,
      halted = false,
      x, y,
      xNav, yNav,
      width, height,
      widthNav, heightNav,
      xAxisG, yAxisG,
      xAxis, yAxis,
      svg;

    //차트 만들기
    const chart = (s) => {
      selection = s;
      if (selection == undefined) {
        console.error("selection is undefined");
        return null;
      }
    

      //제목 정하기
      chartTitle = chartTitle || "";
      yTitle = yTitle || "";
      xTitle = xTitle || "";

      //컴포넌트 치수 정하기
      const chartTitleDim = chartTitle == "" ? 0 : dimension.chartTitle,
        xTitleDim = xTitle == "" ? 0 : dimension.xTitle,
        yTitleDim = yTitle == "" ? 0 : dimension.yTitle,
        xAxisDim = !drawXAxis ? 0 : dimension.xAxis,
        yAxisDim = !drawYAxis ? 0 : dimension.yAxis,
        navChartDim = !drawNavChart ? 0 : dimension.navChart;

      // compute dimension of main and nav charts, and offsets
      var marginTop = margin.top + chartTitleDim;
      height = svgHeight - marginTop - margin.bottom - chartTitleDim - xTitleDim - xAxisDim - navChartDim + 30;
      heightNav = navChartDim - margin.topNav - margin.bottomNav;
      var marginTopNav = svgHeight - margin.bottom - heightNav - margin.topNav;
      width = svgWidth - margin.left - margin.right;
      widthNav = width;

      // svg 추가!
      // svg = d3.select("#stream-chart").append("svg")
      svg = selection.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("border", function(d) { 
          if (border) return "1px solid lightgray"; 
          else return null;
        });

      //main 그룹 만들기
      const main = svg.append("g").attr("transform", `translate(${margin.left}, ${marginTop})`);

      //clip-path 만들기
      main.append("defs").append("clipPath")
          .attr("id", "myClip")
        .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", width)
          .attr("height", height);

      //chart 배경 만들기
      main.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .style("fill", "#f5f5f5");

      //여기서 두개의 그룹이 생성되며, 후자는 barG에 할당된다.
      //전자에는 개체를 차트 영역으로 제한하는 클립 경로가 포함된다.
      //데이터가 전체 시간 도메인에 대해 잘리기 때문에, 탐색 차트에 대한 동등한 클립 경로가 생성되지 않는다
      const barG = main.append("g")
                        .attr("class", "barGroup")
                        .attr("transform", "translate(0,0)")
                        .attr("clip-path", "url(#myClip)")
                      .append("g");
      
      //x축 그룹을 생성한다
      xAxisG = main.append("g").attr("class", "x axis").attr("transform", `translate(0, ${height})`);

      //y축 그룹을 생성한다
      yAxisG = main.append("g").attr("class", "y axis");

      //x축 그룹에, x축 타이틀을 생성한다
      xAxisG.append("text")
              .attr("class", "title")
              .attr("x", width / 2)
              .attr("y", 25)
              .attr("dy", ".71em")
              .text(d => xTitle == undefined ? "" : xTitle);
      
      //y축 그룹에, y축 타이틀을 생성한다
      yAxisG.append("text")
              .attr("class", "title")
              .attr("transform", "rotate(-90)")
              .attr("x", - height / 2)
              .attr("y", - margin.left + 15) //-35
              .attr("dy", ".71em")
              .text(d => yTitle == undefined ? "" : yTitle);

      //main 그룹에, chart 타이틀을 생성한다
      main.append("text")
            .attr("class", "chartTitle")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("dy", ".71em")
            .text(d => chartTitle == undefined ? "" : chartTitle);
      
      //main 차트 범위를 정의한다
      x = d3.scaleTime().range([0, width]);

      //rangeRoundPoint는 scalePoint()를 쓰고, 뒤에 padding을 쓰는 것으로 바뀌었다. 
      // y = d3.scale.ordinal().domain(yDomain).rangeRoundPoints([height, 0], 1)
      y = d3.scalePoint().domain(yDomain).rangeRound([height, 0]).padding(.1); 

      //main 차트 축을 정의한다
      xAxis = d3.axisBottom(x)(xAxisG)
      yAxis = d3.axisLeft(y)(yAxisG)
    
      //nav 차트 추가
      const nav = svg.append("g")
                      .attr("transform", `translate(${margin.left}, ${marginTopNav})`);
      //nav 배경 추가
      nav.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", width)
          .attr("height", heightNav)
          .style("fill", "#F5F5F5")
          .style("shape-rendering", "crispEdges")
          .attr("transform", "translate(0, 0)");

          //data items에 그룹 추가하기
      const navG = nav.append("g").attr("class", "nav");
      
      //nav x축을 잡기위해 그룹 추가
      //clip path가 아직 여기 추가되지 않았다.
      const xAxisGNav = nav.append("g")
                            .attr("class", "x axis")
                            .attr("transform", `translate(0, ${heightNav})`);
      
      //nav 차트 범위 정의하기
      xNav = d3.scaleTime().range([0, widthNav]);
      yNav = d3.scalePoint().domain(yDomain).rangeRound([heightNav, 0]).padding(.1);

      //nav 축 정의
      let xAxisNav = d3.axisBottom(xNav)(xAxisGNav);

      //처음 시간 domain정의
      const ts = new Date().getTime();

      //전체 시간 도메인
      let endTime = new Date(ts);
      let startTime = new Date(endTime.getTime() - maxSeconds * 1000);
      const interval = endTime.getTime() - startTime.getTime();

      //viewport 시간 도메인(main차트와 nav차트에서 보여지는 것)
      let endTimeViewport = new Date(ts);
      let startTimeViewport = new Date(endTime.getTime() - width / pixelsPerSecond * 1000);
      let intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
      let offsetViewport = startTimeViewport.getTime() - startTime.getTime();

      //main차트와 nav차트 범위 도메인 설정하기
      x.domain([startTimeViewport, endTimeViewport]);
      xNav.domain([startTime, endTime]);

      //brush 만들기(시간에 따라 움직이는 슬라이드), 메인 차트의 시간 도메인을 결정하는 이동, 크기를 변경 가능한 사각형
      const viewport = d3.brushX()
        .extent([[xNav.range()[0], 0], [xNav.range()[1], heightNav]])
        .on("brush", () => {
          //viewport의 현재 시간 범위 구하기
          const extent = viewport.extent();
          startTimeViewport = extent[0];
          endTimeViewport = extent[1];

          //viewport 범위를 밀리초로 계산 
          intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
          offsetViewport = startTimeViewport.getTime() - startTime.getTime();

          //보이지 않는 viewport 다루기
          if (intervalViewport == 0) {
            intervalViewport = maxSeconds * 1000;
            offsetViewport = 0;
          }

          //main차트의 x도메인 업데이트
          x.domain(extent);
          xAxis.axisBottom(x)(xAxisG);

          //update display
          refresh();
      });
      const viewportG = nav.append("g").attr("class", "viewport").call(viewport).selectAll("rect").attr("height", heightNav);
      
      data = [];
      refresh();

      // function to refresh the viz upon changes of the time domain
      // (which happens constantly), or after arrival of new data, or at init
      function refresh() {
        // process data to remove too late data items
        data = data.filter(function (d) {
          if (d.time.getTime() > startTime.getTime()) return true;
          return false;
        });

        // determine number of categories
        var categoryCount = yDomain.length;
        if (debug) console.log('yDomain', yDomain);

        // here we bind the new data to the main chart
        // note: no key function is used here; therefore the data binding is
        // by index, which effectivly means that available DOM elements
        // are associated with each item in the available data array, from
        // first to last index; if the new data array contains fewer elements
        // than the existing DOM elements, the LAST DOM elements are removed;
        // basically, for each step, the data items "walks" leftward (each data
        // item occupying the next DOM element to the left);
        // This data binding is very different from one that is done with a key
        // function; in such a case, a data item stays "resident" in the DOM
        // element, and such DOM element (with data) would be moved left, until
        // the x position is to the left of the chart, where the item would be
        // exited
        var updateSel = barG.selectAll('.bar')
          .data(data);

        // remove items
        updateSel.exit().remove();

        // add items
        updateSel.enter()
          .append(function (d) {
            if (debug) { console.log('d', JSON.stringify(d)); }
            if (d.type === undefined) console.error(JSON.stringify(d));
            var type = d.type || 'circle';
            var node = document.createElementNS('http://www.w3.org/2000/svg', type);
            return node;
          })
          .attr('class', 'bar')
          .attr('id', function () {
            return 'bar-' + barId++;
          });

        // update items; added items are now part of the update selection
        updateSel
          .attr('x', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'rect':
                var size = d.size || 6;
                retVal = Math.round(x(d.time) - size / 2);
                break;
              default:
            }
            return retVal;
          })
          .attr('y', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'rect':
                var size = d.size || 6;
                retVal = y(d.category) - size / 2;
                break;
              default:
            }
            return retVal;
          })
          .attr('cx', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'circle':
                retVal = Math.round(x(d.time));
                break;
              default:
            }
            return retVal;
          })
          .attr('cy', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'circle':
                retVal = y(d.category);
                break;
              default:
            }
            return retVal;
          })
          .attr('r', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'circle':
                retVal = d.size / 2;
                break;
              default:
            }
            return retVal;
          })
          .attr('width', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'rect':
                retVal = d.size;
                break;
              default:
            }
            return retVal;
          })
          .attr('height', function (d) {
            var retVal = null;
            switch (getTagName(this)) {
              case 'rect':
                retVal = d.size;
                break;
              default:
            }
            return retVal;
          })
          .style('fill', function (d) { return d.color || 'black'; })
          // .style('stroke', 'orange')
          // .style('stroke-width', '1px')
          // .style('stroke-opacity', 0.8)
          .style('fill-opacity', function (d) { return d.opacity || 1; });

        // create update selection for the nav chart, by applying data
        var updateSelNav = navG.selectAll('circle').data(data);

        // remove items
        updateSelNav.exit().remove();

        // add items
        updateSelNav.enter().append('circle')
          .attr('r', 1)
          .attr('fill', 'black');

        // added items now part of update selection; set coordinates of points
        updateSelNav
          .attr('cx', function (d) {
            return Math.round(xNav(d.time));
          })
          .attr('cy', function (d) {
            return yNav(d.category);
          });
      } // end refreshChart function


      function getTagName(that) {
        var tagName = d3.select(that).node().tagName;
        return (tagName);
      }

      // function to keep the chart 'moving' through time (right to left)
      setInterval(function () {
        if (halted) return;

        // get current viewport extent
        // var extent = viewport.empty() ? xNav.domain() : viewport.extent();
        // console.log();
        var extent = viewport.extent();
        var interval = extent[1].getTime() - extent[0].getTime();
        var offset = extent[0].getTime() - xNav.domain()[0].getTime();

        // compute new nav extents
        endTime = new Date();
        startTime = new Date(endTime.getTime() - maxSeconds * 1000);

        // compute new viewport extents
        startTimeViewport = new Date(startTime.getTime() + offset);
        endTimeViewport = new Date(startTimeViewport.getTime() + interval);
        // viewport.extent([startTimeViewport, endTimeViewport]);

        // update scales
        x.domain([startTimeViewport, endTimeViewport]);
        xNav.domain([startTime, endTime]);

        // update axis
        xAxis.axisBottom(x)(xAxisG);
        xAxisNav = d3.axisBottom(xNav)(xAxisGNav);

        // refresh svg
        refresh();
      }, 200);
      // end setInterval function

    return chart;
  }; // end chart function


    // chart getters/setters

    // new data item (this most recent item will appear
    // on the right side of the chart, and begin moving left)
    chart.datum = function (_) {
      if (arguments.length === 0) return datum;
      datum = _;
      data.push(datum);
      return chart;
    };

    // svg width
    chart.width = function (_) {
      if (arguments.length === 0) return svgWidth;
      svgWidth = _;
      return chart;
    };

    // svg height
    chart.height = function (_) {
      if (arguments.length === 0) return svgHeight;
      svgHeight = _;
      return chart;
    };

    // svg border
    chart.border = function (_) {
      if (arguments.length === 0) return border;
      border = _;
      return chart;
    };

    // chart title
    chart.title = function (_) {
      if (arguments.length === 0) return chartTitle;
      chartTitle = _;
      return chart;
    };

    // x axis title
    chart.xTitle = function (_) {
      if (arguments.length === 0) return xTitle;
      xTitle = _;
      return chart;
    };

    // y axis title
    chart.yTitle = function (_) {
      if (arguments.length === 0) return yTitle;
      yTitle = _;
      return chart;
    };

    // yItems (can be dynamically added after chart construction)
    chart.yDomain = function (_) {
      if (arguments.length === 0) return yDomain;
      yDomain = _;
      if (svg) {
        // update the y ordinal scale
        y = d3.scalePoint().domain(yDomain).rangeRound([height, 0]).padding(.1);
        // update the y axis
        yAxis.scale(y)(yAxisG);
        // update the y ordinal scale for the nav chart
        yNav = d3.scalePoint().domain(yDomain).rangeRound([heightNav, 0]).padding(.1);
      }
      return chart;
    };

    // debug
    chart.debug = function (_) {
      if (arguments.length === 0) return debug;
      debug = _;
      return chart;
    };

    // halt
    chart.halt = function (_) {
      if (arguments.length === 0) return halted;
      halted = _;
      return chart;
    };

    // version
    chart.version = version;

    return chart;
  }
}
