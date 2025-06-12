import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';
import { ServerMessageResponse } from '../interfaces/course.interface'; // וודא שזה קיים או שנה לממשק מתאים אם יש לך אחד אחר

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`; // נניח שיש לך endpoint כזה

  constructor(private http: HttpClient) { }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // פונקציה לעדכון משתמש
  updateUser(id: number, userData: Partial<User>): Observable<User | ServerMessageResponse> {
    // *** השינוי המרכזי כאן: הסרנו את הלוגיקה של מחיקת שדות, כי הקומפוננטה שולטת ב-payload ***
    // ה-userData מגיע כבר עם השדות name, email, role, ו-password (אם מולא).
    const payload: Partial<User> = { ...userData };
    
    // הערה: אם השרת שלך עדיין מגיב בשגיאה על שליחת 'id' ב-body,
    // הוסף שורה זו בחזרה: if (payload.id) delete payload.id;
    // אך לרוב אין צורך בכך כשה-ID ב-URL.

    return this.http.put<User | ServerMessageResponse>(`${this.apiUrl}/${id}`, payload);
  }

  // פונקציה למחיקת משתמש
  deleteUser(id: number): Observable<void | ServerMessageResponse> {
    return this.http.delete<void | ServerMessageResponse>(`${this.apiUrl}/${id}`);
  }

  // פונקציות אחרות בשירות שלך (לדוגמה, register, login)
}