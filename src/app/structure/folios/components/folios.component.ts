import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb, StandardFonts, degrees, PDFPage } from 'pdf-lib';

import JsBarcode from 'jsbarcode';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { FoliosService } from './folios-service.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth.service';
import { WebSocketService } from '../../../services/auth/web-socket.service';
import { Router } from '@angular/router';

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
  birthCertificateWithFrame: Uint8Array | null = null;

  //formulario
  form!: FormGroup;
  //suscription
  actionSubscription!: Subscription;
  stateSubscription!: Subscription;


  constructor( 
    private fb: FormBuilder, 
    private http: HttpClient,
    private foliosService: FoliosService ,
    private router: Router,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    // Load the birth certificate frame
    this.loadFramePdf();
    
    /* it's being loaded AGUASCALIENTES because it's the first option */
    this.loadReversePDF( 'AGUASCALIENTES' );

  }

  ngOnInit(): void {
    this.initializeForm();

  }

  loadReversePDF( path: string ) {
    
    const completedPath = `assets/img/${ path }.pdf`;

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

  
  async addFrame( pdfDoc: Uint8Array): Promise<Uint8Array> {

    /* if (!this.birthCertificateBytes) return;
    if (!this.frameBytes) return; */

    // Load the frame PDF
    const frameDoc = await PDFDocument.load(this.frameBytes!);
    const [framePage] = frameDoc.getPages();

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load( pdfDoc );
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
    // this.birthCertificateWithFrame = await frameDoc.save();
    const pdfDocFrame = await frameDoc.save();

    return pdfDocFrame;

    /* if ( hasFolio ) {
      this.addFolio( true, true ); //has reverse: true
      return;
    }

    this.generateBlob( this.birthCertificateWithFrame, 'ACTA-CON-MARCO' ); */

    
  }

  generateBlob( finalDoc: Uint8Array, fileName: string ) {
    /* Generate a Blob */
    const blob = new Blob([finalDoc], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${ fileName }.pdf`;
    link.click();

  }

  initializeForm(): void {

    this.form = this.fb.group({
      action: ['0', Validators.required],
      state: [''],
      curp: [''],
      fileName: [''],
      pdf: [null, Validators.required]
    })

    this.loadSuscriptions();

  }

  loadSuscriptions() {
    /* Listener | Suscription to actions */
    this.actionSubscription = this.form.get('action')!.valueChanges.subscribe(value => {
      // console.log('Action control value changed:', value);
      // Perform any logic based on the action control value change
    });
    
    this.stateSubscription = this.form.get('state')!.valueChanges.subscribe(value => {
      // console.log('state control value changed:', value);
      // Perform any logic based on the action control value change
      if ( value !== "" ) this.loadReversePDF( value );
    });
  }

  get hasStateAndCurp(): boolean {

   const currentActionValue = this.form.get('action')?.value

    if ( 
      currentActionValue === '2' || 
      currentActionValue === '3' || 
      currentActionValue === '5' ||
      currentActionValue === '6' 
    ) return true;

    return false;

  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {

      const fileName = file.name;

      this.form.patchValue({
        pdf: file,
        fileName: fileName 
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
      Swal.fire({
        title: 'Mensaje!',
        text: 'El archivo pdf no es válido',
        icon: 'warning',
        confirmButtonText: 'OK'
      });

    }
  }

  async generateFile() {

    // const currentActionValue = this.form.get('action')?.value;

    if ( this.form.get('action')?.value === '0' ) {
      Swal.fire({
        title: 'Mensaje!',
        text: 'Seleccione una acción.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    if ( 
      (this.form.get('curp')?.value === '') &&
      (this.form.get('action')?.value === '2' ||
      this.form.get('action')?.value === '3' ||
      this.form.get('action')?.value === '5' ||
      this.form.get('action')?.value === '6') 
      ) {
        Swal.fire({
          title: 'Mensaje!',
          text: 'Revisar el campo CURP.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;

    }

    //TODO: en ocasiones no tendremos algun valor del formaluraio y debemos permitir.
    if ( !this.form.get('pdf')?.valid ){
      Swal.fire({
        title: 'Mensaje!',
        text: 'El formulario no ha sido completado.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
       return;
    }
    
    if ( !this.birthCertificateBytes ) {
      Swal.fire({
        title: 'Mensaje!',
        text: 'El pdf no ha sido cargado.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
       return;
    }

    switch ( this.form.get('action')?.value ) {
      case '1':
        /* Generar Folio */
        const pdfFolio1 = await this.addFolio( this.birthCertificateBytes ); //has reverse: false
        this.generateBlob( 
          pdfFolio1, 
          this.form.get('fileName')?.value 
        ); 
        return;
        
        case '2':
          /* Generar Reverso */
          if (!this.ReversePDFBytes) return;
          const pdfReverse2 = await this.addReverse( this.birthCertificateBytes );
          this.generateBlob( 
            pdfReverse2, 
            this.getFinalFileName()
          ); 
        
        return;
        
        case '3':
          /* Generar Folio y Reverso */
          if (!this.ReversePDFBytes) return;
          const pdfFolio3 = await this.addFolio( this.birthCertificateBytes );
          const pdfReverse3 = await this.addReverse( pdfFolio3 );

          this.generateBlob( 
            pdfReverse3, 
            this.getFinalFileName()
          ); 
          // this.addFolio( true, false ); //has reverse: true
          return;
          
        case '4':
          /* Generar Marco */
          if (!this.frameBytes) return;
          const pdfFrame4 = await this.addFrame( this.birthCertificateBytes );

          this.generateBlob( 
            pdfFrame4, 
            this.form.get('fileName')?.value 
          ); 
          return;
          
        case '5':
          /* Generar Marco con Folio y Reverso */
          if (!this.ReversePDFBytes) return;
          if (!this.frameBytes) return;

          const pdfFrame5 = await this.addFrame( this.birthCertificateBytes );
          const pdfFolio5 = await this.addFolio( pdfFrame5 );
          const pdfReverse5 = await this.addReverse( pdfFolio5 );

          this.generateBlob( 
            pdfReverse5, 
            this.getFinalFileName()
          ); 
          return;
        
        case '6':
          /* Generar Marco con Folio y Reverso */
          if (!this.ReversePDFBytes) return;
          if (!this.frameBytes) return;

          const pdfFrame6 = await this.addFrame( this.birthCertificateBytes );
          const pdfReverse6 = await this.addReverse( pdfFrame6 );

          this.generateBlob( 
            pdfReverse6, 
            this.getFinalFileName()
          ); 
          return;
    
      default:
        console.log('any option');
        //sweet alert.
        return;
    }

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

  async generateQRCode(curp: string): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
  
    // Generate the QR code and draw it on the canvas
    await QRCode.toCanvas(canvas, curp, {
      errorCorrectionLevel: 'H', // High error correction level
      width: 200,                // Width of the QR code
      margin: 1,                 // Margin around the QR code
    });
  
    // Convert canvas to a PNG image and return it as a Uint8Array
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

  async addReverse( pdfDoc: Uint8Array ): Promise<Uint8Array> {
    /* when birth certificate is not loaded */
    // if ( !this.birthCertificateBytes ) return;
    // if (!this.ReversePDFBytes) return;

    // TODO: validate : form must have CURP written

    try {
      // Load the birth certificate PDF
      const birthCertificateDoc = await PDFDocument.load( pdfDoc );
      /* const birthCertificateDoc = await PDFDocument.load(
        birthCertificateModified !== undefined
        ? birthCertificateModified
        : this.birthCertificateBytes
      ); */
      
      // Load the reverse PDF
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes!);
      const [reversePage] = reverseDoc.getPages();
      
      const boldFont = await reverseDoc.embedFont(StandardFonts.TimesRomanBold);
      const Helvetica = await reverseDoc.embedFont(StandardFonts.Helvetica);
      // Draw "gob" in black red
      reversePage.drawText('gob', {
        x: 21,
        y: 95, // Adjust y coordinate as needed
        size: 20,
        font: boldFont,
        color: rgb(0.576, 0.173, 0.286), // Black red color
      });

      // Calculate the width of the "gob" text to position ".mx" correctly
      const gobWidth = boldFont.widthOfTextAtSize('gob', 18);

      // Draw ".mx" in light gray
      reversePage.drawText('.mx', {
        x: 23 + gobWidth, // Adjust x coordinate based on the width of "gob"
        y: 95, // Same y coordinate
        size: 20,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5), // Light gray color
      });
      
      reversePage.drawText('Validación', {
        x: 26, // Adjust x coordinate based on the width of "gob"
        y: 120, // Same y coordinate
        size: 12,
        font: Helvetica,
        color: rgb(0.5, 0.5, 0.5), // Light gray color
      });


      // Draw a white rectangle to cover the content
        reversePage.drawRectangle({
          x: 5,
          y: 690,
          width: 90,
          height: 100,
          color: rgb(1, 1, 1), // White color
        });


      const CURPValue = this.form.get('curp')?.value

      const qrCodeBytes = await this.generateQRCode( CURPValue );

      // Embed the QR code image into the reverse PDF
      const qrCodeImage = await reverseDoc.embedPng(qrCodeBytes);
      const firstPage = reverseDoc.getPage(0); // Get the first page of the reverseDoc

      // Add the QR code to the first page
      const { width, height } = firstPage.getSize();

      /* Top QR */
      firstPage.drawImage(qrCodeImage, {
        x: 20,
        y: 710,
        width: 65,
        height: 65,
      });

      this.writeCURPAroundQR( reversePage )

      /* Bottom QR */
      firstPage.drawImage(qrCodeImage, {
        x: 20,
        y: 20,
        width: 65,
        height: 65,
      });


      // Get the pages from the reverse PDF
      const reversePages = await birthCertificateDoc.copyPages(reverseDoc, reverseDoc.getPageIndices());
  
      // Add the reverse PDF pages to the birth certificate document
      reversePages.forEach((page) => {
        birthCertificateDoc.addPage(page);
      });
  
      // Serialize the combined PDF to bytes
      const combinedPdfBytes = await birthCertificateDoc.save();
      
      return combinedPdfBytes;

      // this.generateBlob( combinedPdfBytes, 'ACTA-CON-REVERSO' )  
      
    } catch (error) {
      return pdfDoc
    }


  }

  async extras() {
    if (!this.ReversePDFBytes) return;
    if ( !this.birthCertificateBytes ) return;

    try {

      // Load the birth certificate PDF
      const birthCertificateDoc = await PDFDocument.load(this.birthCertificateBytes);
      
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes);
        const [reversePage] = reverseDoc.getPages();
  
        
        // Draw a white rectangle to cover the content
        reversePage.drawRectangle({
          x: 27,
          y: 20,
          width: 95,
          height: 100,
          color: rgb(1, 1, 1), // White color
        });
  
        const finaldoc = await reverseDoc.save()
  
        const blob = new Blob([finaldoc], { type: 'application/pdf' });
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

  // async addFolio( hasReverse: boolean, hasFrame: boolean ) {
  async addFolio( pdfDoc : Uint8Array ): Promise<Uint8Array> {

    const randomNumber1 = this.generateRandomNumberString(1);
    const randomNumber7 = this.generateRandomNumberString(7);

    // Generate the barcode for the folio
    const barcodeBytes = await this.generateBarcode(`A0${ randomNumber1 } ${ randomNumber7 }`); 

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load( pdfDoc );
    
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

      return pdfBytes;

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

  writeCURPAroundQR( reversePage: PDFPage ) {

    const text = 'BEHE190618HDFRRLA9';
    const CURPValue = this.form.get('curp')?.value
   // heightAlias 792

    /* Medida para Baja California */
     /*horizontal bottom*/
    reversePage.drawText(CURPValue, {
      x: 24,
      y: 705, // Adjust y coordinate as needed
      size: 5,
      // font: boldFont,
      color: rgb(0, 0, 0),
    });

    /*horizontal top*/
    reversePage.drawText(CURPValue, {
      x: 24,
      y: 776, // Adjust y coordinate as needed
      size: 5,
      // font: boldFont,
      color: rgb(0, 0, 0),
    });

    /*vertical left*/
    reversePage.drawText(CURPValue, {
      x: 15,
      y: 771,
      size: 5,
      color: rgb(0, 0, 0),
      rotate: degrees(270),
    });
    
    /*vertical right*/
    reversePage.drawText(CURPValue, {
      x: 87,
      y: 771,
      size: 5,
      color: rgb(0, 0, 0),
      rotate: degrees(270),
    });

  }

  getFinalFileName(): string {
    return this.form.get('curp')?.value !== '' ? this.form.get('curp')?.value : this.form.get('fileName')?.value 
  }

  redirectPanel() {
    console.log('redirect to panel', this.authService.isUserAdmin());
    
    if ( !this.authService.isUserAdmin() ) {
      Swal.fire({
        title: 'Mensaje!',
        text: 'No cuenta con permisos, consulte con su administrador.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.router.navigate(['/panel'])

  }

  permissionFolio() {
    return this.authService.hasUserFolio();
  }
  
  permissionReverso() {
    return this.authService.hasUserReverso();
  }
  
  permissionReversoFolio() {
    return this.authService.hasUserReversoFolio();
  }
  
  permissionMarco() {
    return this.authService.hasUserMarco();
  }
  
  permissionMarcoFolioReverso() {
    return this.authService.hasUserMarcoFolioReverso();
  }
  
  permissionMarcoReverso() {
    return this.authService.hasUserMarcoReverso();
  }



  logout(): void {
    this.authService.logout();
    this.webSocketService.disconnect();
    // this.router.navigate(['/login'])
    // console.log('Logged out.');
  }

}
