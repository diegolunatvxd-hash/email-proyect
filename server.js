const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Permite que tu HTML se conecte a este servidor
app.use(cors()); 
// Permite que el servidor entienda datos en formato JSON
app.use(express.json());

// Nos conectamos a Supabase
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY 
);

// --- RUTA: ENVIAR CORREOS INTERNOS ---
app.post('/api/enviar', async (req, res) => {
    const { from, to, subject, body } = req.body;

    try {
        // Al quitar Resend, simplemente guardamos el correo en Supabase
        // Esto hace que le aparezca mágicamente en la bandeja al destinatario
        const { error } = await supabase.from('emails').insert([
            { sender: from, recipient: to, subject: subject, body: body }
        ]);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Correo enviado internamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Fallo al enviar correo' });
    }
});

// Mostrar el HTML cuando alguien entre al link principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Arrancamos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de DiegoMail interno corriendo en el puerto ${PORT}`);
});
