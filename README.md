# Religion STEAM 4.º A — Online (2–4 jugadores)

Versión corregida para GitHub + Render.

## Archivos
- `public/index.html` — juego y cliente online.
- `server.js` — servidor HTTP + WebSocket.
- `package.json` — dependencia `ws` y comando de inicio.
- `render.yaml` — configuración para Render.

## Corrección principal
La sincronización online usa ahora el estado compartido correctamente, sin anidarlo dos veces. Al iniciar la partida, todos reciben una base común y cada cambio guardado se transmite a los demás jugadores.

## GitHub
Reemplaza en el repositorio existente:
- `public/index.html`
- `server.js`

No es necesario volver a crear el repositorio.

## Render
Después de actualizar GitHub, Render debe desplegar el nuevo commit. Si no lo hace automáticamente, usa **Manual Deploy → Deploy latest commit**.

Comandos:
- Build: `npm install`
- Start: `npm start`
