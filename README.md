
#
1) npm install -g @angular/cli@17
2) ng new my-first-project
3) yes - no - CSS 

3) ng serve 
4) ng add @angular/material >> agrego libreria CSS >>  Y
5) https://material.angular.dev/components/table/overview 


# Tpfinal

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


## Inicio de Angular

Angular es un framework de JavaScript desarrollado por Google para crear aplicaciones web SPA (Single Page Applications). Es de código abierto, usa TypeScript por defecto y sigue el patrón MVC (Model-View-Controller).

Características Principales
TypeScript: Lenguaje principal

Component-based: Arquitectura basada en componentes

Two-way data binding: Sincronización bidireccional de datos

Inyección de dependencias: Gestión eficiente de servicios

Directivas: Funcionalidades extendidas del HTML

Router: Navegación entre vistas

HTTP Client: Comunicación con APIs

Estructura de Carpetas de un Proyecto Angular


mi-proyecto-angular/
├── 📁 node_modules/          # Dependencias instaladas
├── 📁 src/                   # Código fuente principal
│   ├── 📁 app/               # Módulo principal y componentes
│   │   ├── 📁 components/    # Componentes reutilizables
│   │   ├── 📁 services/      # Servicios y lógica de negocio
│   │   ├── 📁 models/        # Interfaces y modelos de datos
│   │   ├── 📁 guards/        # Protección de rutas
│   │   ├── 📁 interceptors/  # Interceptores HTTP
│   │   ├── app.component.ts  # Componente raíz
│   │   ├── app.module.ts     # Módulo principal
│   │   └── app-routing.module.ts # Configuración de rutas
│   ├── 📁 assets/            # Recursos estáticos (imágenes, fuentes)
│   ├── 📁 environments/      # Configuraciones por entorno
│   ├── index.html            # HTML principal
│   ├── main.ts               # Punto de entrada de la aplicación
│   └── styles.css            # Estilos globales
├── 📁 dist/                  # Archivos de construcción (producción)
├── angular.json              # Configuración del workspace
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
└── README.md                 # Documentación del proyecto

Explicación Detallada de Cada Carpeta
1. src/app/ - Núcleo de la Aplicación
app.module.ts
typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    AppComponent,
    // Componentes declarados aquí
  ],
  imports: [
    BrowserModule,
    // Módulos importados aquí
  ],
  providers: [
    // Servicios globales aquí
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
app.component.ts (Componente Raíz)
typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mi-aplicacion';
}
2. Estructura de un Componente Típico
text
components/
└── usuario/
    ├── usuario.component.ts          # Lógica del componente
    ├── usuario.component.html        # Template/HTML
    ├── usuario.component.css         # Estilos específicos
    └── usuario.component.spec.ts     # Pruebas unitarias
3. Services/ - Lógica de Negocio y APIs
typescript
// services/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  constructor(private http: HttpClient) { }
  
  getUsuarios() {
    return this.http.get('/api/usuarios');
  }
}
4. Models/ - Interfaces y Tipos
typescript
// models/usuario.model.ts
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}
Comandos Básicos de Angular CLI
bash
# Crear nuevo proyecto
ng new mi-proyecto

# Generar componente
ng generate component nombre-componente
ng g forma reducida
# Generar servicio
ng generate service nombre-servicio

# Ejecutar en desarrollo o corre la aplicacion de angular
ng serve
# Ejecutar en json-server 
json-server --watch json/db.json --port 3000

# Construir para producción
ng build