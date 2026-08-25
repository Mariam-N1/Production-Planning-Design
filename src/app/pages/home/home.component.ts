import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <div class="screen">
      <div class="heading">
        <p class="small-title">Setting | Home</p>
        <h1 class="big-title">Home</h1>
      </div>
      <div class="box box-empty">Home page</div>
    </div>
  `,
})
export class HomeComponent {}