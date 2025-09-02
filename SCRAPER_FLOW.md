# 🔄 Flow del Scraper de Competencia

## **Diagrama del Flujo Completo**

```mermaid
graph TD
    A[Usuario hace click en Competencia] --> B{¿Hay datos en DB?}
    B -->|No| C[Hacer scraping inicial]
    B -->|Sí| D{¿Han pasado X horas desde último scrape?}
    D -->|No| E[Mostrar datos existentes]
    D -->|Sí| F{¿ETag/Last-Modified cambiaron?}
    F -->|No| E
    F -->|Sí| G[Descargar nuevo contenido]
    G --> H[Extraer y parsear datos]
    H --> I[Calcular content hash]
    I --> J{¿Hash es diferente?}
    J -->|No| L[No hay cambios reales]
    J -->|Sí| M[Guardar nuevos datos en DB]
    M --> N[Mostrar datos actualizados]
    L --> E
    C --> M
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style M fill:#fff3e0
    style C fill:#ffcdd2
```

## **Explicación de Estados:**

- 🔵 **Azul**: Acción del usuario
- 🟢 **Verde**: Datos en cache (sin scraping)
- 🟠 **Naranja**: Nuevos datos guardados
- 🔴 **Rojo**: Scraping inicial forzado

## **Puntos Clave del Flow:**

1. **Cache Inteligente**: Solo se hace scraping cuando es necesario
2. **Detección de Cambios**: Múltiples mecanismos (ETag, Last-Modified, Content Hash)
3. **Eficiencia**: Evita scraping innecesario y respeta servidores
4. **Robustez**: Fallback a datos existentes si falla el scraping
5. **Transparencia**: Usuario siempre ve datos, aunque sean del cache

---

**Ver README completo**: [COMPETITORS_SCRAPER_README.md](./COMPETITORS_SCRAPER_README.md)
