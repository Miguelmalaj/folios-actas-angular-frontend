import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import BwipJs from 'bwip-js';
import JsBarcode from 'jsbarcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-folios',
  templateUrl: './folios.component.html',
  styleUrl: './folios.component.css'
})
export class FoliosComponent implements OnInit, OnDestroy {
  //Uint8Array
  birthCertificateBytes: Uint8Array | null = null;
  frameBytes: Uint8Array | null = null;
  ReversePDFBytes: Uint8Array | null = null;
  modifiedPdfBytes: Uint8Array | null = null;

  //formulario
  form!: FormGroup;
  //suscription
  actionSubscription!: Subscription;
  stateSubscription!: Subscription;


  constructor( private fb: FormBuilder, private http: HttpClient ) {
    // Load the birth certificate frame
    this.loadFramePdf();
    
    /* it's being loaded sinaloa because it's the first option */
    this.loadReversePDF( 'SINALOA' );
  }

  ngOnInit(): void {
    this.initializeForm();

  }

  loadReversePDF( path: string ) {

    
    const completedPath = `assets/img/${ path }.pdf`;

    console.log('loadReversePDF completedPath', completedPath)

    this.http.get(completedPath, { responseType: 'arraybuffer' }).subscribe(
      (data) => {
        this.ReversePDFBytes = new Uint8Array(data);
        // this.checkIfBothFilesLoaded();
      },
      (error) => {
        console.error('Could not load frame PDF from assets:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
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
      state: ['', Validators.required],
      curp: ['', Validators.required],
      pdf: [null, Validators.required]
    })

    this.loadSuscriptions();

  }

  loadSuscriptions() {
    /* Listener | Suscription to actions */
    this.actionSubscription = this.form.get('action')!.valueChanges.subscribe(value => {
      console.log('Action control value changed:', value);
      // Perform any logic based on the action control value change
    });
    
    this.stateSubscription = this.form.get('state')!.valueChanges.subscribe(value => {
      console.log('state control value changed:', value);
      // Perform any logic based on the action control value change
      if ( value !== "" ) this.loadReversePDF( value );
    });
  }

  get hasState(): boolean {

   const currentActionValue = this.form.get('action')?.value

    if ( 
      currentActionValue === '2' || 
      currentActionValue === '3' || 
      currentActionValue === '3' 
    ) return true;

    return false;

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
        this.addReverse();
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

  async addReverse() {
    /* when birth certificate is not loaded */
    if ( !this.birthCertificateBytes ) return;
    if (!this.ReversePDFBytes) return;

    try {
      // Load the birth certificate PDF
      const birthCertificateDoc = await PDFDocument.load(this.birthCertificateBytes);
      
      // Load the reverse PDF
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes);
  
      // Get the pages from the reverse PDF
      const reversePages = await birthCertificateDoc.copyPages(reverseDoc, reverseDoc.getPageIndices());
  
      // Add the reverse PDF pages to the birth certificate document
      reversePages.forEach((page) => {
        birthCertificateDoc.addPage(page);
      });
  
      // Serialize the combined PDF to bytes
      const combinedPdfBytes = await birthCertificateDoc.save();
  
      // Create a Blob from the combined PDF bytes
      const blob = new Blob([combinedPdfBytes], { type: 'application/pdf' });
  
      // Create a link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Acta_con_Reverso.pdf';
  
      // Append the link to the body (required for Firefox)
      document.body.appendChild(link);
  
      // Trigger the download by programmatically clicking the link
      link.click();
  
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error adding reverse PDF:', error);
    }


  }

  async addBirthCertificateAfolio() {
    /* when birth certificate is not loaded */
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
