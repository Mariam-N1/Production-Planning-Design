import { Component } from '@angular/core';

@Component({
  selector: 'settings-home',
  standalone: false,
  template: `
    <div class="screen">
      <div class="heading">
        <p class="small-title">Setting | Home</p>
        <h1 class="big-title">Settings</h1>
      </div>
      <div class="box box-empty">Settings page</div>
    </div>
  `,
})
export class SettingsComponent {}