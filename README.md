Nombre del proyecto: UTN – Autogestión de alumnos y administrativos.

Sistema de autogestión desarrollado en Angular para estudiantes y administrativos de la Universidad Tecnológica Nacional – Facultad Regional Mar del Plata.
Simula un entorno real de gestión académica: inscripciones, notas, certificaciones, pagos y administración.


---

📌 Características principales

🔐 Autenticación y Seguridad

Login con credenciales almacenadas en JSON Server.

AuthGuard para proteger rutas internas.

Control de roles: Alumno / Administrativo.


## 🔐 Autenticación y Seguridad

- Login con credenciales almacenadas en JSON Server
- Protección de rutas mediante Guards
- Control de roles:
  - Alumno
  - Administrativo
  - Profesor
- Navegación restringida según perfil

---

🎓 Panel del Alumno

✔ Consulta de Deuda
- Visualización de deudas pendientes
- Generación de **QR ficticio dinámico**
- Modal superpuesto para simular pago
- Actualización de estado tras el “pago”

✔ Inscripción a Cursadas
- Filtrado por correlatividades
- Validación de estado académico
- Inscripción y baja según disponibilidad

 ✔ Inscripción a Exámenes
- Verificación de correlativas
- Control de condición (regular / aprobada)
- Evita inscripciones duplicadas
- Visualización del estado “Inscripto”

✔ Notas
- Visualización de:
  - Notas de cursada
  - Notas de exámenes finales
- Fechas formateadas con locale **es-AR**
- Ordenadas y legibles

✔ Certificados
- Generación de **Certificado Académico en PDF**
- Implementado con `jsPDF` y `html2canvas`
- Incluye:
  - Encabezado institucional UTN
  - Tabla de materias y notas
  - Firma simulada

------

🧑‍🏫 Panel del Profesor (NUEVO)

✔ Gestión académica
- Acceso exclusivo mediante rol **Profesor**
- Menú independiente del administrativo

✔ Carga de notas de cursadas
- Solo permite calificar cursadas **previamente inscriptas**
- Validaciones automáticas:
  - **Aprobado**: promedio ≥ 8
  - **Regular**: promedio ≥ 6 y < 8
- Registro de notas parciales (P1 / P2)

✔ Carga de notas de exámenes
- Solo permite calificar mesas:
  - Con inscripción previa del alumno
  - Con cursada aprobada
- Selección de mesa válida

✔ Edición y eliminación de notas
- Edición de notas de:
  - Examen
  - Cursada
- Eliminación con confirmación
- Restricciones según estado académico
- Asignación automática de condición:
  - aprobado / desaprobado
    
---

🛠️ Panel del Administrativo

✔ Gestión de alumnos
- **Alta de alumnos**
  - Formulario validado con Angular Material
  - **Generación automática de legajo**
- **Edición de alumnos**
- **Eliminación de alumnos**
- Manejo correcto de IDs como string
  - Evita pérdida de ceros a la izquierda
- Navegación a edición mediante query params

✔ Listado y detalle
- Listado general de alumnos
- Búsqueda dinámica
- Acceso al detalle completo del estudiante

✔ Inscripción académica
- Inscripción a cursadas y exámenes
- Mismas reglas que el panel del alumno


---

🧰 Tecnologías utilizadas

Tecnología Uso

Angular 17+ Frontend principal
Angular Material UI y componentes
RxJS Reactividad y streams
Signals Gestión de estado
JSON Server Backend simulado
jsPDF + html2canvas Generación de PDFs
TypeScript Tipado fuerte
HTML / CSS Maquetación y estilos



---

📂 Estructura del proyecto

src/
├── app/
│ ├── core/ # Modelos, guards y servicios base
│ ├── pages/
│ │ ├── alumno/ # Panel del alumno
│ │ ├── admin/ # Panel administrativo
│ │ ├── profesor/ # Panel del profesor
│ │ ├── login/ # Inicio de sesión
│ ├── services/ # Servicios globales
│ ├── app.routes.ts # Rutas de la aplicación
├── assets/ # Recursos (logos, imágenes)
├── json/ # db.json (backend simulado)


---

⚙️ Instalación

1. Clonar el repositorio:



git clone https://github.com/lu-fv/tp-final.git

2. Instalar dependencias:



npm install

3. Levantar JSON Server (backend simulado):

json-server --watch json/db.json --port 3000

4. Levantar la aplicación Angular:

ng serve -o


---

▶️ Modo de uso

Iniciar sesión como Alumno, Profesor o Administrativo

Navegar según el rol habilitado

Gestionar:

Inscripciones

Notas

Certificados

Alumnos

Probar validaciones y restricciones académicas


---

📲 Generación del QR (módulo de deudas)

Funcionalidad ficticia:

El QR se genera automáticamente en un modal centrado.

Simula el proceso real de pago.

Tras “cerrarlo”, se actualiza el estado de deuda como pagada.



---

📄 Generación de PDF — Certificado Académico

Utiliza jsPDF y html2canvas.

El contenido HTML se transforma a PDF con estilos personalizados.

Incluye cabecera institucional y tabla de notas.



---

📚 Objetivo del proyecto

Simular un Sistema de Autogestión Académica real, integrando:

Seguridad y control de acceso

Reactividad avanzada

Modelos de datos

Interacción con backend simulado

Diseño responsive

Generación de documentos

Separación clara de responsabilidades por rol



---

👥 Autores

Franco vertiz Lucia.
Oscar Gabriel Laguna.
