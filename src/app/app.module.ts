import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BarComponent } from './bar/bar.component';
import { PieComponent } from './pie/pie.component';
import { ScatterComponent } from './scatter/scatter.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { FormsModule } from '@angular/forms';
import { Char1Component } from './char1/char1.component';
import { RealtimeComponent } from './realtime/realtime.component';
import { StreamComponent } from './stream/stream.component';
import { BrushComponent } from './brush/brush.component';
import { Brush2Component } from './brush2/brush2.component';
import { Realtime2Component } from './realtime2/realtime2.component';

@NgModule({
  declarations: [
    AppComponent,
    BarComponent,
    PieComponent,
    ScatterComponent,
    LineChartComponent,
    Char1Component,
    RealtimeComponent,
    StreamComponent,
    BrushComponent,
    Brush2Component,
    Realtime2Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
