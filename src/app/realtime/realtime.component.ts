import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-realtime',
  templateUrl: './realtime.component.html',
  styleUrls: ['./realtime.component.css']
})
//Focus와 context를 사용하기 위해서 d3-zoom, d3-brush를 함께 사용한다.
//focus차트는 줌이 일어나는 메인의 가장 큰 차트이다(설정한 영역을 보여주는 차트)
//context차트는 차트의 전체 부분
export class RealtimeComponent implements OnInit {
  constructor() { }

  width = 900;
  height = 500;

  ngOnInit(): void {
    const svg: any = d3.select("#realtime-chart").append('svg').attr('width', this.width).attr('height', this.height)
    // const svg = d3.create('svg').attr('width', this.width).attr('height', this.height)
    
    //focus와 context 차트의 기본 설정(마진, 가로, 세로)
    const focusChartMargin = { top: 20, right: 20, bottom: 170, left: 60};
    const contextChartMargin = {top: 360, right: 20, bottom: 90, left: 60}; 
    const chartWidth = this.width - focusChartMargin.left - focusChartMargin.right;
    const focusChartHeight = this.height - focusChartMargin.top - focusChartMargin.bottom;
    const contextChartHeight = this.height - contextChartMargin.top - contextChartMargin.bottom;

    svg.append("svg").attr("width", chartWidth + focusChartMargin.left + focusChartMargin.right)
    .append("g").attr("transform", `translate(${focusChartMargin.left}, ${focusChartMargin.top})`)

    const parseTime = d3.timeParse("%H:%M");

    //x축 범위를 구하기 위해 모든 데이터를 묶기
    const dates = [];
    for (let key of Object.keys(data)) {
      data[key].forEach(bucketRecord => {
        dates.push(parseTime(bucketRecord.date));
      })
    }

    //가장 높은 conversion을 찾아서 비교 후, y축의 최대값 정하기
    let maxYAxisValue = -Infinity;
    for (let key of Object.keys(data)) {
      const maxYAxisValuePerBucket = Math.ceil(d3.max<object,number>(data[key], d => d["conversion"]));
      maxYAxisValue = Math.max(maxYAxisValuePerBucket, maxYAxisValue);
    }

    //y축의 가장 높은 지점 정하기(focus, context 차트)
    const yFocus = d3.scaleLinear().range([focusChartHeight, 0]);
    const yContext = d3.scaleLinear().range([contextChartHeight, 0]);

    //x축의 가로 부분 정하기
    const xFocus = d3.scaleTime().range([0, chartWidth]);
    const xContext = d3.scaleTime().range([0, chartWidth]);

    //x축 만들기(focus, context)
    const xAxisFocus = d3.axisBottom(xContext).ticks(10).tickFormat(d3.timeFormat("%I:%M%p"));
    const xAxisContext = d3.axisBottom(xContext).ticks(10).tickFormat(d3.timeFormat("%I:%M%p"));

    //y축 만들기(focus에만! context차트에는 t축이 안들어간다)
    const yAxisFocus = d3.axisLeft(yFocus).tickFormat(d => d + "%");

    //brush 빌드하기
    const brush = d3.brushX().extent([[0, -10], [chartWidth, contextChartHeight]]).on("brush end", brushed);

    //zoom 빌드하기(focus 차트)
    //필터에 지정된 대로, 마우스가 초점 차트 위에 있는 동안 확대/축소 할 수 있다
    //마우스가 초점 차트 위에 있는 동안 두번 클릭하여 확대할 수 있다
    const zoom = d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0, 0], [chartWidth, focusChartHeight]]).extent([[0, 0], [chartWidth, focusChartHeight]]).on("zoom", zoomed).filter((event) => event.ctrlKey || event.type === "dblclick" || event.type === "mousedown");

    //line 만들기(focus, context 차트)
    const lineFocus = d3.line().x((d:any) => xFocus(parseTime(d.date))).y((d:any) => yFocus(d.conversion));
    const lineContext = d3.line().x((d:any) => xContext(parseTime(d.date))).y((d:any) => yContext(d.conversion));
    
    //데이터 라인에서 포커스 도표가 확대축소될 때 경계를 지나 확장되지 않도록 clip이 생성된다.
    const clip = svg.append("defs").append("svg:clipPath").attr("id", "clip").append("svg:rect").attr("width", chartWidth).attr("height", focusChartHeight).attr("x", 0).attr("y", 0);

    //clip을 추가
    const focusChartLines = svg.append("g").attr("class", "focus").attr("transform", `translate(${focusChartMargin.left}, ${focusChartMargin.top})`).attr("clip-path", "url(#clip)");

    //focus,context 차트 만들기
    const focus: any = svg.append("g").attr("class", "focus").attr("transform", `translate(${focusChartMargin.left}, ${focusChartMargin.top})`)
    const context: any = svg.append("g").attr("class", "context").attr("transform", `translate(${contextChartMargin.left}, ${contextChartMargin.top + 50})`)

    //축에 데이터 넣기
    xFocus.domain(d3.extent(dates));
    yFocus.domain([0, maxYAxisValue]);
    xContext.domain(d3.extent(dates));
    yContext.domain(yFocus.domain());

    //focus차트에 축 넣기
    focus.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${focusChartHeight})`).call(xAxisFocus);
    focus.append("g").attr("class", "y-axis").call(yAxisFocus);

    //data의 key 리스트 가져오기
    const bucketNames = [];
    for (let key of Object.keys(data)){
      bucketNames.push(key);
    }

    //key 별로 색깔 맞추기
    const colors: any = d3.scaleOrdinal().domain(bucketNames).range(["#3498db", "#3cab4b", "#e74c3c", "#73169e", "#2ecc71"]);

    //각 차트에 line 생성하기
    for (let key of Object.keys(data)) {
      let bucket = data[key];
      focusChartLines.append("path").datum(bucket).attr("class", "line").attr("fill", "none").attr("stroke", d => colors(key)).attr("stroke-width", 1.5).attr("d", lineFocus);
      context.append("path").datum(bucket).attr("class", "line").attr("fill", "none").attr("stroke", d => colors(key)).attr("stroke-width", 1.5).attr("d", lineContext);
    }

    //context 차트에 x축 넣기(y축은 필요 없음)
    context.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${contextChartHeight})`).call(xAxisContext);

    //context 차트에 brush 넣기
    const contextBrush = context.append("g").attr("class", "brush").call(brush);
    
    //style brush resize handle
    const brushHandlePath = d => {
      const e = +(d.type === "e");
      const x = e ? 1 : -1;
      const y = contextChartHeight + 10;

      return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x}, ${y + 6}V${2 * y - 6}A6,6 0 0 ${e} ${0.5 * x}, ${2 * y}ZM${2.5 * x},${y + 8}V${2 * y - 8}M${4.5 * x},${y + 8}V${2 * y - 8}`;
    }

    const brushHandle = contextBrush.selectAll(".handle--custom").data([{type: "w"}, {type: "e"}]).enter().append("path").attr("class", "handle--custom").attr("stroke", "#000").attr("cursor", "ew-resize").attr("d", brushHandlePath);

    //focus 차트 상단에 확대/축소 영역 직사각형 중첩하기 overlay
    svg.append("rect").attr("cursor", "move").attr("fill", "none").attr("pointer-events", "all").attr("class", "zoom").attr("width", chartWidth).attr("height", focusChartHeight).attr("transform", `translate(${focusChartMargin.left}, ${focusChartMargin.top})`).call(zoom);

    contextBrush.call(brush.move, [0, chartWidth / 2]);

    //focus 차트 x, y축 라벨
    // focus.append("text").attr("transform", `translate(${chartWidth / 2}, ${focusChartHeight + focusChartMargin.top + 25})`).style("text-anchor", "middle").style("font-size", "18px").text("Time (UTC)");
    // focus.append("text").attr("text-anchor", "middle").attr("transform", `translate(${-focusChartMargin.left + 20}, ${focusChartHeight / 2})rotate(-90)`).style("font-size", "18px").text("Conversion Rate");

    function brushed(event) {
      if (event.sourceEvent?.type === "zoom") return; // ignore brush-by-zoom
      var s = event.selection || xContext.range();
      xFocus.domain(s.map(xContext.invert, xContext));
      focusChartLines.selectAll(".line").attr("d", lineFocus);
      focus.select(".x-axis").call(xAxisFocus);
      svg.select(".zoom").call(zoom.transform, d3.zoomIdentity.scale(chartWidth / (s[1] - s[0])).translate(-s[0], 0));
      brushHandle
        .attr("display", null)
        .attr("transform", (d, i) => "translate(" + [s[i], -contextChartHeight - 20] + ")");
    }

    function zoomed(event) {
      if (event.sourceEvent?.type === "brush") return; // ignore zoom-by-brush
      var t = event.transform;
      xFocus.domain(t.rescaleX(xContext).domain());
      focusChartLines.selectAll(".line").attr("d", lineFocus);
      focus.select(".x-axis").call(xAxisFocus);
      var brushSelection = xFocus.range().map(t.invertX, t);
      // context.select(".brush").call(brush.move, brushSelection);
      brushHandle
        .attr("display", null)
        .attr("transform", (d, i) => "translate(" + [brushSelection[i], -contextChartHeight - 20] + ")");
    }
  }
}


export const data = {
    "plethora-control": [
      {
        date: "00:00",
        consumed: 2229,
        seen: 25136,
        conversion: 8.867759388924252,
      },
      {
        date: "01:00",
        consumed: 2120,
        seen: 36640,
        conversion: 5.786026200873363,
      },
      {
        date: "02:00",
        consumed: 2774,
        seen: 39388,
        conversion: 7.042754138316239,
      },
      {
        date: "03:00",
        consumed: 2301,
        seen: 33609,
        conversion: 6.846380433812371,
      },
      {
        date: "04:00",
        consumed: 1877,
        seen: 25224,
        conversion: 7.441325721535046,
      },
      {
        date: "05:00",
        consumed: 985,
        seen: 16134,
        conversion: 6.105119623156068,
      },
      {
        date: "06:00",
        consumed: 485,
        seen: 7535,
        conversion: 6.436629064366291,
      },
      {
        date: "07:00",
        consumed: 504,
        seen: 4823,
        conversion: 10.449927431059507,
      },
      {
        date: "08:00",
        consumed: 321,
        seen: 2963,
        conversion: 10.833614579817752,
      },
      {
        date: "09:00",
        consumed: 208,
        seen: 2130,
        conversion: 9.765258215962442,
      },
      {
        date: "10:00",
        consumed: 269,
        seen: 5304,
        conversion: 5.071644042232277,
      },
      {
        date: "11:00",
        consumed: 1124,
        seen: 10638,
        conversion: 10.565895845083663,
      },
      {
        date: "12:00",
        consumed: 1130,
        seen: 11897,
        conversion: 9.498192821719762,
      },
      {
        date: "13:00",
        consumed: 862,
        seen: 13455,
        conversion: 6.406540319583797,
      },
      {
        date: "14:00",
        consumed: 800,
        seen: 12024,
        conversion: 6.65335994677312,
      },
      {
        date: "15:00",
        consumed: 750,
        seen: 10679,
        conversion: 7.023129506508099,
      },
      {
        date: "16:00",
        consumed: 608,
        seen: 11426,
        conversion: 5.321197269385611,
      },
      {
        date: "17:00",
        consumed: 964,
        seen: 17691,
        conversion: 5.449098411621729,
      },
      {
        date: "18:00",
        consumed: 984,
        seen: 12307,
        conversion: 7.995449744048103,
      },
      {
        date: "19:00",
        consumed: 1312,
        seen: 14086,
        conversion: 9.314212693454493,
      },
      {
        date: "20:00",
        consumed: 1452,
        seen: 19743,
        conversion: 7.354505394316973,
      },
      {
        date: "21:00",
        consumed: 1009,
        seen: 21686,
        conversion: 4.652771373236189,
      },
      {
        date: "22:00",
        consumed: 1188,
        seen: 18603,
        conversion: 6.386066763425253,
      },
      {
        date: "23:00",
        consumed: 1128,
        seen: 17052,
        conversion: 6.615059817030261,
      },
    ],
    plethora4: [
      {
        date: "00:00",
        consumed: 579,
        seen: 14016,
        conversion: 4.130993150684931,
      },
      {
        date: "01:00",
        consumed: 595,
        seen: 16220,
        conversion: 3.6683107274969173,
      },
      {
        date: "02:00",
        consumed: 814,
        seen: 17481,
        conversion: 4.656484182827069,
      },
      {
        date: "03:00",
        consumed: 840,
        seen: 16276,
        conversion: 5.160973212091423,
      },
      {
        date: "04:00",
        consumed: 524,
        seen: 12164,
        conversion: 4.3077934889838865,
      },
      {
        date: "05:00",
        consumed: 446,
        seen: 11034,
        conversion: 4.04205183976799,
      },
      {
        date: "06:00",
        consumed: 284,
        seen: 6424,
        conversion: 4.420921544209215,
      },
      {
        date: "07:00",
        consumed: 128,
        seen: 2741,
        conversion: 4.669828529733674,
      },
      {
        date: "08:00",
        consumed: 46,
        seen: 977,
        conversion: 4.7082906857727735,
      },
      {
        date: "09:00",
        consumed: 101,
        seen: 1951,
        conversion: 5.176832393644285,
      },
      {
        date: "10:00",
        consumed: 76,
        seen: 1605,
        conversion: 4.7352024922118385,
      },
      {
        date: "11:00",
        consumed: 294,
        seen: 4015,
        conversion: 7.322540473225405,
      },
      {
        date: "12:00",
        consumed: 247,
        seen: 4919,
        conversion: 5.0213458019922745,
      },
      {
        date: "13:00",
        consumed: 308,
        seen: 5402,
        conversion: 5.701592002961866,
      },
      {
        date: "14:00",
        consumed: 293,
        seen: 5641,
        conversion: 5.194114518702357,
      },
      {
        date: "15:00",
        consumed: 441,
        seen: 6540,
        conversion: 6.7431192660550465,
      },
      {
        date: "16:00",
        consumed: 522,
        seen: 6049,
        conversion: 8.629525541411804,
      },
      {
        date: "17:00",
        consumed: 344,
        seen: 6569,
        conversion: 5.236717917491247,
      },
      {
        date: "18:00",
        consumed: 280,
        seen: 5526,
        conversion: 5.066956207021354,
      },
      {
        date: "19:00",
        consumed: 497,
        seen: 7131,
        conversion: 6.969569485345674,
      },
      {
        date: "20:00",
        consumed: 454,
        seen: 7148,
        conversion: 6.351426972579742,
      },
      {
        date: "21:00",
        consumed: 704,
        seen: 8925,
        conversion: 7.8879551820728295,
      },
      {
        date: "22:00",
        consumed: 483,
        seen: 7502,
        conversion: 6.438283124500133,
      },
      {
        date: "23:00",
        consumed: 358,
        seen: 5655,
        conversion: 6.330680813439433,
      },
    ],
    plethora5: [
      {
        date: "00:00",
        consumed: 493,
        seen: 10747,
        conversion: 4.58732669582209,
      },
      {
        date: "01:00",
        consumed: 550,
        seen: 14305,
        conversion: 3.8448095071653268,
      },
      {
        date: "02:00",
        consumed: 697,
        seen: 16177,
        conversion: 4.308586264449527,
      },
      {
        date: "03:00",
        consumed: 797,
        seen: 15661,
        conversion: 5.089074771725944,
      },
      {
        date: "04:00",
        consumed: 465,
        seen: 11742,
        conversion: 3.960143076136944,
      },
      {
        date: "05:00",
        consumed: 590,
        seen: 8987,
        conversion: 6.565038388783799,
      },
      {
        date: "06:00",
        consumed: 193,
        seen: 3856,
        conversion: 5.005186721991701,
      },
      {
        date: "07:00",
        consumed: 158,
        seen: 2453,
        conversion: 6.441092539747248,
      },
      {
        date: "08:00",
        consumed: 28,
        seen: 1535,
        conversion: 1.8241042345276872,
      },
      {
        date: "09:00",
        consumed: 62,
        seen: 1163,
        conversion: 5.331040412725709,
      },
      {
        date: "10:00",
        consumed: 96,
        seen: 1816,
        conversion: 5.286343612334802,
      },
      {
        date: "11:00",
        consumed: 142,
        seen: 2751,
        conversion: 5.161759360232643,
      },
      {
        date: "12:00",
        consumed: 219,
        seen: 4262,
        conversion: 5.138432660722665,
      },
      {
        date: "13:00",
        consumed: 205,
        seen: 6358,
        conversion: 3.224284366152878,
      },
      {
        date: "14:00",
        consumed: 200,
        seen: 5668,
        conversion: 3.5285815102328866,
      },
      {
        date: "15:00",
        consumed: 258,
        seen: 6132,
        conversion: 4.207436399217221,
      },
      {
        date: "16:00",
        consumed: 213,
        seen: 5140,
        conversion: 4.14396887159533,
      },
      {
        date: "17:00",
        consumed: 296,
        seen: 5550,
        conversion: 5.333333333333334,
      },
      {
        date: "18:00",
        consumed: 267,
        seen: 4986,
        conversion: 5.354993983152828,
      },
      {
        date: "19:00",
        consumed: 176,
        seen: 6375,
        conversion: 2.76078431372549,
      },
      {
        date: "20:00",
        consumed: 308,
        seen: 7876,
        conversion: 3.910614525139665,
      },
      {
        date: "21:00",
        consumed: 367,
        seen: 8620,
        conversion: 4.25754060324826,
      },
      {
        date: "22:00",
        consumed: 277,
        seen: 5790,
        conversion: 4.784110535405873,
      },
      {
        date: "23:00",
        consumed: 280,
        seen: 6599,
        conversion: 4.243067131383543,
      },
    ],
    plethora6: [
      {
        date: "00:00",
        consumed: 537,
        seen: 14980,
        conversion: 3.5847797062750333,
      },
      {
        date: "01:00",
        consumed: 598,
        seen: 15810,
        conversion: 3.7824161922833652,
      },
      {
        date: "02:00",
        consumed: 881,
        seen: 20144,
        conversion: 4.37351072279587,
      },
      {
        date: "03:00",
        consumed: 530,
        seen: 16060,
        conversion: 3.300124533001245,
      },
      {
        date: "04:00",
        consumed: 417,
        seen: 12949,
        conversion: 3.2203258938914203,
      },
      {
        date: "05:00",
        consumed: 395,
        seen: 9650,
        conversion: 4.093264248704663,
      },
      {
        date: "06:00",
        consumed: 169,
        seen: 3910,
        conversion: 4.32225063938619,
      },
      {
        date: "07:00",
        consumed: 82,
        seen: 2825,
        conversion: 2.9026548672566372,
      },
      {
        date: "08:00",
        consumed: 95,
        seen: 3842,
        conversion: 2.472670484122853,
      },
      {
        date: "09:00",
        consumed: 40,
        seen: 2454,
        conversion: 1.6299918500407498,
      },
      {
        date: "10:00",
        consumed: 74,
        seen: 2032,
        conversion: 3.6417322834645667,
      },
      {
        date: "11:00",
        consumed: 371,
        seen: 5709,
        conversion: 6.498511122788579,
      },
      {
        date: "12:00",
        consumed: 236,
        seen: 5074,
        conversion: 4.651162790697675,
      },
      {
        date: "13:00",
        consumed: 169,
        seen: 7138,
        conversion: 2.3676099747828525,
      },
      {
        date: "14:00",
        consumed: 192,
        seen: 6159,
        conversion: 3.117389186556259,
      },
      {
        date: "15:00",
        consumed: 366,
        seen: 6122,
        conversion: 5.97843841881738,
      },
      {
        date: "16:00",
        consumed: 252,
        seen: 6625,
        conversion: 3.8037735849056604,
      },
      {
        date: "17:00",
        consumed: 220,
        seen: 7126,
        conversion: 3.0872859949480773,
      },
      {
        date: "18:00",
        consumed: 255,
        seen: 6056,
        conversion: 4.2107001321003965,
      },
      {
        date: "19:00",
        consumed: 446,
        seen: 8181,
        conversion: 5.4516562767387855,
      },
      {
        date: "20:00",
        consumed: 467,
        seen: 7679,
        conversion: 6.081521031384295,
      },
      {
        date: "21:00",
        consumed: 436,
        seen: 7665,
        conversion: 5.688193085453359,
      },
      {
        date: "22:00",
        consumed: 410,
        seen: 7234,
        conversion: 5.667680398119989,
      },
      {
        date: "23:00",
        consumed: 249,
        seen: 8722,
        conversion: 2.8548498050905753,
      },
    ], 
}