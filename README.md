# NAJU - Sistema de Gestión de Pacientes (Tauri + React)

**NAJU** es una aplicación de escritorio moderna diseñada para la gestión local de pacientes, historias clínicas y exámenes mentales. Combina la potencia y seguridad de **Rust** en el backend con la flexibilidad y estética de **React** en el frontend.

## 🚀 Tecnologías

El proyecto utiliza la arquitectura **Tauri**:

*   **Frontend**: React (Vite) + TypeScript.
*   **Backend**: Rust (Tauri Core).
*   **Base de Datos**: SQLite (Local, archivo `.sqlite` en `AppData`).
*   **Estilos**: CSS nativo con variables para temas (Light/Dark) y diseño "Apothecary" (Tierra/Dorado).

---

## 📂 Estructura del Código

### 1. Backend (Rust) - `src-tauri/`
El corazón de la aplicación que interactúa con el sistema operativo.

*   **`src/main.rs`**: Aquí reside toda la lógica del servidor local.
    *   **Base de Datos**: Inicia y conecta con SQLite (`rusqlite`). Crea la tabla `patients` automáticamente si no existe.
    *   **Comandos Tauri (`#[tauri::command]`)**: Son las funciones que el Frontend puede invocar.
        *   `list_patients`: Busca pacientes (soporta filtros por nombre).
        *   `create_patient` / `update_patient`: Gestión de registros.
        *   `import_files`: Copia archivos externos a la carpeta segura del paciente.
        *   `create_mse`: Guarda el "Examen Mental Formal" como un archivo JSON estructurado.
    *   **Gestión de Archivos**: Se encarga de crear carpetas únicas por paciente (UUID) dentro del directorio de datos de la aplicación.

### 2. Frontend (React) - `src/`
La interfaz de usuario que ve el profesional.

*   **`lib/api.ts`**: Es el "puente". Define los tipos de datos (TypeScript interfaces) y exporta funciones que llaman a los comandos de Rust (`invoke('command_name')`).
*   **`App.tsx`**: Contiene la lógica principal de la UI.
    *   Gestiona el estado (lista de pacientes, paciente seleccionado, pestañas).
    *   Controla los modales (Crear Paciente, Examen Mental).
    *   Calcula la edad y formatea datos en tiempo real.
*   **`styles.css`**: Define el sistema de diseño.
    *   Variables CSS (`--earth-1`, `--gold`, etc.) para una fácil personalización y cambio de tema.
    *   Estilos de las "Cards" y animaciones suaves.

### 3. Datos (`App Data`)
La aplicación **NO** guarda datos en la carpeta del ejecutable. Lo hace en la ruta estándar del sistema operativo para datos de aplicación:
*   **Windows**: `C:\Users\Usuario\AppData\Roaming\NAJU` (o `Local` según config).
    *   Aquí encontrarás el archivo `naju.sqlite` y la carpeta `patients/` con las fotos y adjuntos.

---

## 🛠️ Instalación y Ejecución

Requisitos: [Node.js](https://nodejs.org/) y [Rust](https://rustup.rs/) instalados.

1.  **Instalar dependencias**:
    ```bash
    cd naju
    npm install
    ```

2.  **Correr en desarrollo**:
    ```bash
    npm run tauri dev
    ```
    *Esto abrirá la ventana de la aplicación con recarga automática (HMR).*

3.  **Compilar para producción (.exe)**:
    ```bash
    npm run tauri build
    ```
    *El instalador (`.msi` o `.exe`) se generará en `src-tauri/target/release/bundle/`.*

---

## 🧯 Solución de problemas comunes

### Error: `Identifier 'profileByPatient' has already been declared`

Este error sucede cuando existen **dos declaraciones** de `profileByPatient` en el mismo scope dentro de `src/App.tsx`. Para resolverlo:

1. Abre `naju/src/App.tsx` y busca todas las apariciones de `profileByPatient`.
2. Asegúrate de que **solo exista una** (o renombra una de ellas).
3. Guarda y vuelve a ejecutar `npm run dev`.

Si tu copia está actualizada, el bloque válido se llama `profileByPatientMap`.

---

## ✨ Características Clave

*   **Privacidad Local**: Todos los datos viven en tu máquina, nada en la nube.
*   **Estética Premium**: Interfaz cuidada con detalles dorados y paleta de colores tierra.
*   **Examen Mental Formal**: Formulario completo que se guarda como documento inmutable (JSON) con fecha y hora.
*   **Adjuntos**: Capacidad de arrastrar o seleccionar archivos (PDFs, imágenes) que se organizan automáticamente en la carpeta del paciente.

## Linux: acceso directo de escritorio

1. Ejecuta una sola vez:
   ```bash
   ./INSTALAR_ACCESO_DIRECTO_LINUX.sh
   ```
2. Esto crea `~/.local/share/applications/NAJU.desktop` y una copia en `~/Desktop/NAJU.desktop`.
3. Al hacer doble clic en el acceso directo:
   - levanta NAJU en modo desarrollo (`INICIAR_NAJU_LINUX.sh`),
   - espera a que responda,
   - y abre el navegador automáticamente.
