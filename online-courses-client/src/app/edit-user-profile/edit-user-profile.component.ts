// src/app/edit-user-profile/edit-user-profile.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { User } from '../interfaces/user.interface'; 

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-user-profile.component.html',
  styleUrls: ['./edit-user-profile.component.css']
})
export class EditUserDialogComponent implements OnInit {
  userForm: FormGroup;
  currentUser: User; 

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {
    this.currentUser = data.user; 

    this.userForm = this.fb.group({
      name: [this.currentUser.name, Validators.required],
      email: [this.currentUser.email, [Validators.required, Validators.email]],
      password: ['', Validators.required], // סיסמה היא שדה חובה בטופס
      role: [{ value: this.currentUser.role, disabled: true }] 
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue(); 
      
      // *** התיקון הקריטי כאן: יצירת אובייקט עם כל השדות שהשרת מצפה להם ***
      // אנחנו משתמשים ב-`as any` באופן מקומי לצורך שליחה לשרת
      // ומוודאים ש-`role` נשלח מה-`currentUser`
      const updatedUser: Partial<User> & { password?: string } = {
        name: formValue.name,
        email: formValue.email,
        role: this.currentUser.role, 
        password: formValue.password // הסיסמה היא שדה חובה בטופס ולכן תמיד תהיה קיימת כאן
      };
      
      this.dialogRef.close(updatedUser);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false); 
  }
}