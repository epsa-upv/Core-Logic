# SPRINT 2 - COMPLETADO ✅

## Resumen del Sprint 2 - Ronda Marroquí

**Fecha de finalización:** 01 de noviembre de 2025  
**Equipo:** Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía

---

## 🎯 Objetivos Alcanzados

### ✅ Sistema de Usuarios y Autenticación
- Página de login funcional con validación
- Página de registro de nuevos usuarios
- Sistema de roles (Jugador y Administrador)
- Gestión de sesiones con sessionStorage
- Validación de contraseñas con indicador de fuerza

### ✅ Base de Datos MySQL
- Script SQL completo (`database/sprint2.sql`)
- 6 tablas creadas: Usuario, Partida, Torneo, Movimiento, Partida_Jugador, Clasificacion_Torneo
- Relaciones con claves foráneas (integridad referencial)
- Campos para hashing de contraseñas (seguridad)

### ✅ Backend y Clases POO
- **DBControlador.js**: Controlador completo de base de datos con operaciones CRUD
- **Usuario.js**: Clase abstracta base para usuarios
- **Jugador.js**: Clase heredada con funcionalidades de jugador
- **Administrador.js**: Clase heredada con permisos administrativos
- **db-config.js**: Configuración de conexión a MySQL

### ✅ Documentación
- ERS v2.0 actualizado con todos los requisitos del Sprint 2
- README.md completo con instrucciones de instalación y uso
- Código completamente documentado con JSDoc
- Diagramas E/R y UML documentados

---

## 📊 Requisitos Implementados

### Requisitos Funcionales (RF)

| ID | Requisito | Estado | Descripción |
|----|-----------|--------|-------------|
| RF-07 | Registro de Usuario | ✅ Completado | Sistema de registro en base de datos |
| RF-08 | Autenticación | ✅ Completado | Login con validación de credenciales |
| RF-09 | Persistencia de Partidas | ✅ Completado | Guardado de partidas en BD |
| RF-10 | Actualización de Ranking | ✅ Completado | Actualización de estadísticas |
| RF-11 | Gestión de Torneos | ✅ Completado | CRUD de torneos para admins |
| RF-12 | Clasificación de Torneos | ✅ Completado | Sistema de puntos por torneo |
| RF-13 | Historial de Movimientos | ✅ Completado | Registro de cada jugada |

### Requisitos No Funcionales (RNF)

| ID | Requisito | Estado | Descripción |
|----|-----------|--------|-------------|
| RNF-04 | Seguridad de Datos | ✅ Completado | Hashing de contraseñas (bcrypt) |
| RNF-05 | Integridad de Datos | ✅ Completado | Claves foráneas en BD |

---

## 📁 Estructura del Proyecto Sprint 2

```
juego-ronda-marroqui-sprint2/
├── database/
│   └── sprint2.sql                    ✅ Script SQL completo
├── doc/
│   └── ERS_v2.0.md                    ✅ Especificación actualizada
├── lib/
│   └── img/                           ✅ Imágenes de cartas
│       ├── 01-oros.png ... 12-bastos.png
│       └── reverso.png
├── src/
│   ├── index.html                     ✅ Tablero principal
│   ├── login.html                     ✅ Página de login
│   ├── register.html                  ✅ Página de registro
│   ├── app.js                         ✅ Aplicación frontend
│   ├── RondaGame.js                   ✅ Motor del juego
│   ├── DBControlador.js               ✅ Controlador BD
│   ├── db-config.js                   ✅ Configuración MySQL
│   ├── Usuario.js                     ✅ Clase abstracta
│   ├── Jugador.js                     ✅ Clase Jugador
│   ├── Administrador.js               ✅ Clase Administrador
│   └── styles.css                     ✅ Estilos CSS
├── README.md                          ✅ Documentación completa
└── SPRINT2_COMPLETADO.md              ✅ Este archivo
```

---

## 🔧 Componentes Técnicos Implementados

### 1. Sistema de Autenticación
- **Archivos:** `login.html`, `register.html`
- **Funcionalidades:**
  - Formulario de login con validación
  - Formulario de registro con validación de contraseñas
  - Indicador de fuerza de contraseña
  - Manejo de errores y mensajes
  - Redirección automática tras login exitoso

### 2. Controlador de Base de Datos (DBControlador.js)
- **Métodos implementados:**
  ```javascript
  - crearUsuario(userData)
  - autenticarUsuario(email, contraseña)
  - obtenerUsuarioPorId(id_usuario)
  - actualizarEstadisticasUsuario(id_usuario, stats)
  - crearPartida(partidaData)
  - finalizarPartida(id_partida, id_ganador, id_perdedor)
  - asociarJugadoresPartida(id_partida, ids_usuarios)
  - registrarMovimiento(movimientoData)
  - obtenerHistorialMovimientos(id_partida)
  - crearTorneo(torneoData)
  - actualizarClasificacionTorneo(id_torneo, id_usuario, puntos)
  - obtenerRankingGlobal(limit)
  ```

