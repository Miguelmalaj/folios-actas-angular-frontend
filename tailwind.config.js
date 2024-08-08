/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize:{
        xxs: '.65rem', // o cualquier tamaño que necesites
      },
      colors: {
        blueAdroit: '#159DE2', // Aquí agregas tu color personalizado con un nombre descriptivo,
        blueStrongAdroit:'#17244A',
        grayAdroit:'#727272',
        grayGrid:'#F4F4F4',
        grayGridLight:'#AAC7D5',
        grayGridText:'#848484',
        grayMediumText:'#ABAAAA',
        blueCurrency:'#005986',
        grayBGLight:'#E1EBF1',
        grayBGForm:'#F6F7FB',
        grayTextMenu:'#1C1C1C66',
        grayInputText:'#1C1C1C0D',
        grayMenuText:'#615F5F',
        grayActivityText:'#615F5F',
        redCircleActivity:'#710808',
        grayBackgroundGrid:'#ECECEC',
        greenButton:'#8ECDA8',
        grayTransparency:'#F4F4F466',
        analytic:'#F4BF70',
        blueTaxes:'#E1EBF1'
      },
      placeholderColor: { // Añadir esta línea
        red: '#FF0000',    // y esta línea
        // Puedes agregar más colores si es necesario
      }
    },
  },
  plugins: [],
}

