# Plantilla de reenvío de leads a agencias de carga

Cuando recibas un correo de Formspree con una nueva solicitud de cotización de
flete, revisa si el lead se ve real y calificado. Si decides reenviarlo a una
agencia socia (cobrando el acuerdo comercial que tengas con ellos, ej. $15 USD
por lead calificado), copia los datos del correo en esta plantilla:

```
Asunto: Nueva solicitud de cotización de flete – Ref. {LEAD_ID}

Hola [nombre del contacto en la agencia],

Te reenvío una nueva solicitud de cotización recibida a través de
calculadoras-importacion.vercel.app:

- Referencia: {LEAD_ID}
- Producto: {PRODUCTO}
- Ruta: {ORIGEN} → {DESTINO}
- Volumen aproximado de carga: {VOLUMEN_CARGA}
- Fecha aproximada de envío: {FECHA_ENVIO}

Datos de contacto del cliente:
- Nombre: {NOMBRE}
- Empresa: {EMPRESA}
- Email: {EMAIL}
- Teléfono: {TELEFONO}

Por favor contáctalo directamente para enviarle la cotización.

Saludos,
[tu nombre]
```

## Por qué el `lead_id`

Cada solicitud trae un código de referencia único (formato `LEAD-YYYYMMDD-XXXX`)
generado automáticamente en el momento en que el cliente abre el formulario.
Ese mismo código se lo mostramos al cliente en el mensaje de confirmación, y
va incluido como campo oculto en el correo que te llega de Formspree.

Úsalo para:
- Evitar reenviar el mismo lead dos veces a la misma agencia.
- Llevar un registro simple (planilla, notas, lo que uses) de qué leads ya
  facturaste a cada agencia y cuáles todavía no.
- Que el cliente pueda referenciar su solicitud si te escribe preguntando por
  el estado de su cotización.
