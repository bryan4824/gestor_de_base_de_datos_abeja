const queryInput = document.getElementById('query-input');
const messageDisplay = document.getElementById('message-display');
const resultsTable = document.getElementById('results-table');
const dbInput = document.getElementById('db-input');
const dbButtons = document.querySelectorAll('.db-btn');
const currentDbInfo = document.getElementById('current-db-info');

let dbSeleccionada = '';

dbButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        dbSeleccionada = btn.dataset.dbName;
        currentDbInfo.textContent = `Base de datos seleccionada: ${dbSeleccionada}`;
        document.querySelectorAll('.db-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mostrarTablasDeDB(dbSeleccionada);
    });
});

async function mostrarTablasDeDB(dbName) {
    const response = await fetch('/ejecutar-consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbName, query: 'SHOW TABLES;' })
    });

    const data = await response.json();
    limpiarResultados();
    
    if (data.error) {
        mostrarError(`Error al mostrar tablas: ${data.error}`);
    } else if (data.resultados) {
        mostrarTabla(data.resultados);
        mostrarMensaje(`Tablas en la base de datos "${dbName}"`);
    } else {
        mostrarMensaje(`No se encontraron tablas en la base de datos "${dbName}".`);
    }
}

async function crearDB() {
    const dbName = dbInput.value;
    if (!dbName) {
        alert('Por favor, ingresa un nombre para la base de datos.');
        return;
    }

    const response = await fetch('/ejecutar-consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `CREATE DATABASE \`${dbName}\`` })
    });

    const data = await response.json();
    if (data.error) {
        mostrarError(data.error);
    } else {
        mostrarMensaje(data.message);
        setTimeout(() => window.location.reload(), 1500);
    }
}

async function ejecutar() {
    const query = queryInput.value;
    if (!query) {
        mostrarError('La consulta no puede estar vacía.');
        return;
    }
    
    if (!dbSeleccionada && !query.trim().toUpperCase().startsWith("CREATE DATABASE") && !query.trim().toUpperCase().startsWith("DROP DATABASE")) {
        mostrarError('Por favor, selecciona una base de datos primero.');
        return;
    }

    const response = await fetch('/ejecutar-consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbSeleccionada, query: query })
    });

    const data = await response.json();
    limpiarResultados();
    
    if (data.error) {
        mostrarError(data.error);
    } else {
        mostrarMensaje(data.message);
        if (data.resultados) {
            mostrarTabla(data.resultados);
        }
        // Si la consulta fue para crear o eliminar tablas, actualizamos la lista
        if (query.trim().toUpperCase().startsWith("CREATE TABLE") || query.trim().toUpperCase().startsWith("DROP TABLE")) {
            mostrarTablasDeDB(dbSeleccionada);
        }
    }
}

function limpiarResultados() {
    messageDisplay.textContent = '';
    resultsTable.innerHTML = '';
}

function mostrarMensaje(mensaje) {
    messageDisplay.textContent = `✅ Éxito: ${mensaje}`;
    messageDisplay.style.color = 'green';
}

function mostrarError(error) {
    messageDisplay.textContent = `❌ Error: ${error}`;
    messageDisplay.style.color = 'red';
}
function mostrarTabla(resultados) {
    // Comprobamos si el resultado es de un SHOW TABLES
    if (resultados.length > 0 && Object.keys(resultados[0]).includes('Tables_in_')) {
        if (resultados.length === 0) {
            resultsTable.textContent = 'No se encontraron tablas en la base de datos.';
            return;
        }
    } else {
        // Asumimos que es un SELECT u otra consulta que devuelve filas
        if (resultados === null || resultados.length === 0) {
            resultsTable.textContent = 'La consulta no devolvió ninguna fila de datos.';
            return;
        }
    }
    
    const table = document.createElement('table');
    const thead = table.createTHead();
    const tbody = table.createTBody();
    
    const columnas = Object.keys(resultados[0]);
    let row = thead.insertRow();
    columnas.forEach(col => {
        let th = document.createElement('th');
        th.textContent = col;
        row.appendChild(th);
    });
    
    resultados.forEach(res => {
        let row = tbody.insertRow();
        columnas.forEach(col => {
            let cell = row.insertCell();
            cell.textContent = res[col];
        });
    });
    
    resultsTable.appendChild(table);
}