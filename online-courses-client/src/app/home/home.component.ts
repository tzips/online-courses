// src/app/home/home.component.ts
import {  Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component'; // ודאי שהנתיב הזה נכון לפרויקט שלך
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements  OnInit {
  isLoggedIn$: Observable<boolean>;
  currentUserRole$: Observable<string | null>;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    public authService: AuthService
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
    this.currentUserRole$ = this.authService.currentUserRole$;
  }

  ngOnInit(): void {
    // לוגיקה נוספת לאתחול הקומפוננטה
  }



  openLoginDialog(): void {
    this.dialog.open(LoginComponent, { width: '400px' });
  }

  openRegisterDialog(): void {
    this.dialog.open(RegisterComponent, { width: '400px' });
  }
}