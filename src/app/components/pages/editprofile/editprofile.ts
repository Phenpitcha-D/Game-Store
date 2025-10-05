import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editprofile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './editprofile.html',
  styleUrl: './editprofile.scss'
})
export class Editprofile {

   EditForm!: FormGroup;

  // Avatar
  readonly maxAvatarMB = 2;
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  avatarPreview?: string;
  private avatarFile?: File;

  // === Avatar handlers ===
  onAvatarSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.allowedTypes.includes(file.type)) {
      this.EditForm.get('avatar')?.setErrors({ type: true });
      return;
    }
    if (file.size > this.maxAvatarMB * 1024 * 1024) {
      this.EditForm.get('avatar')?.setErrors({ size: true });
      return;
    }

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.avatarPreview = reader.result as string);
    reader.readAsDataURL(file);
    this.EditForm.get('avatar')?.setErrors(null);
  }

  clearAvatar() {
    this.avatarFile = undefined;
    this.avatarPreview = undefined;
    this.EditForm.patchValue({ avatar: null });
    this.EditForm.get('avatar')?.setErrors(null);
  }

  submitEdit(){}
}
