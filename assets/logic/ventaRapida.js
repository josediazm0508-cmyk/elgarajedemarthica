let ventas = JSON.parse(localStorage.getItem("ventas_rapidas_db")) || [];

const btnTheme = document.getElementById("btn-theme");
const inputMonto = document.getElementById("monto-rapido");
const preview = document.getElementById("vr-preview");
const btnFacturar = document.getElementById("vr-facturar");
const btnLimpiar = document.getElementById("vr-limpiar");

// ==========================
// FECHA LOCAL
// ==========================
function fechaLocal() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });
}

function fechaHoraLocal() {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).replace(" ", "T");
}

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

  limpiarVentasAntiguas();
  iniciarVigilancia();
  cargarResumen();
  cargarHistorial();
  inputMonto.focus();
});

// ==========================
// LIMPIAR VENTAS DE DÍAS ANTERIORES
// ==========================
function limpiarVentasAntiguas() {
  const hoy = fechaLocal();

  if (ventas.length === 0) {
    localStorage.setItem("vr_ultimo_dia", hoy);
    return;
  }

  const fechaUltimaVenta = ventas[0].fecha.split("T")[0];

  if (fechaUltimaVenta !== hoy) {
    ventas = [];
    localStorage.removeItem("ventas_rapidas_db");
    alert("🌅 Nuevo día. El resumen fue reiniciado.");
  }

  localStorage.setItem("vr_ultimo_dia", hoy);
}

// ==========================
// VIGILAR CAMBIO DE DÍA (cada minuto)
// ==========================
function iniciarVigilancia() {
  setInterval(() => {
    const hoy = fechaLocal();

    if (ventas.length === 0) return;

    const fechaUltimaVenta = ventas[0].fecha.split("T")[0];

    if (fechaUltimaVenta !== hoy) {
      ventas = [];
      localStorage.removeItem("ventas_rapidas_db");
      localStorage.setItem("vr_ultimo_dia", hoy);

      cargarResumen();
      cargarHistorial();

      alert("🌅 Nuevo día detectado. El resumen fue reiniciado.");
    }
  }, 60000);
}

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
    fecha: fechaHoraLocal(),
    items: [],
    total: monto,
    tipo: "venta-rapida"
  };

  ventas.unshift(venta);

  try {
    localStorage.setItem("ventas_rapidas_db", JSON.stringify(ventas));
  } catch (e) {
    ventas = ventas.slice(0, 500);
    localStorage.setItem("ventas_rapidas_db", JSON.stringify(ventas));
    alert("⚠️ Almacenamiento casi lleno. Haz un backup.");
  }

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
  const hoy = fechaLocal();
  const ventasHoy = ventas.filter(v => v.fecha.split("T")[0] === hoy);
  const totalDia = ventasHoy.reduce((sum, v) => sum + v.total, 0);

  document.getElementById("vr-count").textContent = ventasHoy.length;
  document.getElementById("vr-total-dia").textContent = formatear(totalDia);
}

// ==========================
// HISTORIAL (solo hoy)
// ==========================
function cargarHistorial() {
  const lista = document.getElementById("vr-lista");
  const hoy = fechaLocal();
  const ventasHoy = ventas.filter(v => v.fecha.split("T")[0] === hoy);

  if (ventasHoy.length === 0) {
    lista.innerHTML = "<p>No hay ventas hoy</p>";
    return;
  }

  lista.innerHTML = ventasHoy
    .slice(0, 10)
    .map(v => `
      <div class="vr-venta-item">
        <span>${new Date(v.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
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
      <scr` + `ipt>
        window.onload = function(){
          window.print();
          window.onafterprint = () => window.close();
        }
      </scr` + `ipt>
    </body>
    </html>
  `);

  w.document.close();
}

// ==========================
// BACKUP Y LIMPIAR
// ==========================
document.getElementById("btn-backup").addEventListener("click", () => {
  const hoy = fechaLocal();
  const ventasHoy = ventas.filter(v => v.fecha.split("T")[0] === hoy);

  if (ventasHoy.length === 0) {
    alert("No hay ventas del día para exportar.");
    return;
  }

  const totalDia = ventasHoy.reduce((sum, v) => sum + v.total, 0);

  const backup = {
    app: "El Garaje de Marthica",
    tipo: "venta-rapida",
    fecha: hoy,
    resumen: {
      total_ventas: ventasHoy.length,
      total_dinero: totalDia
    },
    ventas: ventasHoy
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `venta-rapida_${hoy}.json`;
  a.click();
  URL.revokeObjectURL(url);

  ventas = [];
  localStorage.removeItem("ventas_rapidas_db");
  localStorage.removeItem("vr_ultimo_dia");

  cargarResumen();
  cargarHistorial();

  alert("✅ Backup guardado como venta-rapida_" + hoy + ".json\nEl sistema fue limpiado.");
});

// ==========================
// ATAJOS DE TECLADO
// ==========================
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") registrarVenta();
  if (e.key === "Escape") limpiarCaja();
});