# Personal App — Productivity Dashboard + Weekly Planner

React · Vite · JavaScript · CSS · Local Storage · Vercel

## Descripción del Proyecto

Personal App es una aplicación web personal de productividad construida con React y Vite. El proyecto centraliza agenda semanal, hábitos, objetivos, bloques de universidad, entrenamiento, trabajo en Vendify, fotografía, alimentación, sueño y rutinas personales en una sola interfaz ligera.

El problema que resuelve es simple: cuando una persona maneja múltiples frentes —universidad, gimnasio, trabajo, proyectos personales y hábitos— la planificación suele quedar dispersa entre notas, calendarios, recordatorios y memoria. Esta aplicación convierte esa rutina semanal en un sistema visual único para saber qué toca hacer, qué bloque está activo, qué viene después y cómo avanza la ejecución diaria.

La app funciona como un sistema operativo personal: no busca ser una herramienta genérica para cualquier usuario, sino una interfaz hecha a medida para organizar el día, reducir fricción mental y mantener visibles las prioridades importantes.

## Objetivo

El objetivo del proyecto es crear un dashboard personal que permita:

- Visualizar la agenda semanal completa.
- Identificar el bloque actual del día.
- Consultar próximas actividades.
- Registrar hábitos diarios.
- Revisar historial de hábitos.
- Medir progreso de objetivos.
- Centralizar rutinas de universidad, gym, Vendify y tiempo personal.
- Mantener una interfaz rápida, simple y mobile-first.

## Estructura del Proyecto

```text
Personal App/
├── public/                         # Assets públicos
├── src/                            # Código fuente principal
│   ├── assets/                     # Recursos estáticos
│   ├── App.jsx                     # Entrada principal de la app
│   ├── App.css                     # Estilos de aplicación
│   ├── index.css                   # Estilos globales
│   └── main.jsx                    # Render principal de React
├── alexander_personal_os.jsx       # Componente principal del sistema personal
├── eslint.config.js                # Configuración ESLint
├── index.html                      # HTML base de Vite
├── package.json                    # Dependencias y scripts
├── vite.config.js                  # Configuración de Vite
└── README.md
```

## Módulos de la Solución

### 1. Dashboard Diario

Vista principal enfocada en el día actual.

Incluye:

- Día actual.
- Hora actual.
- Bloque activo.
- Progreso del bloque actual.
- Próximas actividades.
- Categorías visuales por tipo de actividad.

Este módulo permite saber rápidamente qué se está ejecutando en el momento y qué viene después.

### 2. Agenda Semanal

Módulo de planificación estructurado por días y bloques horarios.

Incluye bloques como:

- Sueño.
- Rutina personal.
- Comidas.
- Transporte.
- Universidad.
- Gym.
- Vendify.
- Fotografía.
- Tiempo libre.
- Actividades personales.

La agenda semanal convierte una rutina compleja en una vista ordenada y fácil de consultar.

### 3. Habit Tracker

Sistema de seguimiento de hábitos diarios.

Incluye hábitos como:

- Gym.
- Agua 2L.
- Desayuno.
- Almuerzo.
- Cena.
- Vendify mínimo 2 horas.
- Sueño mayor a 7 horas.

Este módulo ayuda a convertir acciones repetidas en datos visibles de ejecución diaria.

### 4. Historial de Hábitos

Vista de revisión de los últimos días para analizar consistencia.

Incluye:

- Historial de cumplimiento.
- Registro visual por hábito.
- Revisión rápida del progreso semanal.
- Control manual de hábitos completados.

### 5. Seguimiento de Objetivos

Módulo para medir el avance de metas personales.

Incluye objetivos relacionados con:

- Gym.
- Vendify.
- Universidad.
- Vida personal.
- Progreso porcentual.
- Edición manual de avances.

### 6. Sistema Visual por Categorías

La aplicación clasifica los bloques por tipo de actividad para facilitar la lectura.

Categorías principales:

- Sueño.
- Rutina.
- Comida.
- Transporte.
- Universidad.
- Gym.
- Vendify.
- Personal.
- Libre.
- Fotografía.

Cada categoría tiene una identidad visual distinta para que la agenda sea más fácil de interpretar.

## Características Principales

- Dashboard personal de productividad.
- Agenda semanal estructurada.
- Vista de bloque actual.
- Progreso de actividad en tiempo real.
- Seguimiento de hábitos diarios.
- Historial de hábitos.
- Seguimiento de objetivos.
- Interfaz ligera y rápida.
- Diseño orientado a mobile-first.
- Deploy en Vercel.
- Construido con React y Vite.

## Tech Stack

| Área | Tecnología |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Lenguaje | JavaScript / JSX |
| Estilos | CSS |
| Estado | React Hooks |
| Persistencia | Local browser state / local workflow |
| Linting | ESLint |
| Deploy | Vercel |

## Cómo Ejecutar el Proyecto

### Requisitos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Node.js
- npm

### Instalación

Clona el repositorio:

```bash
git clone https://github.com/mmauriciocabanillas/My-app.git
cd My-app
```

Instala las dependencias:

```bash
npm install
```

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

## Scripts Disponibles

```bash
npm run dev
```

Ejecuta la aplicación en modo desarrollo.

```bash
npm run build
```

Genera la build de producción.

```bash
npm run preview
```

Permite previsualizar la build de producción localmente.

```bash
npm run lint
```

Ejecuta ESLint para revisar calidad de código.

## Demo

Aplicación desplegada:

```text
https://myapp-hazel-zeta.vercel.app
```

## Estado del Proyecto

Proyecto funcional en desarrollo. Actualmente está orientado a uso personal, pero puede evolucionar hacia una plantilla reutilizable para dashboards personales, sistemas de hábitos o planificación semanal.

## Roadmap

Posibles mejoras futuras:

- Persistencia completa en base de datos.
- Autenticación de usuario.
- Integración real con Notion API.
- Modo edición para modificar bloques desde la interfaz.
- Estadísticas semanales de hábitos.
- Exportación de agenda.
- Mejoras PWA para uso móvil.
- Sincronización entre dispositivos.

## Autor

Alexander Cabanillas

## Licencia

MIT License. Ver el archivo `LICENSE` para más detalles.
