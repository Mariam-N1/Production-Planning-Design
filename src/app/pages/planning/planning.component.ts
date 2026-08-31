import {
  Component, OnInit,
  ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Layout } from '../../layout';

// The only two directions the API understands.
// Writing SortOrder.Asc instead of 'asc' means a typo is caught
// while you type, not when the request comes back wrong.
export enum SortOrder {
  Asc  = 'asc',
  Desc = 'desc',
}

@Component({
  selector: 'app-planning',
  standalone: false,
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningComponent implements OnInit {

  constructor(
    public layout: Layout,
    private cdr: ChangeDetectorRef,
  ) {}

  // ---------- the ONE list of columns ----------
  // field  -> the key in the API data
  // header -> what the user sees
  // holder -> the grey text in that column's search box
  // width  -> how wide the column is
  // visible-> false hides the header AND the cells
  // Add a line here and the table AND the field chooser both grow.
  columns: any[] = [
    { field: 'id',                 header: 'Serial No', holder: 'Search No',       width: '130px', visible: true },
    { field: 'title',              header: 'Title',     holder: 'Search Title',    width: '290px', visible: true },
    { field: 'category',           header: 'Category',  holder: 'Search Category', width: '150px', visible: true },
    { field: 'brand',              header: 'Brand',     holder: 'Search Brand',    width: '160px', visible: true },
    { field: 'price',              header: 'Price',     holder: 'Search Price',    width: '130px', visible: true },
    { field: 'discountPercentage', header: 'Discount',  holder: 'Search Discount', width: '130px', visible: true },
    { field: 'rating',             header: 'Rating',    holder: 'Search Rating',   width: '120px', visible: true },
    { field: 'stock',              header: 'Stock',     holder: 'Search Stock',    width: '150px', visible: true },
  ]

  // only the ticked ones. The table draws from THIS.
  get shownColumns(): any[] {
    return this.columns.filter(c => c.visible)
  }

  // how many cells a row has — used by the "No products found" line
  get colCount(): number {
    return this.shownColumns.length || 1
  }

  // the 3 dots live in the LAST visible column, so they never disappear
  get lastField(): string {
    const shown = this.shownColumns
    return shown.length ? shown[shown.length - 1].field : ''
  }

  // what one cell shows. Only three columns need special wording,
  // everything else prints the raw value.
  cellText(product: any, column: any): string {
    const value = product[column.field]

    if (column.field === 'brand')  return value || '—'
    if (column.field === 'price')  return '$' + Number(value ?? 0).toFixed(2)
    if (column.field === 'discountPercentage') return value + '%'

    return value
  }

  // ---------- remembering the ticks ----------
  // The name the browser files it under. Any word works.
  storeKey: string = 'planning-columns'

  // SAVE. We keep only field -> true/false, never the whole array,
  // so a column added later is simply not in the saved list.
  saveColumns() {
    const saved: any = {}
    for (const c of this.columns) {
      saved[c.field] = c.visible
    }
    localStorage.setItem(this.storeKey, JSON.stringify(saved))
  }

  // LOAD. Runs once in ngOnInit.
  loadColumns() {
    const text = localStorage.getItem(this.storeKey)
    if (!text) return              // nothing saved yet -> keep the defaults

    const saved = JSON.parse(text)

    for (const c of this.columns) {
      // only touch columns the saved list knows about. A NEW column
      // is missing from it, so it keeps the visible: true you wrote.
      if (saved[c.field] !== undefined) {
        c.visible = saved[c.field]
      }
    }
  }

  // a tick changed. Hiding a column also clears its search box,
  // otherwise it would keep filtering while out of sight.
  toggleColumn(column: any) {
    if (!column.visible) {
      this.filters[column.field] = ''
      this.applyFilters()
    }
    this.saveColumns()          // remember it for next time
    this.cdr.detectChanges()
  }

  // every column back on
  selectAll() {
    for (const c of this.columns) c.visible = true
    this.saveColumns()
    this.cdr.detectChanges()
  }

  // forget what was saved and go back to how the array was written
  resetColumns() {
    localStorage.removeItem(this.storeKey)
    for (const c of this.columns) c.visible = true
    this.cdr.detectChanges()
  }


  allProducts: any[] = []
  matched: any[] = []
  products: any[] = []
  total: number = 0
  filters: any = {}
  topText: string = ''
  exactFields = ['id']
  first: number = 0

  get rows(): number {
    return this.selectedValue || this.total || 1
  }

  ngOnInit() {
    this.loadColumns()          // put back the ticks from last time

    // was a sort saved? then load the rows already sorted that way.
    if (this.loadSort()) {
      this.getSorted()
    } else {
      this.getAll()
    }
  }

  getAll() {
    fetch('https://dummyjson.com/products?limit=0')
      .then(res => res.json())
      .then(data => {
        this.allProducts = data.products
        this.matched = [...this.allProducts]
        this.slicePage()
      })
      .catch(err => {
        console.error('Could not load products', err)
        this.allProducts = []
        this.matched = []
        this.slicePage()
      })
  }

  // "return" hands the product back, so whoever called getOne can use it.
  getOne(id: any) {
    return fetch('https://dummyjson.com/products/' + id)
      .then(res => res.json())
      .then(product => {
        console.log(product)
        this.onePlan = product
        this.cdr.detectChanges()
        return product
      })
      .catch(err => console.error('Could not load product ' + id, err))
  }


  // ---------- the sort button (the up/down arrows) ----------
  // which column the API sorts by, and which way round.
  sortField: string = 'title'

  // '' means nothing chosen yet. Otherwise one of the two enum values.
  sortOrder: SortOrder | '' = ''

  // where the browser files the sort choice
  sortKey: string = 'planning-sort'

  // SAVE which field and which direction
  saveSort() {
    const saved = { field: this.sortField, order: this.sortOrder }
    localStorage.setItem(this.sortKey, JSON.stringify(saved))
  }

  // LOAD it back. Returns true if something was saved, so ngOnInit
  // knows whether to fetch sorted rows or plain ones.
  loadSort(): boolean {
    const text = localStorage.getItem(this.sortKey)
    if (!text) return false          // never sorted -> normal load

    const saved = JSON.parse(text)
    this.sortField = saved.field
    this.sortOrder = saved.order   // the text 'asc' / 'desc' from last time
    return true    // yes, a sort was saved
  }

  // the two choices in the little sort list
  sortOptions = [
    { label: 'A - Z', value: SortOrder.Asc  },
    { label: 'Z - A', value: SortOrder.Desc },
  ]

  // the user picked one. The type says it can only ever be
  // SortOrder.Asc or SortOrder.Desc — nothing else compiles.
  chooseSort(order: SortOrder) {
    this.sortOrder = order
    this.saveSort()        // remember it for next time
    this.getSorted()
  }

  // sixth api SORT -> ?sortBy=<field>&order=<asc|desc>
  // The server does the sorting and sends the rows back in that order.
  getSorted() {
    fetch('https://dummyjson.com/products?limit=0'
          + '&sortBy=' + this.sortField
          + '&order=' + this.sortOrder)
      .then(res => res.json())
      .then(data => {
        console.log(data.products)
        this.allProducts = data.products
        this.applyFilters()     // re-filter, page 1, repaint
      })
      .catch(err => console.error('Could not sort', err))
  }


  // ---------- the Advance Filter button ----------
  // true = the row of search boxes is on screen.
  showSearch: boolean = true

  // one click hides them, the next click brings them back.
  // ! means "the opposite of", so true becomes false and back again.
  toggleSearch() {
    this.showSearch = !this.showSearch
    this.cdr.detectChanges()
  }


  // ---------- the 3-dots MENU on every row ----------
  onePlan: any = null    // the product getOne fetched
  menuRow: any = null    // the row whose dots were clicked

  // the two choices. command = what runs when you pick it.
  menuItems: MenuItem[] = [
    { label: 'Edit',   icon: 'pi pi-pencil', command: () => this.openEdit(this.menuRow.id) },
    { label: 'Delete', icon: 'pi pi-trash',  command: () => this.askDelete(this.menuRow) },
  ]

  // remember WHICH row, then let PrimeNG open the little menu.
  // stopPropagation keeps the click here — without it the click also
  // travels up to the <tr> and opens the edit dialog at the same time.
  openMenu(product: any, menu: any, event: any) {
    event.stopPropagation()
    this.menuRow = product
    menu.toggle(event)
  }

  // ---------- the "are you sure?" window ----------
  showConfirm: boolean = false   // true = the little question is open
  toDelete: any = null           // the row waiting to be deleted

  // Delete in the menu only ASKS. Nothing is removed yet.
  askDelete(product: any) {
    this.toDelete = product
    this.showConfirm = true
    this.cdr.detectChanges()
  }

  // they pressed Delete in the question window -> now really do it
  confirmDelete() {
    this.showConfirm = false
    this.deleteRow(this.toDelete)
  }


  // fifth api DELETE a product -> DELETE /products/<id>
  // Like PUT, the id is in the URL. No headers and no body, because
  // "remove this one" is the whole message — there is nothing to send.
  deleteRow(product: any) {
    fetch('https://dummyjson.com/products/' + product.id, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)      // dummyjson sends the product back with isDeleted: true

        // keep every row EXCEPT this one. filter builds a new array
        // without it — the opposite of unshift.
        this.allProducts = this.allProducts.filter(x => x.id !== product.id)
        this.applyFilters()    // recount, repaint
      })
      .catch(err => console.error('Could not delete product ' + product.id, err))
  }


  // ---------- CREATE NEW dialog ----------
  showDialog: boolean = false   // true = the dialog is open
  saving: boolean = false       // true while the POST is on its way
  formError: string = ''        // the red line inside the dialog
  cancelled: boolean = false    // true = ignore the answer that is on its way
  newProduct: any = {}          // what the boxes are bound to
  editId: any = null            // null = adding. a number = editing THAT product.

  // the Create New button. Empties the form, then opens the window.
  openDialog() {
    this.newProduct = {
      title: '', category: '', brand: '',
      price: null, discountPercentage: null, rating: null, stock: null,
    }
    this.editId = null            // nothing to edit -> this is an ADD
    this.formError = ''
    this.cancelled = false
    this.showDialog = true
  }

  // Edit in the row menu. Opens the SAME form, then fills it with
  // what getOne brings back.
  openEdit(id: any) {
    this.newProduct = {
      title: '', category: '', brand: '',
      price: null, discountPercentage: null, rating: null, stock: null,
    }
    this.editId = id            // the id the PUT needs
    this.formError = ''
    this.cancelled = false
    this.showDialog = true      // open straight away

    this.getOne(id).then(product => {
      if (!product) return
      this.newProduct = {
        title: product.title,
        category: product.category,
        brand: product.brand,
        price: product.price,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock,
      }
      this.cdr.detectChanges()
    })
  }

  // Cancel. The request may already be on its way and cannot be called
  // back, so we mark it cancelled and throw the answer away when it lands.
  cancelDialog() {
    this.cancelled = true
    this.saving = false
    this.showDialog = false
  }

  // the biggest id we already have, plus 1.
  // dummyjson gives EVERY new product the id 195, because it never
  // really saves anything — so we number them ourselves instead.
  nextId(): number {
    let max = 0
    for (const p of this.allProducts) {
      if (p.id > max) max = p.id
    }
    return max + 1
  }

  // third api ADD a product   -> POST /products/add
  // fourth api EDIT a product -> PUT  /products/<id>
  // Same body, same headers. Only the method and the URL change —
  // and the URL is why editing needs an id and adding does not.
  saveProduct() {
    const title = String(this.newProduct.title ?? '').trim()
    if (!title) {
      this.formError = 'Title is required.'
      return
    }

    this.saving = true
    this.formError = ''
    this.cancelled = false

    const editing = this.editId !== null

    const url = editing
      ? 'https://dummyjson.com/products/' + this.editId   // one product
      : 'https://dummyjson.com/products/add'              // a new one

    fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.newProduct),
    })
      .then(res => res.json())
      .then(product => {
        console.log(product)

        if (this.cancelled) return          // you pressed Cancel -> drop it

        if (editing) {
          // find the row with that id and write the new values over it
          const i = this.allProducts.findIndex(x => x.id === this.editId)
          if (i > -1) {
            this.allProducts[i] = { ...this.allProducts[i], ...this.newProduct }
          }
        } else {
          product.id = this.nextId()          // our own serial no, never a repeat
          this.allProducts.unshift(product)   // put it at the TOP of the list
        }
        this.saving = false
        this.showDialog = false
        this.applyFilters()                 // page 1, repaint, so you see it
      })
      .catch(err => {
        console.error('Could not add the product', err)
        if (this.cancelled) return
        this.formError = 'Could not save. Please try again.'
        this.saving = false
        this.cdr.detectChanges()
      })
  }

  onSearch(text: any) {
    this.topText = text.trim().toLowerCase()
    this.applyFilters()
  }

  search(text: any, field: any) {
    this.filters[field] = text.trim().toLowerCase()
    this.applyFilters()
  }

  applyFilters() {
    this.matched = this.allProducts.filter(product => {
      if (this.topText) {
        const title = String(product.title ?? '').toLowerCase()
        if (!title.includes(this.topText)) return false
      }
      for (const field in this.filters) {
        const text = this.filters[field]
        if (!text) continue
        const value = String(product[field] ?? '').toLowerCase()
        const ok = this.exactFields.includes(field)
          ? value === text
          : value.includes(text)
        if (!ok) return false
      }
      return true
    })
    this.first = 0
    this.slicePage()
  }

  slicePage() {
    this.total = this.matched.length
    this.products = this.matched.slice(this.first, this.first + this.rows)
    this.cdr.detectChanges()
  }

  onPageChange(event: any) {
    this.first = event.first ?? 0
    this.slicePage()
  }

  dropdownOptions = [
    { label: '10',  value: 10 },
    { label: '20',  value: 20 },
    { label: '30',  value: 30 },
    { label: '50',  value: 50 },
    { label: 'All', value: 0  },
  ]

  selectedValue: number = 10

  changeSize(size: any) {
    this.selectedValue = size
    this.first = 0
    this.slicePage()
  }

  get rangeText(): string {
    if (!this.total) return '0 items'
    return (this.first + 1) + '-' + (this.first + this.products.length)
         + ' of ' + this.total + ' items'
  }
}