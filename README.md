# Message-App-Angel

App de mensajería. React + Vite, Express, PostgreSQL. Sin real-time: el cliente refresca por polling.

## Arrancar

Necesitas PostgreSQL corriendo en `localhost:5432`.

```bash
cd server
cp .env.example .env      # pon aquí tu contraseña de Postgres y un JWT_SECRET propio
npm install
npm run migrate           # crea la base message_app y aplica el esquema
npm run dev               # API en http://localhost:4000
```

```bash
cd client
cp .env.example .env
npm install
npm run dev               # UI en http://localhost:5173
```

Los dos procesos tienen que estar corriendo a la vez.

## Qué hace

- Registro, login y sesión con JWT en cookie httpOnly.
- Chats directos y grupos sobre la misma estructura: `conversations` + `conversation_members` + `messages`.
- Imágenes en mensajes y avatar de perfil, guardadas en disco y servidas desde `/uploads`.
- Perfil editable: nombre visible, bio y avatar.
- Amigos con solicitudes, e indicador de en línea según actividad de los últimos 2 minutos.
- Contador de mensajes sin leer por conversación.
- Tema claro y oscuro, siguiendo al sistema por defecto.

## Estructura

```
server/src/routes/   auth, users, conversations, messages, friends
server/src/schema.sql   esquema completo, re-ejecutable
client/src/pages/    Login, Register, Chat, Profile
client/src/components/  lista de chats, hilo, composer, amigos, tarjeta de vidrio
```
