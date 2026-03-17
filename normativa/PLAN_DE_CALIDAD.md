Versión 1.0 \| Marzo 2026

[1. PRESENTACIÓN 3](#presentación)

> [1.1 Objetivo del documento 3](#objetivo-del-documento)
>
> [1.2 Alcance del documento 3](#alcance-del-documento)
>
> [1.3 Audiencia 3](#audiencia)
>
> [1.4 Glosario 3](#glosario)

[2. INTRODUCCIÓN 5](#introducción)

> [2.1 Objetivos del plan de calidad 5](#objetivos-del-plan-de-calidad)
>
> [2.2 Alcance del plan de calidad 5](#alcance-del-plan-de-calidad)

[3. PROCESO DE ASEGURAMIENTO DE CALIDAD
6](#proceso-de-aseguramiento-de-calidad)

> [3.1 Principios 6](#principios)
>
> [3.2 Actividades de aseguramiento 6](#actividades-de-aseguramiento)
>
> [3.3 Responsables 7](#responsables)

[4. MÉTRICAS DE CALIDAD 8](#métricas-de-calidad)

> [4.1 Resumen de porcentajes 8](#resumen-de-porcentajes)
>
> [4.2 Porcentaje Libre de Defectos (PDF)
> 8](#porcentaje-libre-de-defectos-pdf)
>
> [4.3 Defectos por Página 9](#defectos-por-página)
>
> [4.4 Defectos por KLOC 9](#defectos-por-kloc)
>
> [4.5 Proporción de defectos (Ratio) 9](#proporción-de-defectos-ratio)
>
> [4.6 Proporción de tiempos de desarrollo
> 10](#proporción-de-tiempos-de-desarrollo)
>
> [4.7 Evaluación / Fallas (A/FR) 11](#evaluación-fallas-afr)
>
> [4.8 Relaciones de revisión e inspección
> 11](#relaciones-de-revisión-e-inspección)
>
> [4.9 Inyección de defectos por hora
> 11](#inyección-de-defectos-por-hora)
>
> [4.10 Remoción de defectos por hora
> 11](#remoción-de-defectos-por-hora)
>
> [4.11 Rendimiento de fase (Yield) 12](#rendimiento-de-fase-yield)
>
> [4.12 Rendimiento de proceso 12](#rendimiento-de-proceso)

[5. SEGUIMIENTO Y RECOLECCIÓN DE DATOS
13](#seguimiento-y-recolección-de-datos)

> [5.1 Registro de tiempo 13](#registro-de-tiempo)
>
> [5.2 Registro de defectos 13](#registro-de-defectos)
>
> [5.3 Seguimiento semanal 13](#seguimiento-semanal)
>
> [5.4 Análisis y mejora 14](#análisis-y-mejora)

# 1. PRESENTACIÓN

## 1.1 Objetivo del documento

El presente documento tiene como propósito describir el marco de
aseguramiento de calidad bajo el cual se planificará, ejecutará y
controlará el desarrollo del Sistema de Trazabilidad y Control de
Precios del Combustible ACPM. El plan establece los criterios, métricas,
actividades y responsabilidades que garantizarán la calidad del producto
entregado, la integridad del proceso de desarrollo y el cumplimiento de
los compromisos del proyecto, en concordancia con los estándares
definidos por el Team Software Process (TSP) y las obligaciones
reglamentarias del Decreto 1428 de 2025.

## 1.2 Alcance del documento

Este plan de calidad cubre todas las fases del ciclo de vida del
proyecto: iniciación, estrategia, diseño conceptual, desarrollo
(construcción), pruebas (unitarias, de integración, de sistema y de
aceptación) y cierre. Aplica a todos los módulos de la plataforma:

-   Módulo de Inventario y Trazabilidad de Combustible

-   Módulo de Gestión de Precios y Zonas Geográficas

-   Módulo de Reportes Regulatorios

-   Módulo de Gestión de Usuarios y Seguridad

-   Módulo de Autenticación

-   Módulo de Auditoria

-   Módulo de Normativa

El plan abarca:

-   Calidad del producto (artefactos entregables y código fuente)

-   Calidad del proceso (actividades de revisión, inspección y prueba)

-   Calidad del proyecto (cumplimiento de cronograma, estimaciones y
    > compromisos)

## 1.3 Audiencia

Este documento está dirigido a:

-   Equipo de desarrollo del proyecto (ingenieros, líderes de rol)

-   Director/Gestor del proyecto

-   Autoridades reguladoras (Ministerio de Minas y Energía,
    > Superintendencia de Industria y Comercio)

-   Clientes y operadores de estaciones de servicio

-   Distribuidores mayoristas de combustible

-   Auditores externos y pares académicos

## 1.4 Glosario

  -----------------------------------------------------------------------
  **Término**           **Definición**
  --------------------- -------------------------------------------------
  Defecto               Cualquier error, omisión o inconsistencia
                        detectada en un artefacto o en el código fuente
                        durante las actividades de revisión, inspección o
                        prueba.

  Yield (Rendimiento de Porcentaje de defectos removidos en una fase
  fase)                 respecto al total de defectos inyectados hasta
                        esa fase.

  PDF (Porcentaje Libre Proporción de componentes o artefactos que no
  de Defectos)          presentan defectos detectados en la fase de
                        revisión correspondiente.

  KLOC                  Miles de Líneas de Código (Kilo Lines Of Code).
                        Unidad de medida del tamaño del producto
                        software.

  A/FR (Appraisal to    Cociente entre el tiempo dedicado a actividades
  Failure Ratio)        de valoración (revisiones e inspecciones) y el
                        tiempo dedicado a corrección de defectos
                        encontrados en pruebas.

  ACPM                  Aceite Combustible para Motor (diésel).
                        Combustible regulado por el Decreto 1428 de 2025
                        con esquema diferenciado de subsidio según tipo
                        de vehículo.

  Artefacto             Producto intermedio o final generado durante el
                        ciclo de vida del proyecto (documento, diagrama,
                        código, plan, etc.).

  TSP / TSPi            Team Software Process / Team Software Process
                        introductory. Marco de trabajo de ingeniería de
                        software orientado a equipos, que define roles,
                        métricas y planes de calidad.
  -----------------------------------------------------------------------

# 2. INTRODUCCIÓN

Colombia enfrenta el reto de gestionar de forma transparente y auditable
la distribución diferenciada del subsidio al combustible ACPM
establecida en el Decreto 1428 de 2025. La norma elimina el subsidio
para vehículos particulares y lo mantiene para transporte público y
carga, exigiendo que cada transacción de despacho quede registrada con
la placa, el tipo de servicio y el precio aplicado. El sistema de
trazabilidad que se desarrolla en este proyecto responde a ese mandato.

## 2.1 Objetivos del plan de calidad

-   Establecer metas cuantitativas de calidad para el producto software
    > y los artefactos del proyecto, alineadas con los estándares TSP y
    > las exigencias regulatorias del Decreto 1428.

-   Definir las actividades de revisión, inspección y prueba que
    > permitan detectar y remover defectos de forma temprana,
    > minimizando el costo de corrección.

-   Medir continuamente el rendimiento del proceso de desarrollo
    > mediante métricas de inyección y remoción de defectos, tiempos y
    > tamaño de producto.

-   Proveer los mecanismos de seguimiento que permitan verificar el
    > cumplimiento del plan y tomar acciones correctivas oportunas.

-   Garantizar que el sistema entregado sea confiable, auditable y
    > cumpla con los requisitos legales para su operación en estaciones
    > de servicio a nivel nacional.

## 2.2 Alcance del plan de calidad

El plan de calidad cubre las tres dimensiones de calidad definidas por
TSP:

-   Calidad del producto: Se evaluará la densidad de defectos en código
    > (Defectos/KLOC), el porcentaje libre de defectos por fase y la
    > proporción de defectos entre fases. Se aplicarán revisiones de
    > pares (peer reviews) e inspecciones formales a todos los módulos
    > del sistema.

-   Calidad del proceso: Se medirán las tasas de inyección y remoción de
    > defectos por hora en cada fase, el rendimiento de fase (yield) y
    > los ratios de tiempo de revisión vs. tiempo de elaboración,
    > asegurando que el proceso sea sistemático, repetible y mejorable.

-   Calidad del proyecto: Se controlarán las desviaciones entre el
    > tiempo planificado y el ejecutado, el cumplimiento del cronograma
    > (SCHEDULE) y la exactitud de las estimaciones de tamaño (SUMS) y
    > esfuerzo (TASK).

# 3. PROCESO DE ASEGURAMIENTO DE CALIDAD

## 3.1 Principios

El proceso de aseguramiento de calidad del proyecto se rige por los
siguientes principios derivados de TSP:

-   Planeación previa a la ejecución: Se deben establecer metas de
    > calidad, estimar defectos y definir actividades de revisión antes
    > de comenzar cada fase de desarrollo.

-   Gestión sistemática de defectos: Todo defecto detectado debe ser
    > registrado, clasificado por tipo y fase de inyección, y utilizado
    > para mejorar estimaciones futuras.

-   Revisiones e inspecciones proactivas: Las revisiones de documentos y
    > el código fuente son actividades planificadas, no opcionales. El
    > rendimiento objetivo de remoción de defectos en revisiones supera
    > el 75% antes de llegar a pruebas.

-   Medición del producto, proceso y proyecto: Las métricas se
    > recolectan en tiempo real usando los formularios TASK, SCHEDULE,
    > SUMP y SUMQ, y se analizan semanalmente.

-   Mejora continua: Los datos recolectados en cada ciclo se utilizan
    > para ajustar estándares de inyección, tiempos de revisión y
    > rendimientos en el siguiente ciclo o fase.

## 3.2 Actividades de aseguramiento

  ------------------------------------------------------------------------------
  **Actividad**      **Descripción**          **Responsable**   **Frecuencia**
  ------------------ ------------------------ ----------------- ----------------
  Revisión de        Revisión de pares de     Líder de          Por artefacto
  documentos         artefactos               Calidad + Equipo  
                     (requerimientos, diseño,                   
                     planes, casos de prueba)                   
                     según checklists de                        
                     inspección.                                

  Inspección de      Revisión formal del      Líder de          Por componente
  código             código fuente antes de   Desarrollo + Par  
                     pasar a pruebas de                         
                     integración. Usa las                       
                     tasas de revisión                          
                     establecidas en los                        
                     estándares.                                

  Registro de        Registro individual de   Cada ingeniero    Continua
  defectos           cada defecto detectado                     
                     en el formulario de log                    
                     de defectos: tipo, fase                    
                     de inyección, fase de                      
                     detección, tiempo de                       
                     corrección.                                

  Corrección de      Corrección documentada   Ingeniero         Continua
  defectos           de defectos registrados  responsable       
                     con verificación                           
                     posterior de la                            
                     corrección.                                

  Recolección de     Ingreso de tiempos y     Cada ingeniero    Diaria
  datos              defectos en TASK y                         
                     SCHEDULE al finalizar                      
                     cada sesión de trabajo.                    

  Cálculo de         Cálculo semanal de todas Líder de Calidad  Semanal
  métricas           las métricas del plan                      
                     SUMQ: PDF,                                 
                     defectos/KLOC, yield,                      
                     A/FR, ratios de tiempo.                    

  Reunión de         Revisión del estado del  Líder de Equipo   Semanal
  seguimiento        plan de calidad,                           
                     identificación de                          
                     desviaciones y acciones                    
                     correctivas.                               

  Actualización de   Verificación y           Líder de          Por evento
  precios/normas     actualización de reglas  Desarrollo +      
                     de negocio cuando el     Admin             
                     regulador emita nuevas                     
                     disposiciones sobre                        
                     precios ACPM.                              
  ------------------------------------------------------------------------------

## 3.3 Responsables

  -----------------------------------------------------------------------
  **Rol**              **Responsabilidades en Calidad**
  -------------------- --------------------------------------------------
  Líder de Calidad     Planificar y coordinar todas las actividades de
                       aseguramiento. Calcular y reportar métricas
                       semanalmente. Verificar cumplimiento de estándares
                       de revisión. Mantener el plan SUMQ actualizado.
                       Escalar desviaciones críticas al Líder de Equipo.

  Líder de Desarrollo  Asegurar que el código cumpla con los estándares
                       de codificación definidos. Coordinar inspecciones
                       de código. Velar por el cumplimiento de las tasas
                       de inyección de defectos. Revisar y aprobar el
                       módulo de reglas de precio antes de cada release.

  Líder de Soporte /   Diseñar y ejecutar los casos de prueba de los
  Pruebas              módulos. Registrar defectos encontrados en pruebas
                       unitarias, de integración y de sistema. Verificar
                       que la densidad de defectos en pruebas cumpla las
                       metas del plan SUMQ.

  Líder de Equipo      Aprobar el Plan de Calidad. Tomar decisiones sobre
  (Team Lead)          ajustes de cronograma cuando las métricas lo
                       requieran. Facilitar la reunión semanal de
                       seguimiento. Comunicar el estado de calidad a los
                       stakeholders.

  Cada Ingeniero       Registrar tiempo y defectos en los formularios
                       TASK y SCHEDULE diariamente. Ejecutar revisiones
                       de sus propios artefactos antes de entregarlos al
                       equipo. Aplicar los checklists de inspección
                       asignados.
  -----------------------------------------------------------------------

# 4. MÉTRICAS DE CALIDAD

Las métricas de calidad del proyecto están basadas en el modelo SUMQ de
TSP, adaptadas a las características de este sistema (plataforma web con
módulos regulatorios, integración IoT y múltiples roles de usuario). A
continuación se describen las métricas y sus metas esperadas, alineadas
con las tablas de ejemplo de la asignatura.

## 4.1 Resumen de porcentajes

La siguiente tabla consolida el resumen de las métricas principales del
plan de calidad. Las metas han sido establecidas considerando la
criticidad regulatoria del sistema: un error en la aplicación de precios
puede constituir una infracción legal, por lo que se elevan los
estándares de remoción de defectos respecto a proyectos típicos.

  -------------------------------------------------------------------------------------------------------------------------
  **Métrica**                 **Medición**               **Meta**
  --------------------------- -------------------------- ------------------------------------------------------------------
  **PDF -- Porcentaje Libre   Artefactos sin defectos /  **Ver [[4.2 Porcentaje Libre de Defectos
  de Defectos**               Total artefactos revisados (PDF)]{.underline}](#porcentaje-libre-de-defectos-pdf)**

  **Defectos por Página**     Defectos detectados /      **Ver [[4.3 Defectos por
                              Total páginas del          Página]{.underline}](#defectos-por-página)**
                              documento                  

  **Defectos por KLOC**       Defectos detectados / Mil  **Ver [[4.4 Defectos por KLOC]{.underline}](#defectos-por-kloc)**
                              líneas de código           

  **Proporción de Defectos    Defectos fase anterior /   **Ver [[4.5 Proporción de defectos
  (Ratio)**                   Defectos fase posterior    (Ratio)]{.underline}](#proporción-de-defectos-ratio)**

  **Proporción de Tiempos**   Tiempo revisión / Tiempo   **Ver [[4.6 Proporción de tiempos de
                              elaboración por fase       desarrollo]{.underline}](#proporción-de-tiempos-de-desarrollo)**

  **A/FR (Appraisal to        Tiempo valoración / Tiempo **\> 1,5**
  Failure Ratio)**            corrección en pruebas      

  **Rendimiento de Fase       Defectos removidos en fase **Ver [[4.11 Rendimiento de fase
  (Yield)**                   / Total inyectados hasta   (Yield)]{.underline}](#rendimiento-de-fase-yield)**
                              fase                       

  **Rendimiento de Proceso**  Defectos removidos         **Ver [[4.12 Rendimiento de
                              acumulado antes de cada    proceso]{.underline}](#rendimiento-de-proceso)**
                              hito                       
  -------------------------------------------------------------------------------------------------------------------------

## 4.2 Porcentaje Libre de Defectos (PDF)

Fórmula: PDF = (Artefactos sin defectos / Total artefactos revisados) ×
100

  ------------------------------------------------------------------------
  **Fase / Artefacto**        **Medición (unidad)**  **Meta**
  --------------------------- ---------------------- ---------------------
  **Iniciación**              Títulos del Documento  **\> 50%**

  **Estrategia**              Títulos del Documento  **\> 50%**

  **SRS (Requerimientos)**    Casos de Uso           **\> 10%**

  **Diseño**                  Títulos del Documento  **\> 40%**

  **Plan de Pruebas**         Casos de Prueba        **\> 50%**

  **Plan de Calidad**         Títulos del Documento  **\> 50%**

  **Producto en pruebas       Clases por Capa        **\> 70%**
  unitarias**                 (módulo)               

  **Producto en pruebas de    Casos de Uso           **\> 90%**
  aceptación**                verificados            
  ------------------------------------------------------------------------

## 4.3 Defectos por Página

Fórmula: Defectos detectados / Número total de páginas del documento.

  -----------------------------------------------------------------------
  **Artefacto / Fase**               **Meta (Defectos/Página)**
  ---------------------------------- ------------------------------------
  Documento de Iniciación            0,3

  Documento de Estrategia            0,5

  SRS -- Especificación de           2,0
  Requerimientos                     

  Documento de Diseño                2,0

  Plan de Pruebas                    1,0
  -----------------------------------------------------------------------

## 4.4 Defectos por KLOC

Fórmula: Defectos detectados / Mil líneas de código (KLOC).

  -----------------------------------------------------------------------
  **Tipo de Prueba**                 **Meta (Defectos/KLOC)**
  ---------------------------------- ------------------------------------
  Pruebas Unitarias                  \< 5

  Pruebas de Integración             \< 4

  Pruebas del Sistema                \< 3

  Pruebas de Aceptación              \< 1
  -----------------------------------------------------------------------

## 4.5 Proporción de defectos (Ratio)

Mide la efectividad de la remoción temprana de defectos. Una proporción
alta indica que los defectos se están encontrando antes, en fases de
menor costo de corrección.

  -----------------------------------------------------------------------
  **Proporción**                                  **Meta**
  ----------------------------------------------- -----------------------
  Defectos en Diseño / Defectos en Pruebas        \> 2
  Unitarias                                       

  Defectos en Pruebas Unitarias / Defectos en     \> 2
  Pruebas de Integración                          
  -----------------------------------------------------------------------

## 4.6 Proporción de tiempos de desarrollo

Mide que se invierta tiempo suficiente en revisión e inspección respecto
al tiempo de elaboración. Un ratio bajo indica que el equipo está
saltando actividades de calidad.

  -----------------------------------------------------------------------
  **Proporción de tiempo**                        **Meta**
  ----------------------------------------------- -----------------------
  Tiempo inspección de requerimientos / Tiempo    \> 0,25
  definición de requerimientos                    

  Tiempo inspección de diseño / Tiempo definición \> 0,50
  del diseño                                      

  Tiempo revisión de código / Tiempo de           \> 0,50
  codificación                                    
  -----------------------------------------------------------------------

## 4.7 Evaluación / Fallas (A/FR)

Fórmula: A/FR = Tiempo dedicado a valoración (revisiones + inspecciones)
/ Tiempo dedicado a corrección de fallos en pruebas.

  -----------------------------------------------------------------------
  **Métrica**                                     **Meta**
  ----------------------------------------------- -----------------------
  A/FR -- Valoración del Cociente de Falla        \> 1,5
  (Appraisal to Failure Ratio)                    

  -----------------------------------------------------------------------

## 4.8 Relaciones de revisión e inspección

Tasas de velocidad de revisión. Superarlas indica que la revisión es
superficial y no detectará defectos.

  -----------------------------------------------------------------------
  **Artefacto revisado**                 **Tasa máxima de revisión**
  -------------------------------------- --------------------------------
  Páginas de Iniciación / hora           \< 15 páginas/hora

  Páginas de Estrategia / hora           \< 10 páginas/hora

  Páginas de Requerimientos / hora       \< 5 páginas/hora

  Líneas de texto de Diseño / hora       \< 100 líneas/hora

  Líneas de Código / hora                \< 200 líneas/hora
  -----------------------------------------------------------------------

## 4.9 Inyección de defectos por hora

Tasa esperada de defectos introducidos durante la elaboración de cada
artefacto o módulo.

  -----------------------------------------------------------------------
  **Fase de elaboración**                **Tasa esperada
                                         (Defectos/hora)**
  -------------------------------------- --------------------------------
  Iniciación                             \< 0,25 defectos/hora

  Estrategia                             \< 0,25 defectos/hora

  Definición de Requerimientos           0,25 defectos/hora

  Diseño                                 2 defectos/hora

  Codificación                           4 defectos/hora
  -----------------------------------------------------------------------

## 4.10 Remoción de defectos por hora

Tasa esperada de defectos removidos durante actividades de revisión e
inspección.

  -----------------------------------------------------------------------
  **Fase de revisión**                   **Tasa esperada
                                         (Defectos/hora)**
  -------------------------------------- --------------------------------
  Revisión Iniciación                    0,25 defectos/hora

  Revisión Estrategia                    0,25 defectos/hora

  Revisión Requerimientos                0,50 defectos/hora

  Revisión Diseño                        2 defectos/hora

  Revisión Código                        6 defectos/hora
  -----------------------------------------------------------------------

## 4.11 Rendimiento de fase (Yield)

Porcentaje de defectos removidos en cada fase respecto al total
inyectado hasta ese punto.

  -----------------------------------------------------------------------
  **Fase**                               **Meta de Rendimiento**
  -------------------------------------- --------------------------------
  Iniciación                             \> 85%

  Estrategia                             \> 80%

  Requerimientos                         \> 90%

  Diseño                                 \> 90%

  Pruebas (Unitarias + Integración +     \> 95%
  Sistema)                               
  -----------------------------------------------------------------------

## 4.12 Rendimiento de proceso

Porcentaje acumulado de defectos removidos antes de cada hito de prueba.
Este indicador mide la efectividad global del proceso de aseguramiento.

  -----------------------------------------------------------------------
  **Hito del proceso**                   **Meta de Rendimiento
                                         Acumulado**
  -------------------------------------- --------------------------------
  Antes de Diseño                        \> 75%

  Antes de Pruebas Unitarias             \> 85%

  Antes de Pruebas de Integración        \> 90%

  Antes de Pruebas de Sistema            \> 93%

  Antes de Pruebas de Aceptación         \> 95%
  -----------------------------------------------------------------------

# 5. SEGUIMIENTO Y RECOLECCIÓN DE DATOS

## 5.1 Registro de tiempo

Cada ingeniero del equipo registrará el tiempo invertido en cada tarea
al finalizar cada sesión de trabajo. El registro se realizará en el
formulario TASK de TSPi, especificando: la tarea realizada, la fase del
proyecto a la que corresponde, el tiempo planificado (en horas) y el
tiempo real invertido. Los datos son ingresados en la herramienta de
soporte del equipo al cierre de cada día de trabajo.

Los campos mínimos del registro de tiempo son:

-   Nombre del ingeniero

-   Fecha

-   Identificador de tarea (según TASK)

-   Fase del ciclo de vida

-   Descripción de la actividad

-   Tiempo planificado (horas)

-   Tiempo real (horas)

-   Observaciones (si aplica)

## 5.2 Registro de defectos

Cada defecto detectado, independientemente de la fase o la actividad en
que se encuentre, debe ser registrado de forma inmediata en el log de
defectos individual. El formato de log de defectos incluye los
siguientes campos:

  -----------------------------------------------------------------------
  **Campo**            **Descripción**
  -------------------- --------------------------------------------------
  ID del Defecto       Número secuencial único por ingeniero.

  Fecha de detección   Fecha en que se detectó el defecto.

  Tipo de defecto      Clasificación según estándar PSP (10 tipos:
                       lógica, sintaxis, interfaz, datos, etc.).

  Fase de inyección    Fase en la que se estima que fue introducido el
                       defecto.

  Fase de detección    Fase en la que fue detectado el defecto.

  Descripción          Descripción breve del defecto y su localización.

  Tiempo de corrección Tiempo invertido en corregir el defecto.
  (min)                

  Módulo afectado      Módulo del sistema donde se detectó (Inventario,
                       Precios, Reportes, Usuarios).
  -----------------------------------------------------------------------

## 5.3 Seguimiento semanal

Al finalizar cada semana de trabajo, el Líder de Calidad convocará una
reunión de seguimiento cuya agenda incluirá:

-   Revisión del estado de las tareas completadas vs. planificadas
    > (formulario SCHEDULE).

-   Cálculo y análisis de las métricas del plan SUMQ con base en los
    > datos recolectados en la semana.

-   Identificación de retrasos en el cronograma y definición de acciones
    > correctivas.

-   Registro de tareas adicionales no planificadas (misceláneas) que
    > hayan consumido tiempo del equipo.

-   Evaluación del rendimiento de las actividades de revisión e
    > inspección ejecutadas.

-   Ajuste del plan si alguna métrica supera los umbrales críticos
    > definidos.

Los umbrales críticos que activan una revisión inmediata del plan son:

-   Defectos/KLOC en pruebas unitarias \> 10 (el doble de la meta).

-   Yield de cualquier fase \< 60%.

-   A/FR \< 1,0 (el equipo está gastando más tiempo en corrección que en
    > prevención).

-   Desviación del cronograma \> 20% en cualquier entregable crítico.

## 5.4 Análisis y mejora

Los datos recolectados a lo largo del proyecto se utilizarán para
mejorar las estimaciones y los estándares en el siguiente ciclo o en la
siguiente fase. El proceso de mejora continua sigue el siguiente
esquema:

-   Al cierre de cada fase, el Líder de Calidad generará un reporte de
    > fase que compare las métricas reales vs. las planificadas.

-   Si la tasa de inyección de defectos real supera el estándar, se
    > revisará si es necesario aumentar el tiempo de revisión en la fase
    > siguiente.

-   Si el rendimiento de fase (yield) es inferior al 80%, se
    > incrementará la tasa objetivo de revisión y se programará una
    > sesión adicional de inspección.

-   Si la proporción de tiempos de revisión vs. elaboración es inferior
    > a las metas, se ajustará el plan de trabajo de la fase siguiente
    > para reservar tiempo explícito de revisión.

-   Los datos históricos del proyecto alimentarán una base de
    > conocimiento que permita hacer estimaciones más precisas en
    > proyectos futuros de la organización.

El Líder de Equipo presentará un resumen ejecutivo del estado de calidad
al cliente y a los stakeholders regulatorios al finalizar cada iteración
de desarrollo, garantizando la trazabilidad y auditabilidad exigidas por
el Decreto 1428 de 2025.
