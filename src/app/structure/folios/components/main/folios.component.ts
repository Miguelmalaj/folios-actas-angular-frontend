import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb } from 'pdf-lib';
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

  /* async generateBarcode(folio: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid: 'code39',       // Barcode type
        text: folio,          // Text to encode
        scale: 3,             // 3x scaling factor
        height: 10,           // Bar height, in millimeters
        includetext: true,    // Show human-readable text
        textxalign: 'center', // Always good to set this
      }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          // Convert the canvas to a PNG image and return it as Uint8Array
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              resolve(new Uint8Array(arrayBuffer));
            };
            reader.readAsArrayBuffer(blob as Blob);
          });
        }
      });
    });
  } */
    async generateBarcode(folio: string): Promise<Uint8Array> {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, folio, {
        format: 'CODE39',        // Barcode format
        displayValue: false,      // Display human-readable text
        height: 15,          // Barcode height
        width:1
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
    // Generate the barcode for the folio
    const barcodeBytes = await this.generateBarcode('A01 0028749');

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load( this.birthCertificateBytes );
    const [birthCertificatePage] = birthCertificateDoc.getPages();

    // Get dimensions of the birthCertificatePage
    const { width, height } = birthCertificatePage.getSize();

    // Embed the barcode image
    const barcodeImage = await birthCertificateDoc.embedPng(barcodeBytes);

    birthCertificatePage.drawImage(barcodeImage, {
      x: 50,         // Position from the left
      y: height - 93, // Position from the bottom (top of page)
      width: 126,    // Adjust width as needed
      height: 25,    // Adjust height as needed
    })

    birthCertificatePage.drawText('Folio', {
      x: 50,
      y: height - 50, // Adjust y coordinate as needed
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    birthCertificatePage.drawText('A01 0028749', {
      x: 60,
      y: height - 70, // Adjust y coordinate for the second line
      size: 12,
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

}
