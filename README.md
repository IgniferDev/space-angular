# 🚀 **Space Invaders Educativo — Versión Extendida (v.1.0 Pre-Release)**

<p align="center">
  <img src="https://i.imgur.com/Vp1l54z.png" width="260" alt="Logo Space Invaders Retro">
</p>

**Una reinvención moderna del clásico arcade, ahora convertido en una herramienta educativa interactiva para aprender mientras disparas, esquivas y compites.**
💥 *Matemáticas + Historia + Duelos 1v1 + Sonido retro + Fullscreen por jugador*.

---

## 🌐 **Demo en Vivo**

*Link del proyecto*

👉 **[https://tu-link-aqui.com/space-edu/](https://tu-link-aqui.com/space-edu/)**

---

# 🎮 **¿Qué es Space Invaders Educativo?**

Una experiencia **gamificada** donde cada enemigo trae una **pregunta**, cada disparo es una **respuesta**, y cada ronda es una batalla entre tu mente y tus reflejos.

Diseñado para:

* 🧠 Aprender matemáticas e historia de forma dinámica
* 🏆 Competir en modo 1v1 con pantallas separadas
* 🏫 Usarse en escuelas, clubes o actividades recreativas
* 💻 Mostrar un ejemplo moderno de juego web sin frameworks

Todo funcionando en **JavaScript puro**, sin motores externos.

---

# 🔥 **Características Principales (v.1.0)**

### 🎯 **Modo Educativo Interactivo**

Incluye dos bancos completos:

* 📐 Matemáticas (sumas, restas, problemas rápidos)
* 🏺 Historia (general, antigua, mexicana)

Se pueden añadir más con facilidad.

---

### 🎮 **Modo Competitivo para 2 Jugadores**

Lo más destacado:

* Cada jugador tiene **su propio canvas**, su HUD y sus controles.
* Los enemigos, balas, rondas y preguntas son **totalmente independientes**.
* Sistema de puntajes para enfrentamientos 1v1.

🔥 *Lo más cercano a un “duelo académico retro”.*

---

### 🔊 **Sonido Integrado**

Sistema de audio con fade suave:

* Música retro looping
* Disparo
* Explosión
* Respuesta correcta
* Respuesta incorrecta

Sin cortes, clics o errores de autoplay.

---

### 🖥 **Pantalla Completa por Jugador**

Cada pantalla tiene su botón ⛶:

* Fullscreen individual
* Ultra inmersivo
* Perfecto para torneos y proyecciones

---

### 📊 **Leaderboard Local Avanzado**

Con guardado automático:

* Puntaje máximo
* Preguntas respondidas
* Precisión
* Fecha / modo

Se muestra desde el menú principal.

---

### 🛠 **Controles Totalmente Editables**

Desde un menú dedicado:

* Teclas
* Sensibilidad
* Gamepad
* Remapeo instantáneo

Ideal para personalización.

---

### ⚡ **Gameplay Moderno (pero con alma retro)**

* 60 FPS con `requestAnimationFrame()`
* Colisiones
* Progresión de dificultad
* Poderes especiales
* Rondas rápidas y de agilidad

---

# 🧩 **Próximas Funcionalidades (Roadmap)**

1. 🎨 Nueva skins para naves
2. 👾 Enemigos únicos según categoría
3. 🧠 Modo “Examen Rápido”
4. 🌎 Más Bancos: Biología, Geografía, Inglés
5. 🔗 Online 1v1 (versión experimental futura)

---

# 🛠 **Tecnologías Utilizadas**

* **Angular v.19**
* HTML5 Canvas (2 instancias simultáneas)
* CSS3 (estilo retro-neón suave)
* LocalStorage para persistencia
* Audio API nativa
* Arquitectura modular

---

# 📂 **Estructura del Proyecto**

```
assets/game/
 ├── index-embed.html      # Página HTML integrable
 ├── main.js               # Motor completo del juego (optimizado)
 ├── style.css             # Estilos visuales del arcade
 ├── img/                  # Sprites del juego
 └── audio/
      ├── music.wav
      ├── shoot.wav
      ├── explosion.wav
      ├── correct.wav
      └── wrong.wav
```

---

# 💡 **Cómo Ejecutar (cualquier proyecto)**

### 🔹 Opción 1 — Como HTML standalone

Solo abre:

```
assets/game/index-embed.html
```

### 🔹 Opción 2 — Integración en Angular

Colócalo dentro de:

```
src/assets/game/
```

Y crea un `<iframe>` o incrústalo en un componente.

---

# ⌨️ **Controles por Defecto**

### 👤 Jugador 1

| Acción   | Tecla |
| -------- | ----- |
| Mover    | ← →   |
| Apuntar  | ↑ ↓   |
| Disparar | SPACE |
| Poder    | E     |

### 👤 Jugador 2

| Acción   | Tecla |
| -------- | ----- |
| Mover    | A D   |
| Apuntar  | W S   |
| Disparar | F     |
| Poder    | G     |

> Todos reconfigurables.

---

# 🧪 **Probado en**

* Chrome
* Edge
* Firefox
* Desktop y laptops
* Modo fullscreen dual

---

# 🙌 **Contribuciones**

Si quieres agregar:

* Nuevos bancos de preguntas
* Nuevos modos
* Nuevos sprites
* Traducciones
* Música / FX retro

¡Eres bienvenido!
Abre un **Issue** o un **Pull Request**.

---

# 👤 **Autores*

Proyecto desarrollado por:

Fernando Morales Cilia

Gerson Emmanuel Contreras González

Pablo Iván Ibarra Valencia

Bernardo Palacios Caballero

Mejorado en conjunto con asistencia técnica de IA avanzada.
Hecho con ❤️ para la educación + el gaming retro.

---
