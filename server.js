const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const sql = require('mssql');
const port = 3000; 

const sqlConfig = {
  user: 'db_abbe89_contenedores_admin',          // Tu usuario de SQL Server
  password: 'appContenedores1',   // Tu contraseña de SQL Server
  server: 'SQL1004.site4now.net',         // IP del servidor o localhost si está en tu máquina local
  database: 'db_abbe89_contenedores',       // El nombre de la base de datos
  options: {
    encrypt: false,             // Para usar cifrado si es necesario
    trustServerCertificate: false // Asegúrate de que el certificado sea de confianza
  }
};

// Configurar el servidor para aceptar datos JSON
app.use(bodyParser.json());
app.use(cors());

// Ruta para recibir los datos del ESP32
app.post('/api/submit_data', async (req, res) => {
  const data = req.body;  // Obtiene los datos enviados en formato JSON

  console.log("Datos recibidos:");
  console.log(`Distancia: ${data.distancia} cm`);

  // Aquí puedes almacenar los datos en una base de datos o procesarlos como desees

  res.status(200).send({ message: 'Datos recibidos correctamente' });

  // Conectar a SQL Server y guardar los datos
  try {
    // Conectar a SQL Server
    await sql.connect(sqlConfig);

    // Insertar los datos en la base de datos
    const result = await sql.query`
      INSERT INTO contenedor1 (distancia)
      VALUES (${data.distancia});
    `;
    console.log('Datos guardados en la base de datos:', result);

    // Responder al cliente (ESP32) indicando que los datos fueron guardados correctamente
    if (!res.headersSent) {
      res.status(200).send({ message: 'Datos guardados correctamente' });
    }
  } catch (err) {
    console.error('Error al guardar los datos en la base de datos:', err);

    // Solo enviar la respuesta si las cabeceras no han sido enviadas
    if (!res.headersSent) {
      res.status(500).send({ message: 'Error al guardar los datos' });
    }
  } finally {
    // Cerrar la conexión a SQL Server
    await sql.close();
  }
});



// Ruta para obtener todos los datos de distancia desde SQL Server (GET)
app.get('/api/get_lastData', async (req, res) => {
  try {
    // Conectar a SQL Server
    await sql.connect(sqlConfig);

    // Obtener todos los datos de la tabla
    const result = await sql.query `SELECT TOP 1 id, distancia, estado, fecha FROM contenedor1 ORDER BY fecha DESC`;

    // Enviar los datos como respuesta en formato JSON
    if (!res.headersSent) {
      res.status(200).json(result.recordset);  // recordset contiene los resultados de la consulta
    }
  } catch (err) {
    console.error('Error al obtener los datos:', err);
    // Solo enviar la respuesta si las cabeceras no han sido enviadas
    if (!res.headersSent) {
      res.status(500).send({ message: 'Error al obtener los datos' });
    }
  } finally {
    // Cerrar la conexión a SQL Server
    await sql.close();
  }
});

// Iniciar el servidor en el puerto 3000
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
