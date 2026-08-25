import { Component } from '@angular/core';
import { Layout } from './layout';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // public, so app.html can read layout.menuOpen directly
  constructor(public layout: Layout) {}
}