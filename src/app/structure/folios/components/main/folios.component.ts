import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb } from 'pdf-lib';

@Component({
  selector: 'app-folios',
  templateUrl: './folios.component.html',
  styleUrl: './folios.component.css'
})
export class FoliosComponent implements OnInit{
  //Uint8Array
  birthCertificateBytes: Uint8Array | null = null;
  frameBytes: Uint8Array | null = null;
  modifiedPdfBytes: Uint8Array | null = null;

  //formulario
  form!: FormGroup;


  constructor( private fb: FormBuilder, private http: HttpClient ) {
    // Load the birth certificate frame
    this.loadFramePdf();
  }

  ngOnInit(): void {
    this.initializeForm();

  }

  loadFramePdf() {
    this.http.get('assets/img/frame.pdf', { responseType: 'arraybuffer' }).subscribe(
      (data) => {
        this.frameBytes = new Uint8Array(data);

        console.log('this.frameBytes', this.frameBytes)
        // this.checkIfBothFilesLoaded();
      },
      (error) => {
        console.error('Could not load frame PDF from assets:', error);
      }
    );
  }

  async checkIfBothFilesLoaded() {
    if (this.birthCertificateBytes && this.frameBytes) {
      await this.addBirthCertificateToFrame(this.birthCertificateBytes, this.frameBytes);
    }
  }

  async addBirthCertificateToFrame(birthCertificateBytes: Uint8Array, frameBytes: Uint8Array) {
    // Load the frame PDF
    const frameDoc = await PDFDocument.load(frameBytes);
    const [framePage] = frameDoc.getPages();

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load(birthCertificateBytes);
    const [birthCertificatePage] = birthCertificateDoc.getPages();
    
    // Embed the birth certificate page in the frame document
    const embeddedPage = await frameDoc.embedPage(birthCertificatePage);

    // Get dimensions of the frame
    const { width, height } = framePage.getSize();

    // Draw the birth certificate on top of the frame
    framePage.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    // Save the modified PDF
    this.modifiedPdfBytes = await frameDoc.save();

    console.log('this.modifiedPdfBytes', this.modifiedPdfBytes)
  }

  initializeForm(): void {

    this.form = this.fb.group({
      action: ['4', Validators.required],
      state: ['1', Validators.required],
      curp: ['', Validators.required],
      pdf: [null, Validators.required]
    })

  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {

      this.form.patchValue({
        pdf: file
      });
      this.form.get('pdfFile')?.updateValueAndValidity();

      /* Modify PDF */
      /* TODO: que oopcion es?? */
      const fileReader = new FileReader();
      fileReader.onload = async ( e: any ) => {
        /* const pdfBytes = new Uint8Array(e.target.result);
        this.modifiedPdfBytes = await this.addFrameToPDF(pdfBytes); */
        this.birthCertificateBytes = new Uint8Array(e.target.result);
      }
      fileReader.readAsArrayBuffer(file);

    } else {
      console.log('first')
      // Handle the error (file is not a PDF)
      alert('Please upload a valid PDF file.');

    }
  }

 /*  async addFrameToPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Add a rectangle/frame around the entire page
      const borderWidth = 10; // Customize the thickness of the border
      page.drawRectangle({
        x: borderWidth / 2,
        y: borderWidth / 2,
        width: width - borderWidth,
        height: height - borderWidth,
        borderColor: rgb(0, 0, 0), // Black frame color
        borderWidth: borderWidth,
      });
    }

    // Save the modified PDF
    return await pdfDoc.save();
  } */

  async generateFile() {


    if ( !this.form.valid ) return;  

    await this.checkIfBothFilesLoaded();

    console.log('when we generate this is the file:', this.modifiedPdfBytes)

    if ( this.modifiedPdfBytes ) {

      /* Generate a Blob */
      const blob = new Blob([this.modifiedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'modified-birth-certificate.pdf';
      link.click();

    } else {
      console.log('segundo')
      alert('Please upload a PDF file.');
    }
  }

}
