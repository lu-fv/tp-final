Nombre del proyecto: UTN – Autogestión de alumnos y administrativos.

Sistema de autogestión desarrollado en Angular para estudiantes y administrativos de la Universidad Tecnológica Nacional – Facultad Regional Mar del Plata.
Simula un entorno real de gestión académica: inscripciones, notas, certificaciones, pagos y administración.


---

📌 Características principales

🔐 Autenticación y Seguridad

Login con credenciales almacenadas en JSON Server.

AuthGuard para proteger rutas internas.

Control de roles: Alumno / Administrativo.



---

🎓 Panel del Alumno

✔ Consulta de Deuda

Visualización de deudas pendientes.

QR ficticio generado dinámicamente.

El QR aparece como modal superpuesto para simular pago.


✔ Inscripción a Cursadas

Filtrado por correlativas y estado académico.

Inscribirse / darse de baja según disponibilidad.


✔ Inscripción a Exámenes

Verifica correlatividades, condición regular o aprobada.

Evita inscripciones duplicadas.

Muestra estado “Inscripto”.


✔ Notas

Notas de cursada y finales.

Fechas formateadas con locale es-AR.

Ordenadas y legibles.


✔ Certificados

Generación de Certificado Académico en PDF con jsPDF.

Incluye encabezado UTN, tabla de notas y firma simulada.



---

🛠️ Panel del Administrativo

✔ Alta de alumnos

Formulario validado con Angular Material.

✔ Listado y detalle

Acceso a información completa del estudiante con opciones administrativas.

✔ Inscripción a cursadas y exámenes

Mismas reglas que en el panel del alumno.

✔ Carga de notas de examen

Solo permite calificar materias con cursada aprobada.

Solo permite calificar materias cuya inscripcion a la mesa fue realizada con anterioridad.

Selección de mesa válida.

Asignación automática de condición (aprobado/desaprobado).

✔ Carga de notas de cursadas.

Solo permite calificar cursadas cuya inscripcion a la materia fue realizada.

Asignacion de aprobado (promedio de notas de P1 y P2 >= 8).

Asignacion de regular (promedio de notas de P1 y P2 >= 6 y <8)



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
 │ ├── core/ # Modelos, guards, servicios base
 │ ├── pages/
 │ │ ├── aluno/ # Panel del estudiante
 │ │ ├── admin/ # Panel administrativo
 │ │ ├── login/ # Inicio de sesión
 │ ├── services/ # Servicios globales
 │ ├── app.routes.ts # Rutas de la aplicación
 ├── assets/ # Recursos (logos, imágenes)
 ├── json/ # db.json usado como backend


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

Iniciar sesión como Alumno o Administrativo.

Explorar cada módulo desde la barra de navegación.

Generar inscripciones, consultar estados y descargar certificados.



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

Simular un Sistema de Autogestión real para prácticas académicas de programación avanzada en Angular, integrando:

seguridad,

reactividad,

modelos de datos,

interacción con backend,

diseño responsive,

generación de documentos.



---

👥 Autores

Franco vertiz Lucia.
Oscar Gabriel Laguna.
