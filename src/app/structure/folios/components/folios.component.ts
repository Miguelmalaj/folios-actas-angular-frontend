import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PDFDocument, rgb, StandardFonts, degrees, PDFPage } from 'pdf-lib';

import JsBarcode from 'jsbarcode';
//this way works well but with issue: 
/* import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs'; */

import * as pdfjsLib from 'pdfjs-dist';

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
  ReverseSealBytes: Uint8Array | null = null;

  //formulario
  form!: FormGroup;
  //suscription
  actionSubscription!: Subscription;
  stateSubscription!: Subscription;


  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private foliosService: FoliosService,
    private router: Router,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    // Set the worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.min.mjs';
    // Load the birth certificate frame
    this.loadFramePdf();

    /* it's being loaded AGUASCALIENTES because it's the first option */
    this.loadReversePDF('AGUASCALIENTES');

  }

  ngOnInit(): void {
    this.initializeForm();

  }

  loadReversePDF(path: string) {

    const completedPath = `assets/img/${path}.pdf`;
    const imgPath = `assets/img/${path}.jpeg`;

    this.http.get(completedPath, { responseType: 'arraybuffer' }).subscribe(
      (pdfData) => {
        /* this.ReversePDFBytes = new Uint8Array(pdfData);
        // this.checkIfBothFilesLoaded();
        if (this.form.value?.action !== '0') this.generateFile(); */
        // Then load seal image
        this.http.get(imgPath, { responseType: 'arraybuffer' }).subscribe(
          (imgData) => {
            this.ReverseSealBytes = new Uint8Array(imgData);
            console.log(`✅ Loaded seal image for ${path}`);
            if (this.form.value?.action !== '0') this.generateFile();
          },
          (error) => console.error(`⚠️ Could not load JPEG seal for ${path}:`, error)
        );
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


  async addFrame(pdfDoc: Uint8Array): Promise<Uint8Array> {

    /* if (!this.birthCertificateBytes) return;
    if (!this.frameBytes) return; */

    // Load the frame PDF
    const frameDoc = await PDFDocument.load(this.frameBytes!);
    const [framePage] = frameDoc.getPages();

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load(pdfDoc);
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

  }

  generateBlob(finalDoc: Uint8Array, fileName: string) {
    /* Generate a Blob */
    const blob = new Blob([finalDoc], { type: 'application/pdf' });

    /* Nota: Utilizar este código para firebase */
    /* This function generate the pdf file and downloads it */
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.pdf`;
    link.click();


    /* NOTA: Utilizar este codigo para netlify */
    /* This fragment code opens the pdf in a new tab */
    // Create a URL for the Blob
    /* const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Create a hidden download link for user convenience
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Revoke the URL after opening the new tab and clicking the download link
    URL.revokeObjectURL(url); */

  }

  initializeForm(): void {

    this.form = this.fb.group({
      action: ['0', Validators.required],
      state: [''],
      curp: [''],
      verificationCode: [''],
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

      if (value !== "") this.loadReversePDF(value);
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
      fileReader.onload = async (e: any) => {
        this.birthCertificateBytes = new Uint8Array(e.target.result);
        // await this.extractTextFromPDF(e.target.result);
      }
      fileReader.readAsArrayBuffer(file);

      const fileReader2 = new FileReader();
      fileReader2.onload = async (e: any) => {
        // this.birthCertificateBytes = new Uint8Array(e.target.result);

        await this.extractTextFromPDF(e.target.result);
      }
      fileReader2.readAsArrayBuffer(file);

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

    if (this.form.get('action')?.value === '0') {
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
    if (!this.form.get('pdf')?.valid) {
      Swal.fire({
        title: 'Mensaje!',
        text: 'El formulario no ha sido completado.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!this.birthCertificateBytes) {
      Swal.fire({
        title: 'Mensaje!',
        text: 'El pdf no ha sido cargado.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    switch (this.form.get('action')?.value) {
      case '1':
        /* Generar Folio */
        const pdfFolio1 = await this.addFolio(this.birthCertificateBytes); //has reverse: false
        // const pdfSeal = await this.addSealToReverse(pdfFolio1);
        // const pdfFolio1 = await this.cropAndPasteReversePart(this.birthCertificateBytes); //has reverse: false
        this.generateBlob(
          pdfFolio1,
          // pdfSeal,
          this.form.get('fileName')?.value
        );
        return;

      case '2':
        /* Generar Reverso */
        if (!this.ReversePDFBytes) return;
        // this.addSeal();
        const pdfReverse2 = await this.addReverse(this.birthCertificateBytes);
        this.generateBlob(
          pdfReverse2,
          this.getFinalFileName()
        );

        return;

      case '3':
        /* Generar Folio y Reverso */
        if (!this.ReversePDFBytes) return;
        const pdfFolio3 = await this.addFolio(this.birthCertificateBytes);
        // this.addSeal();
        const pdfReverse3 = await this.addReverse(pdfFolio3);

        this.generateBlob(
          pdfReverse3,
          this.getFinalFileName()
        );
        // this.addFolio( true, false ); //has reverse: true
        return;

      case '4':
        /* Generar Marco */
        if (!this.frameBytes) return;
        const pdfFrame4 = await this.addFrame(this.birthCertificateBytes);

        this.generateBlob(
          pdfFrame4,
          this.form.get('fileName')?.value
        );
        return;

      case '5':
        /* Generar Marco con Folio y Reverso */
        if (!this.ReversePDFBytes) return;
        if (!this.frameBytes) return;

        const pdfFrame5 = await this.addFrame(this.birthCertificateBytes);
        const pdfFolio5 = await this.addFolio(pdfFrame5);
        // this.addSeal();
        const pdfReverse5 = await this.addReverse(pdfFolio5);

        this.generateBlob(
          pdfReverse5,
          this.getFinalFileName()
        );
        return;

      case '6':
        /* Generar Marco con Folio y Reverso */
        if (!this.ReversePDFBytes) return;
        if (!this.frameBytes) return;

        const pdfFrame6 = await this.addFrame(this.birthCertificateBytes);
        const pdfReverse6 = await this.addReverse(pdfFrame6);

        this.generateBlob(
          pdfReverse6,
          this.getFinalFileName()
        );
        return;

      case '7':
        /* Generar Sello */
        const pdfSeal7 = await this.addSealToReverse(this.birthCertificateBytes);
        this.generateBlob(
          pdfSeal7,
          this.form.get('fileName')?.value
        );
        return;

      default:
        // console.log('any option');
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

  async addReverse(pdfDoc: Uint8Array): Promise<Uint8Array> {

    try {
      // Load the birth certificate PDF
      // const birthCertificateDoc = await PDFDocument.load( pdfDoc );

      // Load the birth certificate PDF
      let birthCertificateDoc = await PDFDocument.load(pdfDoc);

      // Ensure birthCertificateDoc has only the first page
      if (birthCertificateDoc.getPageCount() > 1) {
        const newDoc = await PDFDocument.create();
        const [firstPage] = await newDoc.copyPages(birthCertificateDoc, [0]); // Copy only the first page
        newDoc.addPage(firstPage);
        birthCertificateDoc = newDoc; // Replace birthCertificateDoc with the new one
      }

      // Load the reverse PDF
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes!);
      const [reversePage] = reverseDoc.getPages();

      const boldFont = await reverseDoc.embedFont(StandardFonts.TimesRomanBold);
      const Helvetica = await reverseDoc.embedFont(StandardFonts.Helvetica);
      // Draw "gob" in black red
      reversePage.drawText('gob', {
        x: 21,
        y: 99, // Adjust y coordinate as needed
        size: 20,
        font: boldFont,
        color: rgb(0.576, 0.173, 0.286), // Black red color
      });

      // Calculate the width of the "gob" text to position ".mx" correctly
      const gobWidth = boldFont.widthOfTextAtSize('gob', 18);

      // Draw ".mx" in light gray
      reversePage.drawText('.mx', {
        x: 23 + gobWidth, // Adjust x coordinate based on the width of "gob"
        y: 99, // Same y coordinate
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

      const qrCodeBytes = await this.generateQRCode(CURPValue);

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

      this.writeCURPAroundTopQR(reversePage)

      /* Bottom QR */
      firstPage.drawImage(qrCodeImage, {
        x: 20,
        y: 20,
        width: 65,
        height: 65,
      });

      this.writeCURPAroundBottomQR(reversePage);

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


  /* async cropAndPasteReversePart(
    birthCertificateBytes: Uint8Array
  ): Promise<Uint8Array> {
    try {
      // 1️⃣ Load both PDFs
      const birthCertificateDoc = await PDFDocument.load(birthCertificateBytes);
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes!);

      // 2️⃣ Get the first page from each
      const [birthPage] = birthCertificateDoc.getPages();
      const [reversePage] = reverseDoc.getPages();

      // 3️⃣ Define the crop area from the reverse page (centered)
      const { width: reverseWidth, height: reverseHeight } = reversePage.getSize();
      // const cropWidth = 300;
      // const cropHeight = 200;
      const cropWidth = 612;
      const cropHeight = 350;

      console.log('reverseWidth', reverseWidth)
      console.log('reverseHeight', reverseHeight)

      
      let cropX = (reverseWidth - cropWidth) / 2;
      let cropY = (reverseHeight  - cropHeight) / 2; // raise crop window upward

      console.log('cropX', cropX);
      console.log('cropY', cropY);

      // 4️⃣ Create a temp PDF and copy the reverse page
      const tempDoc = await PDFDocument.create();
      const [tempPage] = await tempDoc.copyPages(reverseDoc, [0]);
      tempDoc.addPage(tempPage);

      // 🔹 This actually crops the visible area:
      // tempPage.setMediaBox(cropX, cropY, cropWidth, cropHeight - 300); //manage stretching, commpression
     
      tempPage.setMediaBox(cropX, cropY, cropWidth, cropHeight); //manage stretching, commpression
      tempPage.setCropBox(cropX, cropY, cropWidth, cropHeight);

      // 5️⃣ Embed the cropped page as a small section
      const [croppedPage] = await birthCertificateDoc.embedPages([tempPage]);

      // 6️⃣ Calculate placement position (bottom center)
      const { width: birthWidth } = birthPage.getSize();
      const targetX = (birthWidth - cropWidth) / 2 - 60;
      const targetY = 40;

      // 7️⃣ Draw the cropped area onto the birth certificate
      birthPage.drawPage(croppedPage, {
        x: targetX,
        y: targetY, //  - 400 cambia la posición donde es pegado el cuadro.
        width: cropWidth,
        height: cropHeight,
      });

      // 8️⃣ Save and return the modified PDF
      const resultBytes = await birthCertificateDoc.save();
      return resultBytes;
    } catch (error) {
      console.error('❌ Error cropping and pasting reverse part:', error);
      throw error;
    }
  } */

  /* async cropAndPasteReversePart(
    birthCertificateBytes: Uint8Array
  ): Promise<Uint8Array> {
    try {
      // 1️⃣ Load both PDFs
      const birthCertificateDoc = await PDFDocument.load(birthCertificateBytes);
      const reverseDoc = await PDFDocument.load(this.ReversePDFBytes!);

      // 2️⃣ Get the first page from each
      const [birthPage] = birthCertificateDoc.getPages();
      const [reversePage] = reverseDoc.getPages();

      // 3️⃣ Get reverse page dimensions
      const { width: reverseWidth, height: reverseHeight } = reversePage.getSize();
      console.log('reverseWidth', reverseWidth);
      console.log('reverseHeight', reverseHeight);

      // 4️⃣ Define the crop margins
      // 👇 Adjust these four values to trim any side
      const left = 50;     // trim 50px from left
      const right = 50;    // trim 50px from right
      // const top = 300;     // trim 300px from top
      const top = 150;     // trim 300px from top
      // const bottom = 200;  // trim 200px from bottom
      const bottom = 10;  // trim 200px from bottom

      // 5️⃣ Compute crop rectangle from four edges
      const cropX = left;
      const cropY = bottom;
      const cropWidth = reverseWidth - left - right;
      const cropHeight = reverseHeight - top - bottom;

      console.log('cropX', cropX);
      console.log('cropY', cropY);
      console.log('cropWidth', cropWidth);
      console.log('cropHeight', cropHeight);

      // 6️⃣ Create a temporary PDF with the cropped reverse page
      const tempDoc = await PDFDocument.create();
      const [tempPage] = await tempDoc.copyPages(reverseDoc, [0]);
      tempDoc.addPage(tempPage);

      // Apply the actual crop box
      tempPage.setMediaBox(cropX, cropY, cropWidth, cropHeight + 50);
      tempPage.setCropBox(cropX, cropY, cropWidth, cropHeight);

      // 7️⃣ Embed the cropped section into the birth certificate
      const [croppedPage] = await birthCertificateDoc.embedPages([tempPage]);

      // 8️⃣ Placement on the birth certificate
      const { width: birthWidth } = birthPage.getSize();
      const targetX = (birthWidth - cropWidth) / 2 - 60;
      const targetY = 40;

      // 9️⃣ Draw the cropped page onto the birth certificate
      birthPage.drawPage(croppedPage, {
        x: targetX,
        y: targetY,
        width: cropWidth,
        height: cropHeight,
      });

      // 🔟 Save and return the final result
      const resultBytes = await birthCertificateDoc.save();
      return resultBytes;
    } catch (error) {
      console.error('❌ Error cropping and pasting reverse part:', error);
      throw error;
    }
  } */

  async addSealToReverse(pdfBytes: Uint8Array): Promise<Uint8Array> {
    if (!this.ReverseSealBytes) {
      console.warn('⚠️ No seal image loaded.');
      return pdfBytes;
    }

    try {
      // 1️⃣ Load the PDF we want to modify (it can be the reverse or the final combined one)
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // 2️⃣ Embed the seal image (JPEG)
      const sealImage = await pdfDoc.embedJpg(this.ReverseSealBytes);
      const [firstPage] = pdfDoc.getPages();

      // 3️⃣ Get page dimensions and decide where to place the seal
      const { width, height } = firstPage.getSize();
      const sealScale = 0.3; // Adjust image scale here
      const sealDims = sealImage.scale(sealScale);

      // 🔹 Example positions:
      // AGUASCALIENTES: { x: 40, y: height - sealDims.height - 40 }, // top-left
      // DEFAULT: { x: (width - sealDims.width) / 2, y: (height - sealDims.height) / 2 } // center
      const positionMap: Record<string, { x: number; y: number }> = {
        TLAXCALA: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        AGUASCALIENTES: { x: width - sealDims.width - 330, y: 90 }, // top-left
        BAJACALIFORNIA: { x: width - sealDims.width - 334, y: 90 }, // bottom-right
        BAJACALIFORNIASUR: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        CAMPECHE: { x: width - sealDims.width - 340, y: 103 }, // bottom-right
        CHIAPAS: { x: width - sealDims.width - 338, y: 90 }, // bottom-right
        CHIHUAHUA: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        CIUDADDEMEXICO: { x: width - sealDims.width - 331, y: 90 }, // bottom-right
        COAHUILA: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        COLIMA: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        DURANGO: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        ESTADODEMEXICO: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        EXTRANJERO: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        GUANAJUATO: { x: width - sealDims.width - 338, y: 90 }, // bottom-right
        GUERRERO: { x: width - sealDims.width - 341, y: 90 }, // bottom-right
        HIDALGO: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        JALISCO: { x: width - sealDims.width - 338, y: 90 }, // bottom-right
        MICHOACAN: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        MORELOS: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        NAYARIT: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        NUEVOLEON: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        OAXACA: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        PUEBLA: { x: width - sealDims.width - 337, y: 90 }, // bottom-right
        QUERETARO: { x: width - sealDims.width - 330, y: 100 }, // bottom-right
        QUINTANAROO: { x: width - sealDims.width - 336, y: 103 }, // bottom-right
        SANLUISPOTOSI: { x: width - sealDims.width - 322, y: 90 }, // bottom-right
        SINALOA: { x: width - sealDims.width - 342, y: 90 }, // bottom-right
        SONORA: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        TABASCO: { x: width - sealDims.width - 340, y: 90 }, // bottom-right, moved left
        TAMAULIPAS: { x: width - sealDims.width - 335, y: 90 }, // bottom-right
        VERACRUZ: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        YUCATAN: { x: width - sealDims.width - 330, y: 90 }, // bottom-right
        ZACATECAS: { x: width - sealDims.width - 340, y: 90 }, // bottom-right
        DEFAULT: { x: width - sealDims.width - 330, y: 90 } // same bottom-right position
      };

      // 4️⃣ Get current state and pick coordinates
      const currentState = this.form.get('state')?.value || 'DEFAULT';
      const pos = positionMap[currentState] || positionMap['DEFAULT'];

      // 5️⃣ Draw the image (this "pastes" it)
      firstPage.drawImage(sealImage, {
        x: pos.x,
        y: pos.y,
        width: sealDims.width,
        height: sealDims.height,
      });

      // 6️⃣ Save and return updated bytes
      const modifiedBytes = await pdfDoc.save();
      return modifiedBytes;
    } catch (error) {
      console.error('❌ Error adding seal image:', error);
      throw error;
    }
  }

  async extras() {
    if (!this.ReversePDFBytes) return;
    if (!this.birthCertificateBytes) return;

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
  async addFolio(pdfDoc: Uint8Array): Promise<Uint8Array> {

    const randomNumber1 = this.generateRandomNumberString(1);
    const randomNumber7 = this.generateRandomNumberString(7);

    // Generate the barcode for the folio
    const barcodeBytes = await this.generateBarcode(`A0${randomNumber1} ${randomNumber7}`);

    // Load the birth certificate PDF and convert it to an image
    const birthCertificateDoc = await PDFDocument.load(pdfDoc);

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

    birthCertificatePage.drawText(`A0${randomNumber1} ${randomNumber7}`, {
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

  writeCURPAroundTopQR(reversePage: PDFPage) {

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

  writeCURPAroundBottomQR(reversePage: PDFPage) {

    const verificationCodeValue = this.form.get('verificationCode')?.value
    // heightAlias 792

    /* Medida para Baja California */
    /*horizontal bottom*/
    reversePage.drawText(verificationCodeValue, {
      x: 24,
      y: 15, // Adjust y coordinate as needed
      size: 5,
      // font: boldFont,
      color: rgb(0, 0, 0),
    });

    /*horizontal top*/
    reversePage.drawText(verificationCodeValue, {
      x: 24,
      y: 86, // Adjust y coordinate as needed
      size: 5,
      // font: boldFont,
      color: rgb(0, 0, 0),
    });

    /*vertical left*/
    reversePage.drawText(verificationCodeValue, {
      x: 15,
      y: 81,
      size: 5,
      color: rgb(0, 0, 0),
      rotate: degrees(270),
    });

    /*vertical right*/
    reversePage.drawText(verificationCodeValue, {
      x: 87,
      y: 81,
      size: 5,
      color: rgb(0, 0, 0),
      rotate: degrees(270),
    });

  }

  getFinalFileName(): string {
    return this.form.get('curp')?.value !== '' ? this.form.get('curp')?.value : this.form.get('fileName')?.value
  }

  redirectPanel() {

    if (!this.authService.isUserAdmin()) {
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

  permissionSello() {
    return this.authService.hasUserSello();
  }

  async extractTextFromPDF(arrayBuffer: ArrayBuffer) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText;
    }

    this.extractFields(fullText);
  }

  extractFields(text: string) {

    const actType = this.extractActType(text);
    const curp = this.extractCurp(text, actType);  // Pass actType to the CURP extraction function
    const state = this.extractState(text, actType);  // Pass actType to extractState
    const verificationCode = this.extractVerificationCode(text);

    // Patch form directly here
    this.form.patchValue({
      curp: curp ? curp : verificationCode,
      state: state,
      verificationCode: verificationCode
    });

  }

  // Function to extract CURP
  // Function to extract CURP, now considering actType
  private extractCurp(text: string, actType: string): string {
    let curpPattern: RegExp;

    // Adjust the pattern based on the actType
    if (actType === 'MATRIMONIO') {
      curpPattern = /Clave\s+Única\s+de\s+Registro\s+de\s+Población\s+de\s+los\s+([A-Z0-9]{18})/i;
    } else {
      curpPattern = /Clave\s+Única\s+de\s+Registro\s+de\s+Población\s+([A-Z0-9]{18})/i;
    }

    const curpMatch = text.match(curpPattern);
    return curpMatch ? curpMatch[1].toUpperCase().trim() : '';
  }

  // Function to extract the state with special handling for "Defunción"
  private extractState(text: string, actType: string): string {
    let state = '';

    // If actType is "Defunción", extract state between "Certificado de Defunción de la SSA" and "Entidad de Registro"
    if (actType === 'DEFUNCIÓN') {
      const defuncionStateMatch = text.match(/Certificado\s+de\s+Defunción\s+de\s+la\s+SSA\s+([A-Z\s]+)\s+Entidad\s+de\s+Registro/i);
      if (defuncionStateMatch) {
        state = defuncionStateMatch[1].trim();
      }
    } else {
      // Default extraction for other act types
      const estadoMatches = [...text.matchAll(/Entidad\s+de\s+Registro\s+([A-Z\s]+)\s+Estados\s+Unidos\s+Mexicanos\s+Acta\s+(?:de\s+Nacimiento|de\s+Matrimonio|de\s+Defunción)/g)];

      if (estadoMatches.length === 1 || estadoMatches.length >= 2) {
        state = estadoMatches[Math.min(estadoMatches.length - 1, 1)][1].trim();
      }
    }

    // Normalize state names
    switch (state.trim()) {
      case 'MEXICO':
        return 'ESTADODEMEXICO';
      case 'MICHOACAN DE OCAMPO':
        return 'MICHOACAN';
      case 'COAHUILA DE ZARAGOZA':
        return 'COAHUILA';
      default:
        return state.toUpperCase().trim().replace(/[\s-]/g, '');
    }
  }

  // Function to extract Acta type (Nacimiento, Matrimonio, Defunción)
  private extractActType(text: string): string {
    const actTypeMatch = text.match(/Acta\s+de\s+(Nacimiento|Matrimonio|Defunción)/i);
    return actTypeMatch ? actTypeMatch[1].toUpperCase().trim() : '';
  }

  // Function to extract Código de Verificación
  private extractVerificationCode(text: string): string {
    // First, attempt extraction using the label "Código de Verificación"
    // const verificationCodeMatch = text.match(/Código\s+de\s+Verificación\s+([A-Z0-9]+)/i);
    const verificationCodeMatch = text.match(/Código\s+de\s+Verificación\s+([A-Z0-9]{20})(?=\b|[^A-Z0-9])/i);
    let verificationCode = verificationCodeMatch ? verificationCodeMatch[1].toUpperCase().trim() : '';

    // If no valid 20-character code is found, search for the last 20-character string in the text
    if (verificationCode.length !== 20) {
      // const endOfTextCodeMatch = text.match(/[A-Z0-9]{20}(?!.*[A-Z0-9])/i);
      const endOfTextCodeMatch = text.match(/[A-Z0-9]{20}(?=\b|[^A-Z0-9])(?!.*[A-Z0-9]{20})/i);
      if (endOfTextCodeMatch) {
        verificationCode = endOfTextCodeMatch[0].toUpperCase().trim();
      }
    }

    return verificationCode;
  }


  logout(): void {
    this.authService.logout();
    this.webSocketService.disconnect();
    // this.router.navigate(['/login'])
    // console.log('Logged out.');
  }

}
