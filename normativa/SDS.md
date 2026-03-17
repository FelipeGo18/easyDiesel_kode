# Contenido {#contenido .TOC-Heading}

[1. Introducción [1](#_Toc657078091)](#_Toc657078091)

[1.1 Objetivo [2](#objetivo)](#objetivo)

[1.2 Alcance [2](#alcance)](#alcance)

[1.3 Definiciones y Abreviaturas
[2](#definiciones-y-abreviaturas)](#definiciones-y-abreviaturas)

[2. Generalidades del proyecto
[2](#generalidades-del-proyecto)](#generalidades-del-proyecto)

[2.1 Problema a resolver
[2](#problema-a-resolver)](#problema-a-resolver)

[2.2 Principales retos de diseño
[4](#principales-retos-de-diseño)](#principales-retos-de-diseño)

[2.3 Análisis del diseño conceptual inicial (Estrategia)
[5](#análisis-del-diseño-conceptual-inicial-estrategia)](#análisis-del-diseño-conceptual-inicial-estrategia)

[2.4 Estándares de diseño
[6](#estándares-de-diseño)](#estándares-de-diseño)

[3. Arquitectura de software
[6](#arquitectura-de-software)](#arquitectura-de-software)

[3.1 Estilo de arquitectura
[6](#estilo-de-arquitectura)](#estilo-de-arquitectura)

[3.2 Vistas de arquitectura
[12](#vistas-de-arquitectura)](#vistas-de-arquitectura)

[- Vista de contexto (Entradas, salidas, medio)
[12](#vista-de-contexto-entradas-salidas-medio)](#vista-de-contexto-entradas-salidas-medio)

[- Vista funcional (componentes responsables de realizar los casos de
uso)
[14](#vista-funcional-componentes-responsables-de-realizar-los-casos-de-uso)](#vista-funcional-componentes-responsables-de-realizar-los-casos-de-uso)

[- Vista de información (flujos de datos, ciclo de vida, modelos
estáticos) [17](#section)](#section)

[- Vista de desarrollo [24](#vista-de-desarrollo)](#vista-de-desarrollo)

[- Vista operacional (Describe acciones externas que se deben realizar
para permitir el funcionamiento normal de la aplicación)
[31](#vista-operacional-describe-acciones-externas-que-se-deben-realizar-para-permitir-el-funcionamiento-normal-de-la-aplicación)](#vista-operacional-describe-acciones-externas-que-se-deben-realizar-para-permitir-el-funcionamiento-normal-de-la-aplicación)

[3.3 Decisiones de arquitectura (Ciclo 2)
[33](#decisiones-de-arquitectura-ciclo-2)](#decisiones-de-arquitectura-ciclo-2)

[4. Diseño detallado de software
[33](#diseño-detallado-de-software)](#diseño-detallado-de-software)

[4.1 Modelo detallado de clases
[33](#modelo-detallado-de-clases)](#modelo-detallado-de-clases)

[4.2 Modelo de interfaces
[34](#modelo-de-interfaces)](#modelo-de-interfaces)

[4.3 Modelo de datos (EJB)
[37](#modelo-de-datos-ejb)](#modelo-de-datos-ejb)

[]{#_Toc657078091 .anchor}**1. Introducción**

El presente documento constituye la Especificación de Diseño de Software
(SDS) de la plataforma EasyDiesel, un sistema tecnológico orientado a la
gestión centralizada de operaciones relacionadas con la distribución y
comercialización de combustibles en Colombia.

Este documento recoge las decisiones arquitectónicas, los modelos de
diseño y las especificaciones técnicas que guían el desarrollo de la
solución, sirviendo como referencia para el equipo de ingeniería,
auditores y partes interesadas del proyecto

## 1.1 Objetivo

El objetivo principal de este documento es describir de manera precisa y
estructurada el diseño arquitectónico y técnico de la plataforma
EasyDiesel, garantizando que todos los miembros del equipo de desarrollo
y las partes interesadas cuenten con una referencia unificada sobre la
solución propuesta.

De manera específica, este documento busca:

1.  Definir la arquitectura de software seleccionada y justificar las
    decisiones de diseño adoptadas.

2.  Establecer los componentes, módulos e interfaces que conforman la
    plataforma.

3.  Documentar los modelos de datos, flujos de información y vistas de
    arquitectura necesarias para comprender el sistema de manera
    integral.

4.  Garantizar la trazabilidad entre los requisitos del negocio y los
    elementos de diseño técnico implementados.

5.  Servir como base para la validación, pruebas e integración de los
    distintos componentes del sistema.

## 1.2 Alcance

La plataforma EasyDiesel abarca el diseño e implementación de un sistema
web orientado a la gestión centralizada del ciclo operativo del
combustible en Colombia, integrando a los actores clave del sector:
estaciones de servicio, distribuidores mayoristas, entes reguladores y
usuarios ciudadanos.

En términos de alcance funcional, el sistema contempla:

1.  Gestión de identidad y control de acceso basado en roles (RBAC)
    mediante autenticación JWT y Google OAuth 2.0.

2.  Registro y control de inventarios de combustible (ACPM y gasolina)
    en estaciones de servicio.

3.  Administración de precios por zona geográfica con aplicación
    automática de normativas vigentes (Decreto 1428 y 763).

4.  Motor de reglas normativas que garantiza el cumplimiento regulatorio
    en tiempo de ejecución.

5.  Módulo de auditoría con registro inmutable de todas las operaciones
    del sistema.

6.  Generación y exportación de reportes oficiales en formatos PDF y
    Excel.

7.  Dashboard interactivo con visualización geográfica de estaciones y
    precios mediante integración con Google Maps JavaScript API.

En términos de alcance técnico, el diseño cubre:

8.  Arquitectura de tres capas (3-Tier): presentación (React SPA),
    lógica de negocio (Node.js + Express) y datos (PostgreSQL vía Prisma
    ORM).

9.  Despliegue en infraestructura de nube gestionada: Vercel (frontend),
    Railway (backend) y Supabase (base de datos).

10. Integración con servicios externos: Google OAuth 2.0 y Google Maps
    JavaScript API.

Quedan fuera del alcance de este documento:

11. La implementación de aplicaciones móviles nativas.

12. La integración directa con sistemas SCADA o sensores físicos de
    medición de combustible.

Módulos de facturación electrónica ante la DIAN

## 1.3 Definiciones y Abreviaturas

La siguiente tabla recoge los términos técnicos, siglas y abreviaturas
utilizados a lo largo del presente documento:

  -----------------------------------------------------------------------
  **Término /        **Definición**
  Abreviatura**      
  ------------------ ----------------------------------------------------
  **SDS**            Software Design Specification --- Especificación de
                     Diseño de Software. Documento formal que describe la
                     arquitectura, componentes y decisiones de diseño de
                     un sistema.

  **API**            Application Programming Interface --- Interfaz de
                     Programación de Aplicaciones. Conjunto de
                     definiciones y protocolos para la comunicación entre
                     sistemas de software.

  **REST**           Representational State Transfer --- Estilo
                     arquitectónico para el diseño de servicios web
                     basado en el protocolo HTTP.

  **SPA**            Single Page Application --- Aplicación de página
                     única. Tipo de aplicación web que carga una sola
                     página HTML y actualiza el contenido dinámicamente.

  **JWT**            JSON Web Token --- Estándar abierto (RFC 7519) que
                     define una forma compacta y autocontenida de
                     transmitir información entre partes como un objeto
                     JSON firmado.

  **ORM**            Object-Relational Mapping --- Técnica de
                     programación que permite convertir datos entre el
                     sistema de tipos de un lenguaje de programación y
                     una base de datos relacional.

  **RBAC**           Role-Based Access Control --- Control de acceso
                     basado en roles. Modelo de seguridad que restringe
                     el acceso a funcionalidades según el rol del
                     usuario.

  **MVCC**           Multi-Version Concurrency Control --- Control de
                     concurrencia multiversión. Mecanismo de PostgreSQL
                     para gestionar transacciones simultáneas sin
                     bloqueos.

  **ACID**           Atomicity, Consistency, Isolation, Durability ---
                     Propiedades que garantizan la fiabilidad de las
                     transacciones en bases de datos.

  **CDN**            Content Delivery Network --- Red de entrega de
                     contenido. Infraestructura distribuida que mejora la
                     velocidad de entrega de activos estáticos.

  **PaaS**           Platform as a Service --- Plataforma como Servicio.
                     Modelo de nube que provee entornos de desarrollo y
                     despliegue gestionados.

  **DBaaS**          Database as a Service --- Base de datos como
                     Servicio. Modelo de nube para el aprovisionamiento y
                     gestión de bases de datos.

  **ACPM**           Aceite Combustible Para Motores --- Denominación
                     colombiana del combustible diésel.

  **EasyDiesel**     Nombre comercial de la plataforma tecnológica objeto
                     de este documento.

  **M1 -- M8**       Nomenclatura utilizada para referenciar los ocho
                     módulos funcionales del sistema EasyDiesel.

  **Decreto 1428**   Normativa colombiana que regula los mecanismos de
                     estabilización de precios de combustibles.

  **PgBouncer**      Connection pooler para PostgreSQL que optimiza la
                     gestión de conexiones concurrentes a la base de
                     datos.

  **Prisma**         ORM moderno para Node.js y TypeScript que facilita
                     el acceso y manipulación de bases de datos
                     relacionales.

  **Vercel**         Plataforma de despliegue en la nube optimizada para
                     aplicaciones frontend y Jamstack.

  **Railway**        Plataforma de despliegue en la nube para
                     aplicaciones backend y servicios de API.

  **Supabase**       Plataforma de base de datos como servicio basada en
                     PostgreSQL con soporte para autenticación y
                     almacenamiento.
  -----------------------------------------------------------------------

# 2. Generalidades del proyecto

## 2.1 Problema a resolver

El sector de distribución y comercialización de combustibles en Colombia
se encuentra regulado por diferentes decretos y normativas que
establecen reglas específicas para la fijación de precios, la gestión de
inventarios y el control de transacciones de combustible. Entre estas
regulaciones se encuentran disposiciones que establecen mecanismos
diferenciales de estabilización de precios y esquemas de subsidio según
el tipo de vehículo o modalidad de transporte.

En la actualidad, muchas de las operaciones relacionadas con el manejo
de combustibles, como el control de inventarios, la gestión de precios
por zona y el registro de transacciones entre distribuidores y
estaciones de servicio, se realizan mediante sistemas fragmentados o
procesos manuales. Esto dificulta el control normativo, la trazabilidad
de las operaciones y la generación de reportes confiables para las
entidades reguladoras.

Adicionalmente, la existencia de diferentes actores dentro del
ecosistema del combustible ---como estaciones de servicio,
distribuidores, autoridades reguladoras y usuarios finales--- genera la
necesidad de contar con una plataforma que permita centralizar la
información y facilitar la interacción entre ellos.

Ante esta situación surge la necesidad de desarrollar una plataforma
tecnológica que permita gestionar de forma centralizada la información
relacionada con combustibles, automatizar la aplicación de las
normativas vigentes y garantizar la trazabilidad de las operaciones
realizadas dentro del sistema.

## 2.2 Principales retos de diseño

El desarrollo de una plataforma de gestión de combustibles presenta
diversos retos técnicos y funcionales que deben ser considerados durante
el diseño del sistema.

Uno de los principales retos es garantizar el cumplimiento automático de
las normativas vigentes, ya que el sistema debe ser capaz de aplicar
correctamente los decretos y regulaciones relacionadas con precios,
subsidios y zonas de distribución de combustibles. Esto implica que el
sistema debe incorporar mecanismos de validación y reglas que permitan
calcular precios y condiciones de operación según las disposiciones
legales aplicables.

Otro reto importante es el manejo de grandes volúmenes de información
asociados a inventarios y transacciones, dado que el sistema debe
registrar entradas y salidas de combustible, movimientos entre
distribuidores y estaciones de servicio, así como información
relacionada con precios y zonas geográficas.

Asimismo, el sistema debe garantizar la trazabilidad completa de las
operaciones, permitiendo registrar quién realiza cada acción, cuándo se
ejecuta y bajo qué condiciones normativas se realiza. Esto es
especialmente importante para auditorías y procesos de control por parte
de las autoridades regulatorias.

Finalmente, el diseño del sistema debe contemplar la integración entre
múltiples actores y sistemas externos, lo cual puede incluir la
comunicación con sistemas de facturación, sensores de medición de
combustible o plataformas de monitoreo logístico.

## 2.3 Análisis del diseño conceptual inicial (Estrategia)

El desarrollo de una plataforma de gestión de combustibles presenta
diversos retos técnicos y funcionales que deben ser considerados durante
el diseño del sistema.

Uno de los principales retos es garantizar el cumplimiento automático de
las normativas vigentes, ya que el sistema debe ser capaz de aplicar
correctamente los decretos y regulaciones relacionadas con precios,
subsidios y zonas de distribución de combustibles. Esto implica que el
sistema debe incorporar mecanismos de validación y reglas que permitan
calcular precios y condiciones de operación según las disposiciones
legales aplicables.

Otro reto importante es el manejo de grandes volúmenes de información
asociados a inventarios y transacciones, dado que el sistema debe
registrar entradas y salidas de combustible, movimientos entre
distribuidores y estaciones de servicio, así como información
relacionada con precios y zonas geográficas.

Asimismo, el sistema debe garantizar la trazabilidad completa de las
operaciones, permitiendo registrar quién realiza cada acción, cuándo se
ejecuta y bajo qué condiciones normativas se realiza. Esto es
especialmente importante para auditorías y procesos de control por parte
de las autoridades regulatorias.

Finalmente, el diseño del sistema debe contemplar la integración entre
múltiples actores y sistemas externos, lo cual puede incluir la
comunicación con sistemas de facturación, sensores de medición de
combustible o plataformas de monitoreo logístico.

**Punto de partida: identificación de patrones del dominio** 

Durante el análisis preliminar se identificaron tres patrones dominantes
en el sector de combustibles que condicionaron las decisiones de
diseño: 

1.  Multiactor con perfiles diferenciados: el sistema atiende
    simultáneamente a ciudadanos, operadores de estaciones,
    distribuidores, reguladores y administradores, cada uno con vistas y
    permisos radicalmente distintos. Esto descartó de entrada una
    arquitectura monolítica con una única interfaz genérica. 

```{=html}
<!-- -->
```
2.  Alta carga normativa: las reglas de precio, subsidio y zona no son
    estáticas; dependen de decretos que pueden actualizarse. El diseño
    debía separar las reglas de negocio en un módulo independiente (M5
    -- Normativa) para evitar que los cambios regulatorios obligaran a
    modificar la lógica de otros módulos. 

```{=html}
<!-- -->
```
3.  Exigencia de trazabilidad total: al tratarse de un sistema de
    control de combustibles regulado, toda operación debe quedar
    registrada de forma inmutable. Esto orientó la decisión de
    incorporar un módulo de auditoría (M7) transversal a todos los
    demás. 

**Estrategia arquitectónica adoptada** 

Con base en los patrones identificados, se adoptó una estrategia de
arquitectura híbrida con tres pilares: 

4.  Separación estricta de capas (3-Tier): la división Presentación /
    Lógica de negocio / Datos permite escalar cada capa de forma
    independiente y facilita la incorporación de nuevos módulos sin
    afectar las capas adyacentes. 

```{=html}
<!-- -->
```
5.  Diseño orientado a contratos de interfaz (API-First):
    el backend expone sus capacidades mediante una API REST documentada,
    lo que desacopla el frontend del backend y permitiría en el futuro
    incorporar clientes móviles o integraciones de terceros sin
    modificar la lógica de servidor. 

```{=html}
<!-- -->
```
6.  Delegación de servicios especializados a plataformas externas: en
    lugar de desarrollar infraestructura propia para identidad o
    cartografía, se integraron Google OAuth 2.0 y Google Maps JavaScript
    API, reduciendo el tiempo de desarrollo y aprovechando soluciones
    probadas en producción. 

**Decisiones de diseño tempranas y su justificación** 

  --------------------------------------------------------------------------------
  **Decisión de diseño**       Justificación 
  ---------------------------- ---------------------------------------------------
  **React como SPA para        Permite actualizar vistas parciales sin recargar la
  el frontend**                página completa, crucial para el dashboard en
                               tiempo real y el mapa de estaciones. 

  **Node.js + Express como API Modelo de I/O no bloqueante adecuado para un
  REST**                       sistema con múltiples peticiones concurrentes de
                               diferentes tipos de usuario. 

  **PostgreSQL como motor      Garantía de integridad referencial y soporte nativo
  relacional**                 de MVCC para operaciones concurrentes de
                               lectura/escritura sobre inventarios y precios. 

  **Prisma como ORM**          Abstrae las consultas SQL y genera
                               migraciones tipadas, reduciendo errores de esquema
                               en un modelo de datos complejo con múltiples
                               entidades relacionadas. 

  **JWT para                   Permite que múltiples instancias
  autenticación stateless**    del backend validen tokens sin compartir estado de
                               sesión, facilitando la escalabilidad horizontal
                               futura. 
  --------------------------------------------------------------------------------

  

**Validación del diseño conceptual** 

El diseño conceptual fue validado informalmente mediante los siguientes
criterios: 

1.  Cobertura de casos de uso: todos los flujos principales
    identificados en el SRS pudieron mapearse a al menos un módulo
    (M1--M8) sin solapamientos de responsabilidad. 

```{=html}
<!-- -->
```
2.  Cumplimiento de atributos de calidad: la arquitectura seleccionada
    responde a los requisitos de seguridad (HTTPS, JWT, bcrypt),
    disponibilidad (PaaS gestionado con reinicios automáticos) y
    trazabilidad (log inmutable en M7). 

```{=html}
<!-- -->
```
3.  Viabilidad de implementación: el stack tecnológico seleccionado
    (React, Node.js, PostgreSQL) es dominado por el equipo de desarrollo
    y cuenta con amplia documentación y comunidad de soporte. 

 

 

## 2.4 Estándares de diseño

Para el desarrollo de la plataforma se adoptarán diferentes principios y
estándares de diseño que permitan garantizar la calidad, mantenibilidad
y escalabilidad del software.

En primer lugar, se aplicará una arquitectura modular, donde cada
componente del sistema se encargue de una responsabilidad específica.
Esto permite separar claramente las funciones del sistema y facilita
futuras modificaciones o ampliaciones.

Asimismo, se utilizarán interfaces de comunicación basadas en servicios
web, permitiendo que los diferentes módulos del sistema interactúen
mediante APIs que faciliten el intercambio de información entre los
componentes de la plataforma.

En cuanto al almacenamiento de la información, se utilizará un modelo de
base de datos estructurado, que permita registrar entidades como
usuarios, estaciones de servicio, distribuidores, inventarios y
transacciones de combustible, garantizando la consistencia y
trazabilidad de los datos.

Finalmente, el sistema incorporará mecanismos de seguridad,
autenticación y auditoría, con el objetivo de garantizar que cada
operación realizada dentro del sistema quede registrada y pueda ser
consultada posteriormente para efectos de control, análisis o
cumplimiento normativo.

# 3. Arquitectura de software

## 3.1 Estilo de arquitectura

La arquitectura de la aplicación Easy Diesel no se adhiere de forma
estricta a un único paradigma, sino que combina y capitaliza los
beneficios de múltiples estilos arquitectónicos modernos. Esta decisión
permite estructurar el sistema de una forma escalable, mantenible y
segura. Principalmente, el diseño del sistema se fundamenta en los
siguientes estilos arquitectónicos:

**1. Arquitectura Cliente-Servidor y Modelo de 3 Niveles (3-Tier)**

A nivel global, la plataforma opera bajo un esquema tradicional
Cliente-Servidor, dividiendo lógicamente la carga de procesamiento entre
los clientes que solicitan recursos y el servidor que los provee. Esta
distribución general se formaliza mediante una Arquitectura de 3 Niveles
(3-Tier), separando de manera estricta las áreas de responsabilidad
tecnológica:

-   Capa de Presentación (Frontend - Tier 1): Compuesta por la Interfaz
    de Usuario (UI) desarrollada en React, la cual se ejecuta en el
    navegador del cliente. Es responsable exclusiva de la vista y de la
    interacción con el usuario final.

-   Capa de Lógica de Negocio (Backend - Tier 2): Implementada como una
    API RESTful desarrollada en el entorno Node.js mediante el framework
    Express. Esta capa intermedia centraliza el procesamiento de datos,
    las reglas del negocio, la seguridad y la orquestación de las
    peticiones.

-   Capa de Datos (Tier 3): Constituida por el motor de base de datos
    relacional PostgreSQL, cuyo acceso y manipulación se realiza a
    través de las abstracciones provistas por el ORM Prisma.

![](media/image1.png){width="6.0in" height="5.82711832895888in"}

**2. Arquitectura en Capas (Layered Architecture)**

A nivel interno del servidor (Backend), la lógica se organiza basándose
en un estricto Estilo en Capas. Esta segmentación asegura el principio
de responsabilidad única (Single Responsibility Principle) e impone un
flujo de control unidireccional para el procesamiento de las solicitudes
entrantes:

-   Capa de Enrutamiento (routes/): Define los \"endpoints\" de la API y
    canaliza las peticiones entrantes vía HTTP.

-   Capa de Controladores (controllers/): Actúa como el orquestador
    principal de la solicitud, apoyándose en la subcapa de Validadores
    (validators/) para asegurar la integridad de los datos de entrada
    antes de proceder.

-   Capa de Servicios (services/): Encapsula y centraliza toda la lógica
    de negocio estricta del sistema. Los controladores delegan en estos
    servicios la ejecución de los algoritmos y cálculos requeridos.

-   Capa de Acceso a Datos / Infraestructura: delegada íntegramente al
    uso de Prisma (ORM), facilitando las interacciones persistentes de
    forma segura y optimizada.

![](media/image2.png){width="6.0in" height="7.814569116360455in"}

**3. Arquitectura Basada en Componentes (Component-Based)**

En lo que concierne al Frontend, la aplicación adopta un Estilo Basado
en Componentes. Gracias a la tecnología React, la interfaz de usuario se
conceptualiza y construye separando la vista en bloques lógicos,
encapsulados e independientes (componentes). Este enfoque favorece de
manera directa la alta reutilización de código (DRY - *Don\'t Repeat
Yourself*), simplifica el mantenimiento ágil y mejora la cohesión y
consistencia visual a lo largo de toda la plataforma.

![](media/image3.png){width="6.0in" height="2.3593208661417324in"}

**Conclusión Arquitectónica**

El despliegue tecnológico de Easy Diesel constituye conceptualmente un
sistema global bajo las directrices Cliente-Servidor / 3-Tier, soportado
lógicamente por un servidor backend robusto con diseño interno En Capas
(Layered), que asiste a una interfaz de cliente altamente interactiva
estructurada Basada en Componentes.

## 3.2 Vistas de arquitectura

###  - Vista de contexto (Entradas, salidas, medio)

**1. Actores y Entorno (El Medio / Environment)**

El entorno del sistema ahora incorpora una multiplicidad de perfiles,
cada uno con un enfoque y necesidades específicas de interacción con la
plataforma:

-   Ciudadano (Consulta Pública): Representa al usuario particular que
    no necesita credenciales. Su relación con el sistema es de lectura
    libre a través de la SPA para investigar zonas, precios de
    combustible vigentes (ACPM, gasolina) e informarse a través del
    *Dashboard Ciudadano* (M8) y la *Normativa* (M5).

-   Trabajador de Estación: Operarios de planta, responsables directos
    en la bomba de gasolina. Definen interacciones diarias de trabajo
    ingresando despachos continuos, actas de cierre físico de turno y la
    recepción inicial (confirmación) del producto que llevan los
    camiones cisterna (M3 -- Gestión de Estación).

-   Distribuidor (Mayorista o Regulado): Actor de segundo nivel en la
    cadena. Interactúa para programar entregas, ver el recorrido de
    volúmenes de combustible enviados a los tanques de destino de
    ciertas estaciones, listando el número de remisión/guía finalizados.

-   Regulador o Auditor (Min. Minas): Usuarios con perfil visor (Sólo
    Lectura) centrado en fiscalización (M7 -- Auditoría). Tienen
    relaciones informativas especiales para revisar LOGs inmutables del
    aplicativo, generar consolidados, trazar reportes ministeriales (M6
    -- Reportes) validando los inventarios y cumplimiento del Decreto
    1428 / 763.

-   Administrador: El nivel superior del sistema (Módulos M1-M8).
    Encargados de la creación estructural de las demás entidades,
    aplicar el alta de Decretos, ajustes en los Precios y manejo de
    transacciones vitales (CRUD) de la base de datos a nivel maestro.
    Modifica zonas por jurisdicciones, aprueba credenciales de
    despachadores y distribuidores.

**2. Dependencias con Sistemas Externos y Tecnologías**

La arquitectura establece además dos profundas dependencias de
tecnología subyacente que también son parte del entorno de la
plataforma, representadas de manera simétrica en el Viewpoint:

-   Google OAuth 2.0: Dependencia de identidad del sistema como
    alternativa al usuario y clave encriptada (Bycript) tradicional
    (Módulo M1 - Auth). Por lo tanto, el sistema se conecta por un flujo
    de *Callback* a Google para generar interacciones de validación
    solicitando autorización del usuario, y recibe respuesta con un
    objeto de perfil que se verifica en el motor interno para crear un
    JWT de la app.

-   Google Maps JavaScript API: Dependencia y Servicio cartográfico de
    renderizado clave requerido tanto en el *Dashboard M8* interactivo
    (marcando la zona del usuario) como al explorar la lista de
    estaciones operativas y sus listados de valores en *Precios/Zonas
    M4*.

**3. Las Capas Internas (El Sistema Principal)**

Aunque las vistas de contexto suelen tratar al sistema como una caja
negra puramente, este esquema expone levemente los 3 Tier (Componentes
Principales) definidos en la especificación, para comprender en dónde
aterrizan todas las relaciones:

1.  Apps Web (React.js SPA): Frente en el que interactúan todos los
    Actores Humanos consumiendo las Interfaces Visuales y sus
    respectivos Módulos.

2.  API Node.js + Express (Backend): Puerta dependiente protegida por
    tokens JWT que enlaza peticiones HTTP REST con lógicas de validación
    robustas para el Decreto, transacciones de inventario, cálculos de
    topes de subsidio y generación de reportes PDF/Excel.

3.  Capa Relacional (PostgreSQL): La relación principal de persistencia
    para el estado almacenado y protegido bajo auditoría rigurosa (Log
    inmutable).

![](media/image4.png){width="6.0in" height="2.2677963692038494in"}

###  - Vista funcional (componentes responsables de realizar los casos de uso)

**1. Elementos Funcionales Principales (Los Componentes)**

Por estandarización del UML de Componentes, el diagrama dibuja los
componentes internos como rectángulos con el ícono conectivo. Hemos
validado 8 elementos principales de negocio:

-   **M1 - Seguridad y Auth**

-   **M2 - Gestión de Usuarios**

-   **M3 - Gestión de Estación**

-   **M4 - Precios y Zonas**

-   **M5 - Normativa y Reglas**

-   **M6 - Reportes y Exportación**

-   **M7 - Auditoría Central**

-   **M8 - Dashboard y Analítica**

Para resolver problemas de \"responsabilidades poco entendidas\", el
modelo se enriquece con notas atadas mediante líneas punteadas
describiendo la función clara y delimitada de un módulo en particular
(Ej: *M5: Motor experto que dictamina subsidios*).

2\. Elementos Externos (Estereotipo \<\<external\>\>)

Los clientes que usan el sistema y los servicios que lo apalancan no son
parte \"funcional\" de nuestro diseño principal. Por tanto la vista UML
los documenta formalmente mediante un estereotipo que indica una entidad
externa dependiente:

-   \[UI Web SPA\] \<\<external\>\> (Cliente principal de uso en
    navegador).

-   \[Google OAuth 2.0\] \<\<external\>\> y \[Google Maps API\]
    \<\<external\>\> (Servicios terceros).

-   \[PostgreSQL DB\] \<\<external\>\> (Motor de persistencia externo
    que almacena estados).

**3. Las Interfaces (Lollipops y Sockets)**

El corazón de la Vista Funcional elaborada es la manifestación de
**Interfaces**. Un componente no asalta el \"interior\" de otro, sino
que respeta contratos firmados modelados a través de círculos
(interfaces provistas o *lollipops*) y semicírculos (interfaces
requeridas o *sockets*, mostradas en PlantUML como flechas conectivas
..\>).

El modelo se divide en tres tipos de Interfaces documentadas con *Tagged
Values* (Ej: {protocol=HTTPS}):

1.  **Interfaces Públicas (Expuestas hacia el Sistema o los Clientes
    Exteriores):** Para que el cliente SPA opere, los componentes M1
    (*IAuthentication*), M3 (*IStationOperations*), M4 (*IPubPricing*),
    M6 (*IReporting*) y M8 (*IDashboard*) exponen formalmente interfaces
    HTTPS JSON hacia el borde del sistema, sirviendo a los Actores
    Finales.

2.  **Interfaces de Dependencia Externa:** A la inversa, módulos
    operacionales de easyDiesel como M1, M4 y M8 *requieren* de un
    servicio de mapeo (IMapping) o de Identidad (IIdentity) para
    funcionar y salir mediante protocolo OAuth o REST a buscarlos al
    entorno.

3.  **Interfaces Internas (El Acoplamiento del Dominio):** Demuestra
    cómo se comunican las funciones entre ellas dentro de la API en
    runtime sin salir al mundo público. Por ejemplo, el módulo M3 para
    poder facturar, *consume* internamente requerimientos de información
    expuestos en las interfaces del módulo M4 (Tarificador) e invoca la
    interfaz de Logs (IAuditLogging) levantada por M7. Todos los 8
    módulos, en última instancia, consumen la interfaz abstracta
    IDataPersistence expuesta por PostgreSQL garantizando su
    funcionalidad sobre la memoria del disco.

![](media/image5.png){width="6.0in" height="4.820337926509186in"}

###  

### 

### 

### - Vista de información (flujos de datos, ciclo de vida, modelos estáticos)

Ciclos de vida

![](media/image6.png){width="7.3805555555555555in"
height="4.291666666666667in"}

Modelos estáticos\
\
![](media/image7.png){width="6.0in" height="4.586440288713911in"}

Flujo de datos:

![](media/image8.png){width="7.541666666666667in"
height="1.5083333333333333in"}

\- Vista de despliegue (Infraestructura hardware donde se ejecutará la
aplicación)

**Atributos de Calidad y Restricciones de Despliegue (EasyDiesel)**

**1. Seguridad y Privacidad (Security)**

-   Cifrado en tránsito: Todas las comunicaciones físicas entre el
    dispositivo del cliente (Navegador), los servidores web
    (Vercel/Railway) y las APIs externas se realizan obligatoriamente
    mediante el protocolo HTTPS , No se admiten conexiones HTTP planas
    en ningún nodo.

-   Gestión de Identidad: La arquitectura delega el manejo de
    credenciales físicas al nodo de Google OAuth 2.0. El backend en
    Railway confía exclusivamente en tokens JWT firmados, validando cada
    petición sin almacenar contraseñas en la base de datos propia.

-   Aislamiento de Base de Datos: El entorno de ejecución de PostgreSQL
    en Supabase no expone conexiones directas no controladas. La
    comunicación desde Railway se realiza a través del puerto TCP 6543
    (PgBouncer), aislando el puerto nativo de la base de datos para
    prevenir ataques de denegación de servicio (DoS) por saturación de
    conexiones.

**2. Rendimiento y Latencia (Performance)**

-   Distribución de Carga Estática (Edge CDN): El artefacto principal
    del frontend (easydiesel-spa-bundle.js) se despliega en los nodos
    perimetrales de Vercel. Esto garantiza que la descarga inicial en el
    dispositivo del cliente tenga una latencia mínima, descargando la
    responsabilidad de entregar archivos del servidor de la API
    (Railway).

-   Multiplexación de Conexiones: Para optimizar el tráfico de red entre
    la API de Node.js y Supabase, se exige el uso del *Connection
    Pooler* (PgBouncer). Esto reduce la latencia de \"handshake\" TCP al
    reutilizar conexiones SQL activas.

**3. Disponibilidad y Escalabilidad (Availability & Scalability)**

-   Delegación de Infraestructura (PaaS / DBaaS): Para minimizar la
    carga operativa del equipo de desarrollo, la arquitectura se apoya
    en nodos de hardware gestionado (Railway y Supabase). Esto
    proporciona alta disponibilidad, reinicios automáticos y
    escalabilidad vertical sin intervención manual en el hardware.

-   Tolerancia a Fallos de Terceros: La funcionalidad de rutas y
    ubicación depende de la disponibilidad de los nodos de Google Places
    y Mapbox. La aplicación cliente debe implementar tiempos de espera
    (timeouts) en el navegador para que, si estos nodos externos fallan,
    la SPA no se congele.

![](media/image9.png){width="6.0in" height="4.657625765529309in"}

###  - Vista de desarrollo 

La vista de desarrollo describe la organización interna del software
desde la perspectiva de los desarrolladores, mostrando cómo el sistema
se estructura en módulos, componentes y capas de implementación. Esta
vista permite comprender cómo se divide el código fuente del sistema,
qué responsabilidades tiene cada módulo y cómo interactúan entre sí
durante el desarrollo.

El sistema se implementa utilizando tecnologías modernas para
aplicaciones web, donde el frontend se desarrolla como una aplicación
SPA y el backend expone una API REST que centraliza la lógica del
negocio.

Capa de presentación (Frontend)

La capa de presentación corresponde a la interfaz web utilizada por los
usuarios del sistema. Esta capa está desarrollada como una Single Page
Application (SPA) utilizando React y Vite, permitiendo una experiencia
de usuario dinámica y eficiente.

El frontend gestiona la navegación de la aplicación, la interacción con
los usuarios y el consumo de los servicios expuestos por el backend
mediante solicitudes HTTP utilizando el protocolo REST.

Entre sus responsabilidades principales se encuentran:

-   Gestión de la interfaz de usuario.

```{=html}
<!-- -->
```
-   Validación básica de formularios.

```{=html}
<!-- -->
```
-   Manejo de sesión del usuario autenticado.

```{=html}
<!-- -->
```
-   Consumo de endpoints de la API REST.

```{=html}
<!-- -->
```
-   Visualización de dashboards y reportes.

Capa de lógica de negocio (Backend)

La capa de lógica de negocio se implementa mediante un servidor Node.js
con Express, el cual expone una API REST encargada de procesar las
solicitudes provenientes del frontend.

Esta capa contiene toda la lógica crítica del sistema, incluyendo el
procesamiento de transacciones de combustible, la aplicación de
normativa vigente, la gestión de usuarios y la generación de reportes.

El backend se organiza en diferentes componentes de software:

-   Routes: definen los endpoints de la API.

```{=html}
<!-- -->
```
-   Controllers: gestionan las solicitudes HTTP.

```{=html}
<!-- -->
```
-   Services: contienen la lógica de negocio del sistema.

```{=html}
<!-- -->
```
-   Middleware: implementan seguridad, autenticación y auditoría.

```{=html}
<!-- -->
```
-   Models: representan las entidades de la base de datos.

La autenticación se realiza mediante JSON Web Tokens (JWT) y las
contraseñas se almacenan utilizando bcrypt para garantizar seguridad en
el manejo de credenciales.

Capa de datos

La capa de datos corresponde al sistema de persistencia del sistema,
implementado mediante PostgreSQL como base de datos relacional.

La interacción con la base de datos se realiza mediante un ORM que
permite abstraer las consultas SQL y facilitar el manejo de entidades
del dominio.

El modelo de datos incluye entidades principales como:

-   usuarios

-   estaciones de servicio

-   distribuidores

-   tanques de combustible

-   transacciones de combustible

-   precios vigentes

-   decretos normativos

-   auditoría del sistema

-   reportes generados

Este modelo permite almacenar de forma estructurada toda la información
relacionada con el control de combustibles, garantizando integridad y
trazabilidad de los datos.

Organización del sistema por módulos

El sistema EasyDisel se divide en ocho módulos principales que agrupan
las funcionalidades del sistema.

M1 -- Autenticación

Gestiona el proceso de autenticación de usuarios, validación de
credenciales y generación de tokens JWT para el acceso al sistema.

M2 -- Usuarios

Administra el registro, actualización y gestión de los usuarios del
sistema, incluyendo roles como administrador, estación de servicio,
distribuidor y regulador.

M3 -- Inventario

Gestiona el control de inventario de combustible en cada estación de
servicio, registrando entradas y salidas en los tanques.

M4 -- Precios y Zonas

Administra los precios vigentes de combustible según la zona geográfica,
tipo de combustible y tipo de servicio.

M5 -- Normativa

Implementa el motor de reglas que aplica los decretos regulatorios del
sector de combustibles en Colombia.

M6 -- Reportes

Permite generar reportes oficiales y exportarlos en diferentes formatos
para entidades regulatorias.

M7 -- Auditoría

Registra todas las operaciones realizadas dentro del sistema para
garantizar trazabilidad y control de las acciones de los usuarios.

M8 -- Dashboard

Proporciona visualización en tiempo real de indicadores del sistema como
inventarios, precios y alertas.

Estos módulos interactúan entre sí mediante la API REST del backend y
comparten acceso a la base de datos central del sistema.

![](media/image10.png){width="8.20625in" height="1.8916666666666666in"}

**4.5 Vista de Concurrencia**

La vista de concurrencia de **easyDIESEL** describe cómo el sistema
gestiona múltiples procesos, peticiones y tareas simultáneas sin
degradar el rendimiento. Dado que el sistema atiende simultáneamente a
ciudadanos, operadores de estaciones y administradores, se emplea una
arquitectura asíncrona y orientada a eventos, alejándose de los modelos
tradicionales de bloqueo por hilo.

1\. Mecanismos de Concurrencia por Capa Arquitectónica

El manejo de la concurrencia en EasyDiesel se resuelve de manera
distinta en cada capa del sistema:

-   **Frontend (Capa de Presentación - React SPA):** La concurrencia se
    maneja en el navegador del cliente mediante el Bucle de Eventos
    (Event Loop) de JavaScript y el uso de Promesas (async/await). Esto
    permite que el mapa de Mapbox renderice y responda a las
    interacciones del usuario de forma paralela mientras, en segundo
    plano, se realizan peticiones HTTP a la API para obtener los precios
    y estaciones.

-   **Backend (Capa de Aplicación - Node.js/Express):** Aunque Node.js
    se ejecuta en un solo hilo principal (Single-Threaded), logra una
    alta concurrencia mediante operaciones de Entrada/Salida no
    bloqueantes (Non-blocking I/O). Cuando Express recibe múltiples
    peticiones (ej. 50 usuarios buscando gasolineras al mismo tiempo),
    el servidor no se bloquea esperando a la base de datos; delega la
    tarea y sigue atendiendo nuevas peticiones, retornando las
    respuestas a medida que se resuelven.

-   **Base de Datos (Capa de Datos - PostgreSQL/Supabase):** La
    concurrencia de datos se garantiza mediante el modelo **MVCC**
    (Control de Concurrencia Multiversión de PostgreSQL). Esto asegura
    que las operaciones de lectura (ciudadanos consultando precios)
    nunca bloqueen las operaciones de escritura (administradores
    actualizando precios), garantizando consistencia sin cuellos de
    botella. Además, el pool de conexiones (PgBouncer) multiplexa miles
    de peticiones concurrentes del backend hacia un número seguro de
    conexiones físicas en la base de datos.

2\. Procesos Concurrentes Identificados

En el contexto operativo de EasyDiesel, los siguientes procesos clave
ocurren de forma simultánea:

-   **Orquestación de APIs Externas (Búsqueda y Geolocalización):** El
    proceso de cálculo de rutas y búsqueda de estaciones requiere
    consultar a Google Places y a la base de datos interna. El backend
    ejecuta estas peticiones de forma concurrente (ej. mediante
    Promise.all()), reduciendo el tiempo total de respuesta antes de
    consolidar el JSON final para el usuario.

-   **Transacciones de Inventario y Despacho:** Múltiples operadores
    pueden estar registrando salidas de combustible en diferentes
    estaciones al mismo tiempo. A través del ORM (Prisma), el sistema
    ejecuta bloques transaccionales (ACID) con bloqueo a nivel de fila
    (Row-Level Locking). Si dos operadores descuentan galones del mismo
    tanque físico exactamente en el mismo milisegundo, la base de datos
    encola la escritura para evitar la sobreescritura (Race Conditions)
    sin afectar al resto del sistema.

-   **Actualización Normativa vs. Consulta Ciudadana:** El administrador
    puede modificar un decreto o actualizar un precio de combustible.
    Gracias al modelo MVCC de PostgreSQL, los usuarios que estén
    consultando el mapa en ese preciso instante recibirán la versión
    anterior del precio (lectura consistente) hasta que la transacción
    de actualización haga un *commit* completo, momento en el cual los
    nuevos usuarios verán el precio actualizado.

-   **Auditoría Asíncrona en Segundo Plano:** El registro de logs de
    auditoría (quién hizo qué ) se lanza como una tarea diferida en el
    backend. Esto

> significa que el sistema no hace esperar al usuario a que el log se
> guarde en el disco para confirmarle que su acción fue exitosa,
> maximizando la agilidad de la interfaz.

3\. Mecanismos de Control de Concurrencia

Para evitar conflictos y garantizar la estabilidad bajo carga, EasyDisel
implementa:

-   **Arquitectura Stateless (Sin estado):** El uso de tokens JWT
    permite que el servidor backend no guarde sesiones en memoria,
    procesando cada petición concurrente de forma independiente.

-   **Rate Limiting:** Control de concurrencia a nivel de red para
    endpoints públicos, limitando el número de peticiones simultáneas
    por IP para proteger el ancho de banda y las cuotas de las APIs de
    Google y Mapbox.

-   **Restricciones de Integridad en BD:** Validaciones a nivel de
    esquema en PostgreSQL (ej. niveles de tanque CHECK (nivel \>= 0))
    que actúan como última línea de defensa si la concurrencia de la
    aplicación falla.

-   Gestión de colas o tareas en segundo plano para procesos
    automáticos.

-   Monitoreo de errores y logs de ejecución.

**Beneficios de esta vista en EasyDisel**

La concurrencia permite que EasyDisel pueda atender múltiples usuarios y
procesos al mismo tiempo, mejorando la experiencia de uso, reduciendo
tiempos de espera y garantizando que las operaciones del sistema se
realicen de manera eficiente. Además, esta vista ayuda a identificar
posibles cuellos de botella y a planificar mejor la arquitectura del
sistema.

> ![](media/image11.png){width="6.495833333333334in" height="8.4875in"}

### - Vista operacional (Describe acciones externas que se deben realizar para permitir el funcionamiento normal de la aplicación)

Esta sección describe los procesos técnicos, manuales y automáticos, que
se ejecutan en el día a día para garantizar el correcto funcionamiento,
actualización y mantenimiento del sistema EasyDiesel.

![](media/image12.png){width="6.0in" height="5.613557524059493in"}

**Procesos Operativos del Sistema:**

-   **Despliegue y Actualización Continua:** El sistema utiliza un flujo
    automatizado para pasar a producción. Cuando el equipo de desarrollo
    finaliza una funcionalidad y sube el código a la rama principal
    (main) en el repositorio, las plataformas de la nube lo detectan.
    Vercel se encarga de compilar y publicar la nueva versión de la
    interfaz web, mientras que Railway actualiza la base de datos y
    reinicia la API, todo esto sin interrumpir el servicio para el
    usuario.

-   **Monitoreo y Resolución de Incidentes:** La infraestructura en
    Railway vigila constantemente el estado de los servidores y los
    registros (logs). Si se detecta una caída o un fallo crítico, el
    servidor intenta un reinicio automático. Simultáneamente, el equipo
    recibe una alerta por correo para que puedan desarrollar un parche
    de emergencia rápidamente.

-   **Copias de Seguridad (Backups):** Para proteger la integridad de
    los datos del proyecto, no se requieren extracciones manuales
    diarias. La base de datos alojada en Supabase está configurada para
    ejecutar una copia de seguridad automática todos los días
    (Snapshot), lo que permite restaurar la información en caso de
    cualquier eventualidad.

## 3.3 Decisiones de arquitectura (Ciclo 2)

# 4. Diseño detallado de software

## 4.1 Modelo detallado de clases

![](media/image13.png){width="6.5in" height="4.539343832020998in"}

## 4.2 Modelo de interfaces

Interfaz de login

![](media/image14.png){width="6.0in" height="2.6644061679790028in"}

Interfaz de precios

![](media/image15.png){width="6.0in" height="2.135592738407699in"}

Interfaz de ruta mas economica

![](media/image16.png){width="6.0in" height="2.6949146981627297in"}

Interfaz de estaciones cercanas\
![](media/image17.png){width="6.0in" height="2.684745188101487in"}

Interfaz del dashbord del admin\
![](media/image18.png){width="6.0in" height="2.684745188101487in"}

## 4.3 Modelo de datos (EJB)

![](media/image19.png){width="6.0in" height="5.695172790901137in"}
