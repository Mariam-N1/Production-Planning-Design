import {
  Component, OnInit,
  ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { PaginatorState } from 'primeng/paginator';
import { Layout } from '../../layout';   


@Component({
  selector: 'app-planning',
  standalone: false,
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningComponent implements OnInit {

  // cdr -> repaints the screen after a fetch finishes. With OnPush and
  // no zone, nothing appears without it.
  constructor(
    public layout:Layout, private cdr: ChangeDetectorRef) {}

  products: any[] = []      // the rows the table shows
  total: number = 0         // how many the API says there are -> "194 Records"
  query: string = ''        // what is typed in the top search box

  // ---------- your dropdown: how many rows per page ----------

  dropdownOptions = [
    { label: '10',  value: 10 },
    { label: '20',  value: 20 },
    { label: '30',  value: 30 },
    { label: '50',  value: 50 },
    { label: 'All', value: 0  },
  ];

  selectedValue: number = 10;

  // ---------- the paginator: which page ----------
  first: number = 0     // how many rows to skip -> ?skip=

  // what both the paginator and the URL use as the page size.
  // On All, selectedValue is 0, so fall back to the whole total.
  get rows(): number {
    return this.selectedValue || this.total || 1
  }

  // the "1-10 of 194 items" line on the left
  get rangeText(): string {
    if (!this.total) return '0 items'
    const from = this.first + 1                              // first row on screen
    const to = Math.min(this.first + this.rows, this.total)  // last one, never past the end
    return from + '-' + to + ' of ' + this.total + ' items'
  }

  ngOnInit() {
    this.getAll()
  }

  getAll() {

    // the normal list
    let url = 'https://dummyjson.com/products?limit=' + this.rows + '&skip=' + this.first

    // if the search box has text, use the search address instead
    if (this.query) {
      url = 'https://dummyjson.com/products/search?q=' + this.query + '&limit=' + this.rows + '&skip=' + this.first
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        this.products = data.products
        this.total = data.total
        this.cdr.detectChanges()
      })
      .catch(err => {
        // no internet, or the API is down
        console.error(err)
      });
  }

  // the paginator's arrows and page numbers.
  // Only `first` is taken — `rows` comes from our own dropdown.
  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0
    this.getAll()
  }

  // your items-per-page dropdown
  changeSize(size: any) {
    this.selectedValue = size
    this.first = 0          // a new page size starts back at page 1
    this.getAll()
  }

  // the top search box. Asks the API again with ?q=
  onSearch(text: any) {
    this.query = text.trim()
    this.first = 0          // a new search starts at page 1
    this.getAll()
  }

  // the boxes under each column header — not wired up yet
  search(text: any, field: any) {
    console.log(text, field)
  }
}