# DomiApp

DomiApp es una aplicacion web mobile-first para apoyar la operacion de domiciliarios. Esta pensada para consultar pedidos asignados, revisar estados, navegar rutas sugeridas, registrar novedades y guardar evidencia de entrega desde una interfaz rapida y sencilla.

El proyecto esta construido como frontend con React, TypeScript y Vite.

## Caracteristicas principales

- Inicio de sesion para el domiciliario.
- Dashboard con resumen de pedidos y metricas del dia.
- Listado de pedidos asignados.
- Detalle de pedido con informacion clave de entrega.
- Navegacion y ruta sugerida.
- Registro de novedades durante la entrega.
- Historial de entregas.
- Perfil del domiciliario.
- Componentes reutilizables para tarjetas, botones, badges, navegacion inferior y KPIs.

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- Zustand
- Lucide React

## Requisitos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Node.js
- npm

## Instalacion

```bash
npm install
```

## Ejecutar en local

```bash
npm run dev
```

Por defecto Vite intentara levantar la aplicacion en:

```text
http://127.0.0.1:5173/
```

Si ese puerto esta ocupado, Vite usara automaticamente otro puerto cercano, por ejemplo:

```text
http://127.0.0.1:5174/
```

## Scripts disponibles

```bash
npm run dev
```

Inicia el servidor de desarrollo.

```bash
npm run build
```

Genera la version de produccion en la carpeta `dist/`.

```bash
npm run preview
```

Sirve localmente la version generada en `dist/` para validacion previa al despliegue.

## Estructura del proyecto

```text
src/
  components/       Componentes reutilizables de interfaz
  components/ui/    Componentes base como Button, Card y Badge
  hooks/            Hooks personalizados
  lib/              Utilidades generales
  pages/            Vistas principales de la aplicacion
  routes/           Layout y estructura de rutas
  services/         Cliente y funciones de consumo API
  store/            Estado global con Zustand
  types/            Tipos TypeScript compartidos
  App.tsx           Componente raiz
  main.tsx          Punto de entrada
  styles.css        Estilos globales
```

## Despliegue

Para generar los archivos finales:

```bash
npm run build
```

El resultado queda en:

```text
dist/
```

Esa carpeta contiene los archivos estaticos que pueden publicarse en cPanel, hosting estatico o cualquier servidor web compatible.

## Notas de desarrollo

- No subir `node_modules/` al repositorio.
- No subir archivos `.env.local` con credenciales o URLs privadas.
- Los archivos `.zip`, logs y builds locales quedan excluidos por `.gitignore`.
- Si se cambia una URL de backend o una variable de entorno, documentarla antes de desplegar.
