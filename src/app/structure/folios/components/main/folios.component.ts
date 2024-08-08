import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-folios',
  templateUrl: './folios.component.html',
  styleUrl: './folios.component.css'
})
export class FoliosComponent implements OnInit{

  //formulario
  form!: FormGroup;

  constructor( private fb: FormBuilder ) {

  }

  ngOnInit(): void {
    this.initializeForm();

  }

  initializeForm(): void {

    this.form = this.fb.group({
      action: ['', Validators.required],
      state: ['', Validators.required],
      curp: ['', Validators.required],
      pdf: [null, Validators.required]
    })

  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.form.patchValue({
        pdfFile: file
      });
      this.form.get('pdfFile')?.updateValueAndValidity();
    } else {
      // Handle the error (file is not a PDF)
      alert('Please upload a valid PDF file.');
    }
  }

  saveFile() {
    if (this.form.valid) {
      const file: File = this.form.get('pdfFile')?.value;
      // You can use FormData to send the file to a server or handle it as needed
      const formData = new FormData();
      formData.append('pdfFile', file, file.name);
      // Example: Send formData to your API or handle it as needed
      console.log('File saved:', file);
    } else {
      alert('Please upload a PDF file.');
    }
  }

}
