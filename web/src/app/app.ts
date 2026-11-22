// Componente raíz: cabecera con menú, contenedor de la ruta activa y avisos.
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Avisos } from './shared/aviso/avisos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avisos],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}