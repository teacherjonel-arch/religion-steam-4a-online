# Expediente Bellemer — Página web para GitHub Pages

Juego de comprensión lectora basado en *El faro de la mujer ausente* de David Fernández Sifres, hasta la página 38. Dirigido a 22 alumnos con dos tablets y una laptop del docente.

## Publicar gratis en GitHub Pages

1. Inicia sesión en github.com y crea un repositorio **público** llamado `expediente-bellemer`.
2. Sube **index.html**, **styles.css** y **app.js** a la raíz del repositorio.
3. En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, branch **main**, carpeta **/(root)** y pulsa **Save**.
4. GitHub mostrará la URL de tu sitio cuando termine la publicación: `https://TUUSUARIO.github.io/expediente-bellemer/`.
5. Abre esa URL en tu laptop y en las dos tablets. Elige **Soy docente** en la laptop y crea una sala. En las tablets elige **Entrar como equipo**, introduce el código y selecciona equipo.

### Distribución
- Tablet 1: equipo 1 y luego equipo 3.
- Tablet 2: equipo 2 y luego equipo 4.
- Laptop: panel docente conectado durante toda la clase.

### Sobre la sincronización

GitHub Pages solo aloja archivos estáticos. Para comunicar las tablets con la laptop, el juego utiliza PeerJS mediante servidores públicos de conexión y WebRTC. La laptop actúa como anfitriona, mantiene la sala y guarda el progreso en **su navegador**. La conexión depende de los navegadores, la red y la disponibilidad del servidor público PeerJS; en algunas redes escolares puede estar bloqueada.

Si se recarga una tablet puede volver a entrar con el mismo código. La laptop debe permanecer con el juego abierto. Si se cierra la laptop o el navegador docente, las tablets dejan de guardar respuestas hasta que el docente vuelva a abrir la sala guardada. Los datos no se respaldan en la nube: usa siempre la misma laptop y navegador para retomar la sesión.

No se recopilan nombres ni cuentas de los estudiantes. El código de sala no es una contraseña de seguridad; úsalo solo dentro del contexto de aula y evita compartirlo públicamente.

### Puntuación

8 preguntas cerradas de 10 puntos cada una + 2 argumentos abiertos calificados por el docente (0–10 cada uno) = 100 puntos. Al pulsar **Revelar resultados** se muestra el marcador final y las alternativas correctas.

### Personalización

Las preguntas del libro están en `app.js`. Se pueden ajustar desde GitHub mediante la interfaz web; cada cambio del repositorio se publica de nuevo por GitHub Pages.
