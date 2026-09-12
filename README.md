# TI-89 Titanium (web)

Calculadora web inspirada en la [Texas Instruments TI-89 Titanium](https://en.wikipedia.org/wiki/TI-89_series). No es un producto oficial de TI.

**Sitio:** https://juaneorlandi.github.io/ti89-calculator/

## Qué hace

- Pantalla LCD y teclado al estilo TI-89 (2nd, ♦, α)
- Home: expresiones, historial, `ans`, variables (`5→a`)
- Y=, WINDOW, GRAPH (con TRACE) y TABLE
- Radianes / grados, fracciones exactas
- Teclado físico del computador además de las teclas en pantalla

## Cómo usarla

1. Pulsa **ON**.
2. Escribe `2+2` y **ENTER**.
3. En **Y=** deja `sin(x)`, pulsa **GRAPH**.
4. **F1** en gráfica activa TRACE; usa ◄ ►.

Ejemplos: `sqrt(2)^2`, `sin(pi)`, `5!`, `nCr(10,3)`, `2→a` luego `a^2`.

## Local

Abre `index.html` en el navegador, o:

```bash
python -m http.server 8080
```

Luego ve a http://localhost:8080

## Nota

Es un homenaje visual y funcional (aritmética, trig, gráficas 2D). No incluye el CAS simbólico completo de la calculadora original.
