import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Layout {

  menuOpen = false;

  toggleMenu() { this.menuOpen = !this.menuOpen; }

  closeMenu() { this.menuOpen = false; }
}