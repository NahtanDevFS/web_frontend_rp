const distanceEl = document.getElementById("distance");
const ledButton = document.getElementById("led-toggle-button");
const ledStatusEl = document.getElementById("led-status");
const connectionStatusEl = document.getElementById("connection-status");

//esta URL se reemplazará por la del servidor de mi raspberry pi
const WEBSOCKET_URL =
  "wss://aqui-va-la-url-del-servidor-de-raspberry-pi.ngrok-free.app";

let ws;
let ledState = false;

function connect() {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.onopen = () => {
    console.log("Conectado al servidor WebSocket");
    connectionStatusEl.textContent = "Conectado";
    connectionStatusEl.style.color = "#4caf50";
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "distance") {
      distanceEl.textContent = data.value;
    } else if (data.type === "ledStatus") {
      ledState = data.value;
      updateUI();
    }
  };

  ws.onclose = () => {
    console.log(
      "Desconectado del servidor WebSocket. Reintentando en 3 segundos..."
    );
    connectionStatusEl.textContent = "Desconectado. Reintentando...";
    connectionStatusEl.style.color = "#f44336";
    setTimeout(connect, 3000); // Intenta reconectar al cabo de 3 segundos
  };

  ws.onerror = (error) => {
    console.error("Error de WebSocket:", error);
    ws.close();
  };
}

function updateUI() {
  if (ledState) {
    ledButton.textContent = "Apagar LED";
    ledStatusEl.textContent = "Encendido";
    ledStatusEl.style.color = "#87ceeb";
  } else {
    ledButton.textContent = "Encender LED";
    ledStatusEl.textContent = "Apagado";
    ledStatusEl.style.color = "#999";
  }
}

ledButton.addEventListener("click", () => {
  if (ws.readyState === WebSocket.OPEN) {
    const newState = !ledState;
    ws.send(JSON.stringify({ type: "toggleLED", value: newState }));
  } else {
    alert("No hay conexión con el servidor.");
  }
});

// Inicia la conexión
connect();
