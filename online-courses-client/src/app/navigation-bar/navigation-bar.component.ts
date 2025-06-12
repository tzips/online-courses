import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component'; // ייבוא קומפוננטת התחברות
import { RegisterComponent } from '../register/register.component'; // ייבוא קומפוננטת הרשמה
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; // ייבוא Router ו-RouterLink

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [CommonModule,  RouterLink],
  templateUrl: './navigation-bar.component.html',
  styleUrl: './navigation-bar.component.css'
})
export class NavigationBarComponent implements OnInit, OnDestroy {
  isTeacherLoggedIn: boolean = false;
  isLoggedIn: boolean = false; // מצב התחברות כללי
  isMenuOpen: boolean = false; // מצב תפריט המבורגר (לרספונסיביות)
  private authSubscription: Subscription | undefined;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUserRole$.subscribe(role => {
      this.isTeacherLoggedIn = (role === 'teacher');
      this.isLoggedIn = (role !== null);
      console.log('Navigation Bar: User role updated to:', role, 'isTeacherLoggedIn:', this.isTeacherLoggedIn, 'isLoggedIn:', this.isLoggedIn);
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // פונקציה לשינוי מצב תפריט המבורגר
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openLoginDialog(): void {
    this.dialog.open(LoginComponent, {
      width: '400px',
      disableClose: true
    });
    this.isMenuOpen = false; // סגור תפריט המבורגר לאחר פתיחת דיאלוג
  }

  openRegisterDialog(): void {
    this.dialog.open(RegisterComponent, {
      width: '400px',
      disableClose: true
    });
    this.isMenuOpen = false; // סגור תפריט המבורגר לאחר פתיחת דיאלוג
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.isMenuOpen = false; // סגור תפריט המבורגר לאחר התנתקות
  }
}
