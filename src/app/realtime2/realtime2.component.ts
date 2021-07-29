import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { easeBounce, easeLinear, select } from 'd3';

@Component({
    selector: 'app-realtime2',
    templateUrl: './realtime2.component.html',
    styleUrls: ['./realtime2.component.css']
})
export class Realtime2Component implements OnInit {

    constructor() { }

    ngOnInit(): void {
        let n = 40;
        const random = d3.randomNormal(0, .5);//일반(가우스) 분배기로 랜덤 숫자를 생성하는 함수를 리턴, param1: 기준숫자, param2: 편차
        const data = d3.range(n).map(random);

        const margin = { top: 20, right: 20, bottom: 110, left: 40 };
        const margin2 = { top: 400, right: 20, bottom: 40, left: 20 };

        const width = 860 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        const height2 = 500 - margin2.top - margin2.bottom;

        const x = d3.scaleLinear()
            .domain([0, n - 1])
            .range([0, width]);
            
        const x2: any = d3.scaleLinear().range([0, width]).domain(x.domain());

        x.domain([0, 200].map(x2.invert, x2));

        const y: any = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .range([height, 0]);

        const y2: any = d3.scaleLinear().range([height2, 0]).domain(y.domain());

        const xAxis: any = d3.axisBottom(x);
        const xAxis2: any = d3.axisBottom(x2);
        const yAxis: any = d3.axisLeft(y);

        const line: any = d3.line()
            .x((d, i) => x(i))
            .y(d => y(d))
            .curve(d3.curveBumpX);

        const line2: any = d3.line()
            .x((d, i) => x2(i))
            .y(d => y2(d))
            .curve(d3.curveBumpX);

        const svg = d3.select("#realtime2-chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //focus clip
        svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        const focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", `translate(${margin.left, margin.top})`)

        const context = svg.append("g")
            .attr("class", "context")
            .attr("transform", `translate(${margin2.left}, ${margin2.top})`)

        const zoom: any = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", zoomed);

        // const brush: any = d3.brushX().extent([[0, 0], [width, height2]]).on("brush end", brushed);
        const brushWidth = 200;
        const brush: any = context
            .append("rect")
            .attr("fill", "black")
            .attr("id", "selection")
            .attr("fill-opacity", "0.3")
            .attr("width", brushWidth)
            .attr("height", height2)
            .attr("x", "0");

        const selection = document.getElementById("selection");
        // this.setBrush(selection, width, brushWidth);
        this.getBrush(selection)

        const parentX = selection.getBoundingClientRect().left;

        // brush.on("mousemove", (event) => {
            // var s = [event.target.getBoundingClientRect().left - parentX, event.target.getBoundingClientRect().right - parentX];
            // var s = [selection.getBoundingClientRect().left - parentX, selection.getBoundingClientRect().right - parentX];
            // x.domain(s.map(x2.invert, x2));
            // focus.select(".line").attr("d", line);
            // focus.select(".axis--x").call(xAxis);
        // });

        let observer = new MutationObserver(mutations => {
            if(mutations[0].attributeName === 'x') {
                var s = [selection.getBoundingClientRect().left - parentX, selection.getBoundingClientRect().right - parentX];
                x.domain(s.map(x2.invert, x2));
                focus.select(".line").attr("d", line);
                focus.select(".axis--x").call(xAxis);
            }
        })

        let config = {attributes: true, childList: true, characterData: true};
        observer.observe(selection, config);

        // selection.addEventListener("change", (event) => {
        //     console.log(event);
        //     var s = [selection.getBoundingClientRect().left - parentX, selection.getBoundingClientRect().right - parentX];
        //     x.domain(s.map(x2.invert, x2));
        //     focus.select(".line").attr("d", line);
        //     focus.select(".axis--x").call(xAxis);
        // })

        document.getElementById("play").addEventListener("click", ()=>{
            d3.select("#selection").transition().duration(10000)
            // .ease(easeLinear)
            .attr("x", width-200);
        })

        document.getElementById("stop").addEventListener("click", () => {
            // console.log(selection.getAttribute("x"))
            d3.select("#selection").transition().duration(100).ease(easeLinear).attr("x", selection.getAttribute("x"));
        })

        //focus x축
        focus.append("g")
            .attr("class", "axis--x")
            .attr("transform", "translate(0," + y(0) + ")")
            .call(xAxis);

        // focus y축
        focus.append("g")
            .attr("class", "axis--y")
            .call(d3.axisLeft(y));

        //context x축
        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0, ${height2})`)
            .call(xAxis2);

        //context 그리기
        const contextPath = context
            .append("g")
            .attr("clip-path", "url(#clip)")
            .append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line2)
            .attr("stroke", "blue")
            .attr("fill", "none");

        //focus 그리기
        const focusPath = focus
            .append("g")
            .attr("clip-path", "url(#clip)")
            .append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", "blue")
            .attr("fill", "none");

        //zoom 그리기
        svg.append("rect")
            .attr("class", "zoom")
            .attr("cursor", "move")
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(20, 0)")
            .on("end", zoomed);
        // .call(zoom);

        //context brush 그리기
        // const brushPath = context.append("g")
        //     .attr("class", "brush")
        //     .call(brush)
        //     .call(brush.move, [0, width / 8]);

        // const brushRight = svg.select(".handle--e").attr("x");
        // const brushLeft = svg.select(".handle--w").attr("x");
        // const brushWidth = +brushRight - +brushLeft;

        // svg.select("button").on("click", () => {

        // })  


        // tick();

        // function tick() {
        //     // 뒤에 새로운 데이터를 넣는다
        //     // data.push(random()); //여기에 데이터 추가

        //     // 선을 새로 그리고, 왼쪽으로 넘긴다
        //     focusPath
        //         // focus
        //         .attr("d", line)
        //         .attr("transform", null)
        //         .transition()
        //         .duration(1000)
        //         .ease(easeLinear)
        //         .attr("fill", "none")
        //         .attr("stroke", "blue")
        //         .attr("transform", "translate(" + x(-1) + ",0)")
        //         .on("end", tick);

        //     // contextPath
        //     // d3.select(".selection")
        //     //     .attr("d", line2)
        //     //     // .attr("transform", null)
        //     //     .transition()
        //     //     .duration(1000)
        //     //     .ease(easeLinear)
        //     //     .attr("transform", "translate(" + -x(-1) + ", 0)")
        //         // .on("end", tick);

        //     // 앞의 데이터는 없앤다
        //     data.shift();
        // }



        function brushed(event) {
            if (event.type === "zoom") {
                return; // ignore brush-by-zoom
            }
            console.log(event);
            var s = event.selection || x2.range();

            x.domain(s.map(x2.invert, x2));
            focus.select(".line").attr("d", line);
            focus.select(".axis--x").call(xAxis);
            // svg.select("rect.zoom").call(zoom.transform, d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0));
        }

        function zoomed(event) {
            if (event.type === "brush") return; // ignore zoom-by-brush
            var t = event.transform;
            x.domain(t.rescaleX(x2).domain());
            focus.select(".line").attr("d", line);
            focus.select(".axis--x").call(xAxis);
            // context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
        }
    }
    setBrush(element, maxWidth, firstWidth) {
        //맨 처음 brush의 x좌표
        b = element.getBoundingClientRect()
        var parentX = b.left;
        var minWidth = 60;
        var MARGINS = 4;

        var clicked = null;
        var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

        var b, x, y;

        var redraw = false;

        // Mouse events
        element.addEventListener('mousedown', onMouseDown); //clicked 객체 생성
        document.addEventListener('mousemove', onMove);//clicked 객체 생성
        document.addEventListener('mouseup', () => clicked = null); //clicked 객체 생성 후, clicked.isMoving이 true이면 

        var e;
        animate();

        function onMouseDown(e) {
            onDown(e);
            e.preventDefault();
        }

        //
        function onDown(e) {
            calc(e);

            var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge; //이벤트가 일어난 곳이 엘리먼트의 MARGIN에 들어왔는지 여부

            clicked = {
                x: x, //엘리먼트의 left경계에서 이벤트가 일어난 곳까지의 x길이
                y: y, //엘리먼트의 top 경계에서 이벤트가 일어난 곳까지의 y길이
                cx: e.clientX,//이벤트가 일어난 곳의 x좌표
                cy: e.clientY,//이벤트가 일어난 곳의 y좌표
                w: b.width,//엘리먼트의 너비
                h: b.height,//엘리먼트의 높이
                isResizing: isResizing, //이벤트가 일어난 곳이 엘리먼트의 MARGIN에 들어왔는지 여부
                isMoving: !isResizing && canMove(), //이벤트가 일어난 곳이 엘리먼트의 MARGIN에 안들어왔는지 여부 AND (x>0 && x < b.width && y > 0 && y < b.height && y < 30)
                onTopEdge: onTopEdge,//이벤트가 일어난 곳이 TOP MARGIN에 들어왔는지 여부
                onLeftEdge: onLeftEdge,//이벤트가 일어난 곳이 LEFT MARGIN에 들어왔는지 여부
                onRightEdge: onRightEdge,//이벤트가 일어난 곳이 RIGHT MARGIN에 들어왔는지 여부
                onBottomEdge: onBottomEdge//이벤트가 일어난 곳이 BOTTOM MARGIN에 들어왔는지 여부
            };
        }

        function canMove() {
            return x > 0 && x < b.width && y > 0 && y < b.height;
        }

        function calc(e) {
            b = element.getBoundingClientRect();//bottom: 178, height: 44, left: 212.5, right: 1092.5, top: 134, width: 880, x: 212.5, y: 134 엘리먼트의 위치를 나타낸다.
            x = e.clientX - b.left; //엘리먼트의 left경계에서 이벤트가 일어난 곳까지의 x길이
            y = e.clientY - b.top; //엘리먼트의 top경계에서 이벤트가 일어난 곳까지의 y길이

            onTopEdge = y < MARGINS; //이벤트가 일어난 곳이 TOP MARGIN에 들어왔는지 여부
            onLeftEdge = x < MARGINS; //이벤트가 일어난 곳이 LEFT MARGIN에 들어왔는지 여부
            onRightEdge = x >= b.width - MARGINS; //이벤트가 일어난 곳이 RIGHT MARGIN에 들어왔는지 여부
            onBottomEdge = y >= b.height - MARGINS; //이벤트가 일어난 곳이 BOTTOM MARGIN에 들어왔는지 여부
        }

        function onMove(ee) {
            calc(ee);
            e = ee;
            redraw = true;
        }

        function animate() {

            requestAnimationFrame(animate); //브라우저에게 수행하기를 원하는 애니메이션을 알리고, 다음 리페인트가 진행되기 전에 해당 애니메이션을 업데이트하는 함수를 호출하게 한다.

            if (!redraw) {
                return;
            }

            redraw = false;
            let currentWidth;

            if (clicked?.isResizing) {
                if (clicked.onRightEdge) {
                    if (e.clientX - parentX > maxWidth) {
                        return;
                    } else {
                        element.style.width = Math.max(x, minWidth) + 'px';
                    }
                }

                if (clicked.onLeftEdge) {
                    currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
                    if (currentWidth > minWidth) {
                        const currentX = e.clientX - parentX
                        if (currentX < 0) {
                            return;
                        }
                        element.setAttribute("x", `${currentX}`)
                        element.style.width = currentWidth + 'px';
                    }
                }
                return;
            }

            if (clicked?.isMoving) {
                const elementLeftX = e.clientX - parentX - clicked.x; //element 왼쪽 x축 좌표

                if (elementLeftX < 0 || elementLeftX + b.right - b.left > 800) {
                    return;
                }
                element.setAttribute("x", elementLeftX);
                return;
            }

            // style cursor
            if (onRightEdge || onLeftEdge) {
                element.style.cursor = 'ew-resize';
            } else if (canMove()) {
                element.style.cursor = 'move';
            } else {
                element.style.cursor = 'default';
            }

            return;
        }
    }

    getBrush(elmnt) {
        let b = elmnt.getBoundingClientRect()

        var parentX = b.left;

        elmnt.style.cursor = 'move';

        if (elmnt.style.left) {
            elmnt.style.left = "0px";
        }
        var pos1 = 0, pos3 = 0;

        elmnt.onmousedown = e => {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX; //처음 눌렀을 때의 마우스 x좌표

            elmnt.onmousemove = (event) => {
                event = event || window.event;
                event.preventDefault();

                pos1 = event.clientX - pos3; //이동후 마우스의 x좌표 - 처음 눌렀을 때의 마우스 x좌표

                const elementX = parentX
                const moveX = pos1; //마우스가 움직인 x좌표

                if (elmnt.getAttribute("x") < 0) {
                    elmnt.setAttribute("x", 0);
                    elmnt.onmousemove = null;
                    return;

                } else if (+elmnt.getAttribute("x") - b.left + b.right > 800) {
                    elmnt.setAttribute("x", 800 - (b.right - b.left));
                    elmnt.onmousemove = null;
                    return;
                }

                elmnt.setAttribute("x", (+elmnt.getAttribute("x") + moveX));
                pos3 = event.clientX; //움직였을때의 마지막 x좌표
            }

            elmnt.onmouseup = (event) => {
                event = event || window.event;
                event.preventDefault();

                elmnt.onmouseup = null;
                elmnt.onmousemove = null;
            };
        };
    }
}
