# Acta de Reunión: Sprint 4 (Reunión 1)

## Información General

```
● Proyecto: Juego de Cartas "Ronda Marroqui"
● Tipo de reunión: Retrospectiva y Planificación de Sprint
● Fecha y hora: 28/11/2025
● Duración: 2 Horas
● Lugar: Presencial - Campus UPV
● Asistentes:
○ Yahya Aboulafiya
○ Adrián Hoyos Sánchez
○ Souhail Batah
○ Carlos Robledo Badía
```

## 1. Objetivo de la Reunión

Revisar todo lo que hicimos en el Sprint 3 (que fue mucho más de lo que documentamos) y empezar a planificar el Sprint 4, donde vamos a mejorar el sistema con WebSockets para tener comunicación en tiempo real entre jugadores.

## 2. Temas Tratados

### 2.1. Retrospectiva del Sprint 3

Revisamos todo lo que hicimos en el Sprint 3 y nos dimos cuenta de que avanzamos bastante más de lo planeado. Los puntos más importantes:

● **Sistema Multijugador:** El sistema de partidas funciona bien, con sala de espera donde los jugadores pueden crear partidas (de 3 a 6 jugadores) y unirse a ellas.

● **Sistema de Torneos:** Implementamos el módulo de torneos con dos tipos: eliminatorio y todos contra todos. Incluye inscripciones, control de cupos y tabla de clasificaciones.

● **Guardar Partidas:** El sistema guarda el estado de las partidas en formato JSON en la base de datos, así se pueden recuperar partidas guardadas y continuar juegos que se dejaron a medias.

● **Perfil de Usuario:** Cada jugador tiene su perfil con estadísticas: partidas jugadas, ganadas, perdidas y puntos totales.

### 2.2. Arquitectura Implementada

Documentamos cómo quedó la arquitectura del Sprint 3:

● **Base de Datos:** Tenemos 6 tablas funcionando (Usuario, Torneo, Clasificacion_Torneo, Partida, Partida_Jugador, Movimiento) con las relaciones bien definidas e índices para mejorar el rendimiento.

● **Backend (API REST):** Implementamos 18 endpoints que cubren todo el juego:
  - 5 endpoints de autenticación y usuarios
  - 9 endpoints de gestión de partidas
  - 4 endpoints de sistema de torneos

● **Frontend:** Todas las pantallas están conectadas: bienvenida, sala de espera, tablero de juego, perfil, torneos, login y registro.

### 2.3. Funcionalidades Avanzadas del Juego

Revisamos la lógica del juego "Ronda Marroquí" y confirmamos que todo funciona:

● **Cartas Especiales:** Todas las cartas especiales funcionan bien:
  - As: El siguiente jugador roba 3 cartas
  - Dos: El siguiente jugador roba 2 cartas  
  - Cuatro: Salta el turno del siguiente jugador
  - Siete: Permite cambiar el palo activo (comodín)

● **Mecánicas del Juego:** Cambio de dirección, reciclaje del mazo cuando se acaban las cartas, validación de jugadas y detección automática del ganador.

● **Sincronización:** Por ahora usamos polling cada 3 segundos para sincronizar a los jugadores. Es funcional pero queremos mejorarlo con WebSockets.

### 2.4. Métricas del Desarrollo

Contamos lo que llevamos desarrollado:

● **Líneas de Código:** Unas 3,500 líneas (sin contar librerías).

● **Archivos Principales:**
  - Backend: server.js, torneoController.js, torneoRoutes.js, RondaGame.js, DBControlador.js
  - Frontend: sala-espera.html, index.html, torneos.html, profile.html, welcome.html
  - Estilos: styles.css con diseño profesional glassmorphism

● **Tecnologías:** Node.js + Express.js, MySQL 8.0, Vanilla JavaScript, Bootstrap 5, bcrypt para seguridad.

### 2.5. Planificación del Sprint 4

Decidimos que el Sprint 4 va de mejorar la experiencia del usuario:

● **Objetivo Principal:** Quitar el polling y meter WebSockets con Socket.io para que la sincronización sea instantánea.

● **Lo que esperamos conseguir:**
  - Bajar la latencia de 3 segundos a menos de 100ms
  - Notificaciones instantáneas cuando alguien juega
  - Mejor experiencia para los usuarios
  - Menos carga en el servidor

● **Extras:** Si da tiempo, agregar chat en vivo durante las partidas y mejorar las notificaciones visuales.

## 3. Acuerdos y Asignación de Tareas

Tareas para empezar el Sprint 4:

● **Investigación Técnica:** Carlos y Adrián revisan la documentación de Socket.io y piensan cómo organizar los eventos.

● **Preparar el Entorno:** Carlos instala socket.io y configura el servidor.

● **Diseño de Eventos:** Entre todos definimos qué eventos vamos a usar (join_partida, movimiento, disconnect, etc.).

● **Documentación:** Yahya documenta todo lo que hicimos en Sprint 3.

## 4. Próxima Reunión

Quedar el 1/12/2025 para ver cómo va la implementación de WebSockets y definir los detalles de cómo integrarlo con el código que ya tenemos.

**Firma de conformidad:** Equipo de Desarrollo Ronda Marroquí