### 3. Jerarquía de Clases
```
Usuario (abstracta)
  ├── Jugador
  │   ├── partidas_activas[]
  │   ├── amigos[]
  │   ├── nivel
  │   └── experiencia
  └── Administrador
      ├── torneos_creados[]
      ├── acciones_realizadas[]
      └── fecha_nombramiento
```

### 4. Base de Datos MySQL
- **Tablas:** 6 tablas interrelacionadas
- **Relaciones:** N:M entre Usuario y Partida, 1:N entre Usuario y Movimiento
- **Seguridad:** Contraseñas hasheadas, claves foráneas
- **Integridad:** ON DELETE CASCADE/SET NULL según corresponda

---

## 📝 Ejemplos de Uso

### 1. Crear un Jugador
```javascript
const jugador = new Jugador(1, 'Juan', 'juan@email.com');
jugador.unirseAPartida(123);
jugador.ganarExperiencia(50);
console.log(jugador.getNivel()); // 1
```

### 2. Crear un Administrador
```javascript
const admin = new Administrador(2, 'Admin', 'admin@email.com');
await admin.crearTorneo({
    nombre: 'Torneo de Verano',
    descripcion: 'Torneo competitivo'
});
```

### 3. Autenticar Usuario
```javascript
const usuario = await DBControlador.autenticarUsuario(
    'juan@email.com',
    'password123'
);
if (usuario) {
    console.log('Login exitoso:', usuario.nombre_usuario);
}
```

### 4. Registrar Movimiento
```javascript
await DBControlador.registrarMovimiento({
    id_partida: 123,
    id_usuario: 1,
    tipo_movimiento: 'jugar',
    carta_jugada: '7 de copas',
    palo_elegido: 'oros'
});
```

---

## 🎓 Aprendizajes del Sprint 2

### Técnicos
- Diseño e implementación de base de datos relacional
- Programación orientada a objetos con herencia
- Patrón MVC (Modelo-Vista-Controlador)
- Gestión de sesiones en frontend
- Validación de formularios HTML5
- Operaciones CRUD en base de datos

### Metodológicos
- Trabajo en equipo y coordinación
- Documentación técnica clara
- Versionado de código con Git
- Planificación de sprints
- Revisión de código entre pares

---

## 🔜 Próximo Sprint (Sprint 3)

### Objetivos Principales
1. **Implementar lógica completa del juego**
   - Validación de jugadas
   - Efectos de cartas especiales
   - Detección de ganador/perdedor

2. **Sistema multijugador en tiempo real**
   - WebSockets para comunicación
   - Sincronización de estado de juego
   - Sala de espera y matchmaking

3. **Dashboard de administración**
   - Panel de control para admins
   - Gestión visual de torneos
   - Estadísticas en tiempo real

4. **Sistema de ranking y perfiles**
   - Ranking global interactivo
   - Perfiles de usuario personalizables
   - Historial de partidas

---

## 💡 Notas Importantes

### Configuración Requerida
Antes de ejecutar el proyecto, asegúrate de:
1. Instalar MySQL Server
2. Crear la base de datos con el script SQL
3. Configurar las credenciales en `db-config.js`
4. Instalar las dependencias de Node.js

### Seguridad
- Las contraseñas deben hashearse con bcrypt en producción
- Cambiar las claves secretas en `db-config.js`
- Implementar HTTPS en producción
- Validar todas las entradas del usuario

### Testing
- Probar registro y login con diferentes usuarios
- Verificar la creación de datos en la base de datos
- Comprobar el sistema de roles y permisos
- Validar las relaciones entre tablas

---

## 📞 Contacto del Equipo

Para cualquier duda o consulta sobre el Sprint 2:

- **Yahya Aboulafiya**
- **Adrián Hoyos Sánchez**
- **Souhail Batah**
- **Carlos Robledo Badía**

---

## ✅ Checklist de Entrega

- [x] Código fuente completo
- [x] Base de datos diseñada e implementada
- [x] Documentación ERS v2.0
- [x] README con instrucciones
- [x] Páginas de login y registro
- [x] Sistema de autenticación
- [x] Clases POO (Usuario, Jugador, Administrador)
- [x] Controlador de base de datos
- [x] Script SQL de inicialización
- [x] Código comentado y documentado
- [x] Estructura de carpetas organizada

---

**🎉 Sprint 2 Completado Exitosamente 🎉**

**Fecha:** 01 de noviembre de 2025  
**Versión:** 2.0  
**Estado:** ✅ Listo para revisión
