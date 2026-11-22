// Vista provisional para módulos aún no implementados.
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-en-construccion',
  template: `
    <section class="en-construccion">
      <h1>{{ titulo() }}</h1>
      <p>Módulo en construcción.</p>
    </section>
  `,
})
export class EnConstruccion {
  titulo = input('Módulo'); // se recibe desde data de la ruta
}