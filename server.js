const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const app = express();

// Permite que tu HTML se conecte a este servidor sin bloqueos de seguridad
app.use(cors()); 
// Permite que el servidor entienda datos en formato JSON
app.use(express.json());

// Nos conectamos a Supabase (usamos las variables de entorno de Render)
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY // Usamos la Service Key porque es el backend (tiene permisos totales)
);

// Nos conectamos al proveedor de correos (Resend)
const resend = new Resend(process.env.RESEND_API_KEY);

// --- RUTA 1: ENVIAR CORREOS AL MUNDO EXTERIOR ---
app.post('/api/enviar', async (req, res) => {
    const { from, to, subject, body } = req.body;

    try {
        // 1. Le decimos a Resend que envíe el correo real a Gmail/Outlook/etc.
        const emailResponse = await resend.emails.send({
            from: `${from} <hola@diegomail.com>`, // Aquí irá tu dominio comprado
            to: to,
            subject: subject,
            html: `<p>${body}</p>`
        });

        // 2. Si se envió bien, lo guardamos en Supabase para que aparezca en tu bandeja de enviados
        await supabase.from('emails').insert([
            { sender: from, recipient: to, subject: subject, body: body }
        ]);

        res.status(200).json({ success: true, message: 'Correo enviado al exterior' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Fallo al enviar correo' });
    }
});

// --- RUTA 2: RECIBIR CORREOS DESDE EL EXTERIOR (WEBHOOK) ---
// Resend llamará a esta URL automáticamente cuando alguien responda a @diegomail.com
app.post('/api/webhook/recibir', async (req, res) => {
    try {
        // El formato exacto depende del Webhook de Resend, pero la lógica es:
        const { from, to, subject, text } = req.body;

        // Guardamos el correo entrante en tu base de datos
        await supabase.from('emails').insert([
            { sender: from, recipient: to, subject: subject, body: text }
        ]);

        // Respondemos con un 200 OK para que Resend sepa que lo recibimos bien
        res.status(200).send('Correo recibido y guardado');
    } catch (error) {
        console.error("Error en el Webhook:", error);
        res.status(500).send('Error interno');
    }
});

// Arrancamos el servidor en el puerto que Render nos asigne
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de DiegoMail corriendo en el puerto ${PORT}`);
});
