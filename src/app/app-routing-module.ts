import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { PlanningComponent } from './pages/planning/planning.component';
import { ApprovalsComponent } from './pages/approvals/approvals.component';
import { SettingsComponent } from './pages/settings/settings.component';

// these 4 match the 4 sidebar buttons in app.component.html
const routes: Routes = [
  { path: '', redirectTo: 'planning', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'planning', component: PlanningComponent },
  { path: 'approvals', component: ApprovalsComponent },
  { path: 'settings', component: SettingsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}