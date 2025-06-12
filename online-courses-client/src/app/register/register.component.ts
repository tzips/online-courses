import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service'; // Adjust path as needed
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // ייבוא Router לניווט

@Component({
  selector: 'app-register', // Make sure the selector is 'app-register'
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,

  ],
  templateUrl: './register.component.html', // Link to the register.component.html file
  styleUrl: './register.component.css' // Link to the register.component.css file
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<RegisterComponent>,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router // הזרקת Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    console.log('onSubmit() called');
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.snackBar.open('הרשמה בוצעה בהצלחה!', 'סגור', { duration: 3000 });
          if (response && response['token'] && response['userId'] && response['role']) {
            const userData = {
              userId: response.userId,
              email: this.registerForm.value.email, // או קבל מהתגובה אם השרת מחזיר
              role: response.role
              // הוסף כאן מאפיינים נוספים אם יש
            };
            sessionStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', response.token);
            this.dialogRef.close(); // סגור את הדיאלוג
            this.router.navigate(['/home']); // ניווט לדף הבית לאחר הרשמה מוצלחת
          } else {
            console.error('תגובה לא מלאה מהשרת לאחר הרשמה:', response);
            this.snackBar.open('הרשמה בוצעה, אך נתונים חסרים', 'סגור', { duration: 5000 });
            this.dialogRef.close();
          }
        },
        error: (error) => {
          this.snackBar.open('ההרשמה נכשלה', 'סגור', { duration: 3000 });
          console.error('Registration failed', error);
        }
      });
    }
  }
}
