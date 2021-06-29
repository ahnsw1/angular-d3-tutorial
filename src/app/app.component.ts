import { Component } from '@angular/core';
import { LINE_DATA } from 'src/data/line-chart';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'd3-tutorial';
  public data!: {value: number, date: string}[];

  constructor (){
    this.data = LINE_DATA;
  }

  ngOnInit(){
    
  }
}
