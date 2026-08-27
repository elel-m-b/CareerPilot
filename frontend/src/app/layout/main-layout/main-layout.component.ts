import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ResumeUploadModalComponent } from '../../shared/components/resume-upload-modal/resume-upload-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    ToastComponent,
    ResumeUploadModalComponent
  ],
  template: `
    <div class="app-layout-container">
      <!-- Sidebar Navigation -->
      <div class="sidebar-container" [class.mobile-open]="isSidebarOpen">
        <app-sidebar (navClicked)="isSidebarOpen = false"></app-sidebar>
      </div>

      <!-- Backdrop for mobile drawer -->
      <div class="sidebar-backdrop" *ngIf="isSidebarOpen" (click)="isSidebarOpen = false"></div>

      <!-- Main Body View -->
      <div class="main-body">
        <app-header
          (toggleSidebar)="isSidebarOpen = !isSidebarOpen"
          (openUploadModal)="showUploadModal = true"
        ></app-header>

        <main class="content-viewport">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Upload Modal -->
      <app-resume-upload-modal
        *ngIf="showUploadModal"
        (close)="showUploadModal = false"
      ></app-resume-upload-modal>

      <!-- Toast Notifications -->
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-layout-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-primary);
    }
    .sidebar-container {
      height: 100%;
      z-index: 50;
      transition: transform 0.3s ease;
    }
    .main-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .content-viewport {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      background: var(--bg-primary);
    }

    @media (max-width: 768px) {
      .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        transform: translateX(-100%);

        &.mobile-open {
          transform: translateX(0);
        }
      }
      .sidebar-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 40;
      }
      .content-viewport {
        padding: 18px;
      }
    }
  `]
})
export class MainLayoutComponent {
  isSidebarOpen = false;
  showUploadModal = false;
}
