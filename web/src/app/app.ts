// Componente raíz: cabecera con menú, estado de la API, ruta activa y avisos.
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Avisos } from './shared/aviso/avisos';
import { ApiCaida } from './shared/estado-api/api-caida';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avisos, ApiCaida],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}