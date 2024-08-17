import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import BwipJs from 'bwip-js';
import JsBarcode from 'jsbarcode';

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
      this.form.get('pdf')?.updateValueAndValidity();

      /* Modify PDF */
      const fileReader = new FileReader();
      fileReader.onload = async ( e: any ) => {
        this.birthCertificateBytes = new Uint8Array(e.target.result);
      }
      fileReader.readAsArrayBuffer(file);

    } else {
      // Handle the error (file is not a PDF)
      alert('Please upload a valid PDF file.');

    }
  }

  async generateFile() {


    if ( !this.form.valid ) return;
    
    switch ( this.form.get('action')?.value ) {
      case '1':
        console.log('option 1')
        this.addBirthCertificateAfolio();
        return;
      
      case '2':
        console.log('option 2')
        
        return;
      
      case '3':
        console.log('option 3')
        return;

      case '4':
        console.log('option 4')
        this.GenerateFrame();
        return;
      
      case '5':
        console.log('option 5')
        return;
    
      default:
        console.log('any option')
        return;
    }

    return;
  }

    async generateBarcode(folio: string): Promise<Uint8Array> {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, folio, {
        format: 'CODE128A',        // Barcode format
        displayValue: false,      // Display human-readable text
        height: 15,          // Barcode height
        width: 5,
      });
  
      // Convert canvas to a PNG image
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.readAsArrayBuffer(blob as Blob);
        });
      });
    }

  async addBirthCertificateAfolio() {
    if ( !this.birthCertificateBytes ) return;

    const randomNumber1 = this.generateRandomNumberString(1);
    const randomNumber7 = this.generateRandomNumberString(7);

    // Generate the barcode for the folio
    const barcodeBytes = await this.generateBarcode(`A0${ randomNumber1 } ${ randomNumber7 }`); 

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load( this.birthCertificateBytes );
    const [birthCertificatePage] = birthCertificateDoc.getPages();

    // Get dimensions of the birthCertificatePage
    const { width, height } = birthCertificatePage.getSize();

    // Embed the barcode image
    const barcodeImage = await birthCertificateDoc.embedPng(barcodeBytes);

    // Load the bold font
  const boldFont = await birthCertificateDoc.embedFont(StandardFonts.HelveticaBold);

    birthCertificatePage.drawImage(barcodeImage, {
      x: 50,         // Position from the left
      y: height - 93, // Position from the bottom (top of page)
      width: 126,    // Adjust width as needed
      height: 25,    // Adjust height as needed
    })

    birthCertificatePage.drawText('FOLIO', {
      x: 78,
      y: height - 57, // Adjust y coordinate as needed
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    birthCertificatePage.drawText(`A0${ randomNumber1 } ${ randomNumber7 }`, {
      x: 70,
      y: height - 71, // Adjust y coordinate for the second line
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Save the PDF and trigger download
    const pdfBytes = await birthCertificateDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'folio.pdf';
    link.click();

  }

  async GenerateFrame() {

    await this.checkIfBothFilesLoaded();

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

  generateRandomNumberString(length: number): string {
    // Calculate the maximum number for the given length
    const maxNumber = Math.pow(10, length) - 1;
  
    // Generate a random number between 0 and the maximum number
    const randomNumber = Math.floor(Math.random() * (maxNumber + 1));
  
    // Convert the number to a string and pad with leading zeros
    const randomNumberString = randomNumber.toString().padStart(length, '0');
  
    return randomNumberString;
  }

}
