class SocketClient {
    constructor() {
        this.socket = null;
        this.partidaActual = null;
        this.usuarioActual = null;
        this.debug = false;
        this.callbacks = {
            onJugadorUnido: null,
            onCartaJugada: null,
            onCartaRobada: null,
            onPartidaFinalizada: null,
            onEstadoPartida: null,
            onError: null
        };
    }

    _isDebugEnabled() {
        if (this.debug) return true;
        if (typeof window === 'undefined') return false;
        if (window.__DEBUG_SOCKET__ === true) return true;
        try {
            return window.localStorage && window.localStorage.getItem('debug_socket') === '1';
        } catch {
            return false;
        }
    }

    _log(...args) {
        if (!this._isDebugEnabled()) return;
        console.log(...args);
    }

    _warn(...args) {
        if (!this._isDebugEnabled()) return;
        console.warn(...args);
    }

    _error(...args) {
        console.error(...args);
    }

    conectar() {
        if (this.socket && this.socket.connected) {
            this._warn('Ya hay una conexión activa');
            return;
        }

        const baseUrl = (typeof window !== 'undefined' && window.location)
            ? window.location.origin
            : 'http://localhost:3002';

        if (typeof io === 'undefined') {
            this._error('No se encontró la librería de Socket.IO en el cliente');
            if (this.callbacks.onError) {
                this.callbacks.onError({ message: 'No se pudo iniciar la conexión WebSocket' });
            }
            return;
        }

        this.socket = io(baseUrl, {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            this._log('Conectado al servidor WebSocket', this.socket.id);
            if (this.partidaActual && this.usuarioActual) {
                this.socket.emit('unirsePartida', {
                    id_partida: this.partidaActual,
                    id_usuario: this.usuarioActual.id_usuario,
                    nombre_usuario: this.usuarioActual.nombre_usuario
                });
            }
        });

        this.socket.on('disconnect', () => {
            this._warn('Desconectado del servidor WebSocket');
        });

        this._registrarEventos();
    }

    _registrarEventos() {
        this.socket.on('jugadorUnido', (data) => {
            this._log('Jugador unido', data && data.nombre_usuario);
            if (this.callbacks.onJugadorUnido) {
                this.callbacks.onJugadorUnido(data);
            }
        });

        this.socket.on('cartaJugada', (data) => {
            this._log('Carta jugada', data && data.id_usuario);
            if (this.callbacks.onCartaJugada) {
                this.callbacks.onCartaJugada(data);
            }
        });

        this.socket.on('cartaRobada', (data) => {
            this._log('Carta robada', data && data.id_usuario);
            if (this.callbacks.onCartaRobada) {
                this.callbacks.onCartaRobada(data);
            }
        });

        this.socket.on('partidaFinalizada', (data) => {
            this._log('Partida finalizada', data);
            if (this.callbacks.onPartidaFinalizada) {
                this.callbacks.onPartidaFinalizada(data);
            }
        });

        this.socket.on('estadoPartida', (data) => {
            this._log('Estado de partida recibido');
            if (this.callbacks.onEstadoPartida) {
                this.callbacks.onEstadoPartida(data);
            }
        });

        const handleError = (data) => {
            const message = data && data.message ? String(data.message) : 'Error';
            this._error(message);
            if (this.callbacks.onError) {
                this.callbacks.onError({ message });
            }
        };

        this.socket.on('serverError', handleError);
        this.socket.on('error', handleError);
    }

    unirsePartida(id_partida, id_usuario, nombre_usuario) {
        this.partidaActual = id_partida;
        this.usuarioActual = { id_usuario, nombre_usuario };

        if (!this.socket) {
            this.conectar();
        }

        if (!this.socket || !this.socket.connected) {
            this._warn('No hay conexión activa, se unirá al conectar');
            return;
        }

        this.socket.emit('unirsePartida', {
            id_partida,
            id_usuario,
            nombre_usuario
        });

        this._log('Uniéndose a partida', id_partida);
    }

    jugarCarta(carta_jugada, palo_elegido = null) {
        if (!this.partidaActual || !this.usuarioActual) {
            this._error('No estás en una partida');
            return;
        }

        this.socket.emit('jugarCarta', {
            id_partida: this.partidaActual,
            id_usuario: this.usuarioActual.id_usuario,
            carta_jugada,
            palo_elegido
        });

        this._log('Jugando carta', carta_jugada);
    }

    robarCarta() {
        if (!this.partidaActual || !this.usuarioActual) {
            this._error('No estás en una partida');
            return;
        }

        this.socket.emit('robarCarta', {
            id_partida: this.partidaActual,
            id_usuario: this.usuarioActual.id_usuario
        });

        this._log('Robando carta');
    }

    onJugadorUnido(callback) {
        this.callbacks.onJugadorUnido = callback;
    }

    onCartaJugada(callback) {
        this.callbacks.onCartaJugada = callback;
    }

    onCartaRobada(callback) {
        this.callbacks.onCartaRobada = callback;
    }

    onPartidaFinalizada(callback) {
        this.callbacks.onPartidaFinalizada = callback;
    }

    onEstadoPartida(callback) {
        this.callbacks.onEstadoPartida = callback;
    }

    onError(callback) {
        this.callbacks.onError = callback;
    }

    desconectar() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.partidaActual = null;
            this.usuarioActual = null;
            this._warn('Desconectado del servidor');
        }
    }

    estaConectado() {
        return this.socket && this.socket.connected;
    }
}

const socketClient = new SocketClient();

if (typeof window !== 'undefined') {
    window.socketClient = socketClient;
}
