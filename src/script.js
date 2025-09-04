const distanceEl = document.getElementById("distance");
const ledButton = document.getElementById("led-toggle-button");
const getDistanceButton = document.getElementById("get-distance-button");
const ledStatusEl = document.getElementById("led-status");
const connectionStatusEl = document.getElementById("connection-status");
const lastUpdatedEl = document.getElementById("last-updated");

const API_BASE_URL = "https://cfa91fa53a35.ngrok-free.app";

let ledState = false;
let isConnected = false;

// --- NUEVAS VARIABLES ---
// Guardará el temporizador para poder iniciarlo y detenerlo
let distanceInterval = null;
// Controla si la medición está activa
let isUpdatingDistance = false;

// Función para probar la conexión con el servidor
async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/distance`, {
      method: "GET",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      setConnectionStatus(true);
      return true;
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  }

  setConnectionStatus(false);
  return false;
}

// Función para actualizar el estado de conexión en la UI
function setConnectionStatus(connected) {
  isConnected = connected;
  if (connected) {
    connectionStatusEl.textContent = "Conectado";
    connectionStatusEl.className = "connected";
  } else {
    connectionStatusEl.textContent = "Desconectado";
    connectionStatusEl.className = "disconnected";
    ledStatusEl.textContent = "Desconocido";
    ledStatusEl.className = "led-off";
    distanceEl.textContent = "-- cm";

    // --- CAMBIO IMPORTANTE ---
    // Si se pierde la conexión, detenemos la medición automática
    if (isUpdatingDistance) {
      stopDistanceUpdates();
    }
  }
  ledButton.disabled = !connected;
  getDistanceButton.disabled = !connected;
}

// Función para controlar el LED (sin cambios)
async function controlLED(state) {
  if (!isConnected) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/led`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ state: state ? "on" : "off" }),
    });

    if (response.ok) {
      ledState = state;
      updateUI();
      return true;
    }
  } catch (error) {
    console.error("Error al controlar el LED:", error);
  }
  return false;
}

// Función para obtener la distancia
async function getDistance() {
  // Salimos de la función si no está conectado o si la medición no está activa
  if (!isConnected || !isUpdatingDistance) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/distance`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    if (response.ok) {
      const data = await response.json();
      // Nos aseguramos de que el servidor no devolvió un error
      if (data.distance !== undefined) {
        distanceEl.textContent = `${data.distance} cm`;
        updateLastUpdated();
      } else {
        console.error("Respuesta del servidor no contiene distancia:", data);
      }
    }
  } catch (error) {
    console.error("Error al obtener distancia:", error);
    // Detenemos las actualizaciones si hay un error para no saturar la consola
    stopDistanceUpdates();
  }
}

// --- NUEVAS FUNCIONES ---
function startDistanceUpdates() {
  isUpdatingDistance = true;
  getDistanceButton.textContent = "Detener Medición";
  getDistanceButton.classList.add("active");
  // Llamamos a la función una vez de inmediato
  getDistance();
  // Y luego la programamos para que se repita cada 1.5 segundos (1500 ms)
  distanceInterval = setInterval(getDistance, 1500);
}

function stopDistanceUpdates() {
  isUpdatingDistance = false;
  // Limpiamos el intervalo para que deje de ejecutarse
  clearInterval(distanceInterval);
  getDistanceButton.textContent = "Iniciar Medición";
  getDistanceButton.classList.remove("active");
}

// Función para actualizar la UI (sin cambios)
function updateUI() {
  if (ledState) {
    ledButton.textContent = "Apagar LED";
    ledStatusEl.textContent = "Encendido";
    ledStatusEl.className = "led-on";
  } else {
    ledButton.textContent = "Encender LED";
    ledStatusEl.textContent = "Apagado";
    ledStatusEl.className = "led-off";
  }
}

// Función para actualizar la hora (sin cambios)
function updateLastUpdated() {
  const now = new Date();
  lastUpdatedEl.textContent = now.toLocaleTimeString();
}

// Event listeners para los botones
ledButton.addEventListener("click", async () => {
  await controlLED(!ledState);
});

// --- LÓGICA DEL BOTÓN DE DISTANCIA ACTUALIZADA ---
getDistanceButton.addEventListener("click", () => {
  if (isUpdatingDistance) {
    stopDistanceUpdates(); // Si está midiendo, la detenemos
  } else {
    startDistanceUpdates(); // Si no, la iniciamos
  }
});

// Iniciar verificación de conexión periódica (sin cambios)
setInterval(checkConnection, 10000);

// Verificar conexión al cargar la página (sin cambios)
checkConnection();
