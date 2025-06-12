import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // ייבוא Router לניווט

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<LoginComponent>,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router // הזרקת Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // תיקון כאן: עוטפים את כל הוולידטורים במערך
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    console.log('on submit', this.loginForm.value, this.loginForm);

    // ודא שהטופס תקין לפני שליחה
    if (this.loginForm.invalid) {
      console.warn('הטופס אינו תקין, לא ניתן לשלוח.');
      // ניתן להציג הודעה למשתמש כאן
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('התחברות מוצלחת!', response);
        if (response && response['token'] && response['userId'] && response['role']) {
          localStorage.setItem('token', response['token']);
          const userData = {
            userId: response.userId,
            email: this.loginForm.value.email, // או קבל מהתגובה אם השרת מחזיר
            role: response.role
            // הוסף כאן מאפיינים נוספים אם יש
          };
          sessionStorage.setItem('user', JSON.stringify(userData));
          this.dialogRef.close();
          this.router.navigate(['/home']); // דוגמה לניווט לאחר התחברות
        } else {
          console.error('תגובה לא מלאה מהשרת לאחר התחברות:', response);
          this.snackBar.open('התחברות בוצעה, אך נתונים חסרים', 'סגור', { duration: 5000 });
          this.dialogRef.close();
        }
      },
      error: (error) => {
        console.error('שגיאה בהתחברות:', error);
        let errorMessage = 'ההתחברות נכשלה. אנא בדוק את האימייל והסיסמה.';
        if (error && error.error && error.error.message) {
          errorMessage = error.error.message; // נסה לקבל הודעת שגיאה מהשרת
        }
        this.snackBar.open(errorMessage, 'סגור', { duration: 3000 });
      }
    });
  }
}
