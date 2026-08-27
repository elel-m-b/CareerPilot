import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ResumeListComponent } from './features/resumes/resume-list/resume-list.component';
import { ResumeDetailComponent } from './features/resumes/resume-detail/resume-detail.component';
import { AnalysisListComponent } from './features/analysis/analysis-list/analysis-list.component';
import { AnalysisDetailComponent } from './features/analysis/analysis-detail/analysis-detail.component';
import { RecommendationsComponent } from './features/recommendations/recommendations.component';
import { ProfileComponent } from './features/profile/profile.component';
import { SettingsComponent } from './features/settings/settings.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'my-resumes', component: ResumeListComponent },
      { path: 'my-resumes/:id', component: ResumeDetailComponent },
      { path: 'analysis', component: AnalysisListComponent },
      { path: 'analysis/:id', component: AnalysisDetailComponent },
      { path: 'recommendations', component: RecommendationsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
