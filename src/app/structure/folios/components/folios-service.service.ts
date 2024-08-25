import { Injectable } from '@angular/core';
import { ReverseMeasure } from '../interfaces/reverse-measures.interface';

@Injectable({
  providedIn: 'root'
})
export class FoliosService {

  constructor() { }

  getMeasuresOfReverse( state: string ): ReverseMeasure {

    switch ( state ) {
      case 'BAJACALIFORNIA':
        return { 
          horizontalTop: 5,
          horizontalBottom: 5,
          verticalLeft: 5,
          verticalRight: 5
         }
    
      default:
        return { 
          horizontalTop: 5,
          horizontalBottom: 5,
          verticalLeft: 5,
          verticalRight: 5
         }
    }

  }
}
