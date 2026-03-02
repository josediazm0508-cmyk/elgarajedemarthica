let ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];

const btnTheme = document.getElementById("btn-theme");
const inputMonto = document.getElementById("monto-rapido");
const preview = document.getElementById("vr-preview");
const btnFacturar = document.getElementById("vr-facturar");
const btnLimpiar = document.getElementById("vr-limpiar");

// ==========================
// INICIO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";

  btnTheme.innerHTML =
    savedTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';

  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  cargarResumen();
  cargarHistorial();
  inputMonto.focus();
});

// ==========================
// FORMATEO
// ==========================
function formatear(valor) {
  return "$" + Number(valor).toLocaleString("es-CO");
}

// ==========================
// INPUT (solo números)
// ==========================
inputMonto.addEventListener("input", () => {
  inputMonto.value = inputMonto.value.replace(/\D/g, "");
  preview.textContent = formatear(inputMonto.value || 0);
});

// ==========================
// LIMPIAR
// ==========================
function limpiarCaja() {
  inputMonto.value = "";
  preview.textContent = "$0";
  inputMonto.focus();
}

btnLimpiar.addEventListener("click", limpiarCaja);

// ==========================
// REGISTRAR VENTA
// ==========================
function registrarVenta() {
  const monto = Number(inputMonto.value);

  if (!monto || monto <= 0) {
    alert("Ingrese un monto válido");
    return;
  }

  const venta = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    items: [],
    total: monto,
    tipo: "venta-rapida"
  };

  ventas.unshift(venta);
  localStorage.setItem("ventas_db", JSON.stringify(ventas));

  limpiarCaja();
  cargarResumen();
  cargarHistorial();

  const imprimir = confirm("✅ Venta registrada\n\n¿Imprimir comprobante?");
  if (imprimir) imprimirTicketSimple(venta);
}

btnFacturar.addEventListener("click", registrarVenta);

// ==========================
// RESUMEN DEL DÍA
// ==========================
function cargarResumen() {
  const hoy = new Date().toISOString().split("T")[0];

  const ventasHoy = ventas.filter(v => v.fecha.split("T")[0] === hoy);
  const totalDia = ventasHoy.reduce((sum, v) => sum + v.total, 0);

  document.getElementById("vr-count").textContent = ventasHoy.length;
  document.getElementById("vr-total-dia").textContent = formatear(totalDia);
}

// ==========================
// HISTORIAL
// ==========================
function cargarHistorial() {
  const lista = document.getElementById("vr-lista");

  lista.innerHTML = ventas
    .slice(0, 10)
    .map(v => `
      <div class="vr-venta-item">
        <span>#${v.id}</span>
        <span>${formatear(v.total)}</span>
      </div>
    `)
    .join("");
}

// ==========================
// IMPRIMIR
// ==========================
function imprimirTicketSimple(venta) {
  const w = window.open("", "_blank", "width=300,height=500");

  w.document.write(`
    <html>
    <body style="font-family: monospace; text-align:center;">
      <h3>El Garaje de Marthica</h3>
      <hr>
      <p>Factura #${venta.id}</p>
      <p>${new Date(venta.fecha).toLocaleString("es-CO")}</p>
      <hr>
      <h2>${formatear(venta.total)}</h2>
      <hr>
      <p>Gracias por su compra</p>
      <script>
        window.onload = function(){
          window.print();
          window.onafterprint = () => window.close();
        }
      </script>
    </body>
    </html>
  `);

  w.document.close();
}

// ==========================
// ATAJOS DE TECLADO
// ==========================
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") registrarVenta();
  if (e.key === "Escape") limpiarCaja();
});