// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs'; // ייבוא BehaviorSubject, of
import { tap, filter, map } from 'rxjs/operators'; // ייבוא tap, filter, map
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  userId: number;
  role: string;
}

// ממשק חדש לנתוני משתמש הנשמרים ב-sessionStorage
interface UserData {
  userId: number;
  email: string;
  role: string;
  name?: string; // הוספתי name למקרה שהשרת מחזיר
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  private currentUserRoleSubject: BehaviorSubject<string | null>;
  public currentUserRole$: Observable<string | null>;

  private currentUserIdSubject: BehaviorSubject<number | null>; // NEW: Subject for userId
  public userId$: Observable<number | null>; // NEW: Observable for userId

  constructor(private http: HttpClient) {
    const initialUserData = this.getUserDataFromSessionStorage();
    this.currentUserRoleSubject = new BehaviorSubject<string | null>(initialUserData ? initialUserData.role : null);
    this.currentUserRole$ = this.currentUserRoleSubject.asObservable();

    this.currentUserIdSubject = new BehaviorSubject<number | null>(initialUserData ? initialUserData.userId : null); // Initialize userId
    this.userId$ = this.currentUserIdSubject.asObservable(); // Expose userId as Observable
  }

  // פונקציית עזר לקריאת נתוני משתמש מ-sessionStorage
  private getUserDataFromSessionStorage(): UserData | null {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user) as UserData;
      } catch (error) {
        console.error('Error parsing user data from sessionStorage', error);
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): number | null {
    return this.currentUserIdSubject.value; // Return the current userId
  }

  isLoggedIn(): Observable<boolean> {
    return this.userId$.pipe(map(userId => userId !== null));
  }

  isTeacher(): Observable<boolean> { // Changed to Observable
    return this.currentUserRole$.pipe(map(role => role === 'teacher'));
  }

  isStudent(): Observable<boolean> { // Added for clarity
    return this.currentUserRole$.pipe(map(role => role === 'student'));
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token && response.userId && response.role) {
          localStorage.setItem('token', response.token);
          const userData: UserData = {
            userId: response.userId,
            email: credentials.email, // Or response.email if server returns it
            role: response.role,
            // name: response.name // Add if server returns user name on login
          };
          sessionStorage.setItem('user', JSON.stringify(userData));
          this.currentUserRoleSubject.next(response.role);
          this.currentUserIdSubject.next(response.userId); // Update userId
        }
      })
    );
  }

  register(userData: { name: string; email: string; password: string; role: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response && response.token && response.userId && response.role) {
          localStorage.setItem('token', response.token);
          const userSessionData: UserData = {
            userId: response.userId,
            email: userData.email,
            role: response.role,
            name: userData.name // Assuming name is part of register data
          };
          sessionStorage.setItem('user', JSON.stringify(userSessionData));
          this.currentUserRoleSubject.next(response.role);
          this.currentUserIdSubject.next(response.userId); // Update userId
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserRoleSubject.next(null);
    this.currentUserIdSubject.next(null); // Clear userId on logout
  }
}