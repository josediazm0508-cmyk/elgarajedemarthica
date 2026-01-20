const startyear = 2026;
const selectyear = document.getElementById("select-year");
const selectmonth = document.getElementById("select-month");
const selectweek = document.getElementById("select-week");
let chartMensualInstance = null;
let chartSemanalInstance = null;
const btnTheme = document.getElementById("btn-theme");

let ventas;
let productos;
let insumos;

let productosMap = {};
let insumosMap = {};

document.addEventListener("DOMContentLoaded", () => {
  ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];
  productos = JSON.parse(localStorage.getItem("productos_db")) || [];
  insumos = JSON.parse(localStorage.getItem("insumos_db")) || [];

  productosMap = {};
  productos.forEach((p) => (productosMap[p.id] = p));

  insumosMap = {};
  insumos.forEach((i) => (insumosMap[i.id] = i));

  document.getElementById("date-daily-resume").textContent =
    new Date().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  generarOptsAño();
  generarGraficas();
  calcularResumenDiario();

  const filtros = document.querySelectorAll(
    "#select-month, #select-year, #select-week",
  );

  filtros.forEach((select) => {
    select.addEventListener("change", () => {
      generarGraficas();
      calcularResumenDiario();
    });
  });

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  btnTheme.innerHTML =
    savedTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';
});

function generarOptsAño() {
  const container = selectyear;
  const currentYear = new Date().getFullYear();

  container.innerHTML = "";

  for (let i = startyear; i <= currentYear; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === currentYear) option.selected = true;
    container.appendChild(option);
  }
}

function generarGraficas() {
  const mes = formatMes(Number(selectmonth.value) - 1);
  const año = selectyear.value;

  const contextMonth = document.getElementById("graficaMensual");

  if (chartMensualInstance) {
    chartMensualInstance.destroy();
  }

  const mesSelect = Number(selectmonth.value) - 1;
  const yearSelect = Number(selectyear.value);

  const ventasFiltradas = ventas.filter((v) => {
    const fechaVenta = new Date(v.fecha);
    return (
      fechaVenta.getMonth() === mesSelect &&
      fechaVenta.getFullYear() === yearSelect
    );
  });

  const datosSemanas = [0, 0, 0, 0, 0];

  ventasFiltradas.forEach((v) => {
    const dia = new Date(v.fecha).getDate();
    const semana = Math.floor((dia - 1) / 7);
    datosSemanas[semana] += v.total;
  });

  chartMensualInstance = new Chart(contextMonth, {
    type: "bar",
    data: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"],
      datasets: [
        {
          label: `Ventas ${mes} ${año}`,
          data: datosSemanas,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: { scales: { y: { beginAtZero: true } } },
  });

  const contextWeek = document.getElementById("graficaSemanal");

  if (chartSemanalInstance) {
    chartSemanalInstance.destroy();
  }

  const semanaActiva = Number(selectweek.value);
  const inicio = (semanaActiva - 1) * 7 + 1;
  const fin = inicio + 6;

  const ventasDeLaSemana = ventasFiltradas.filter((v) => {
    const dia = new Date(v.fecha).getDate();
    return dia >= inicio && dia <= fin;
  });

  const datosDias = [0, 0, 0, 0, 0, 0, 0];

  ventasDeLaSemana.forEach((v) => {
    let diaSemana = new Date(v.fecha).getDay();
    let indiceAjustado = diaSemana === 0 ? 6 : diaSemana - 1;
    datosDias[indiceAjustado] += v.total;
  });

  chartSemanalInstance = new Chart(contextWeek, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
      datasets: [
        {
          label: `Detalle Semanal - ${selectweek.value}`,
          data: datosDias,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: { scales: { y: { beginAtZero: true } } },
  });
}

function formatMes(mes) {
  switch (mes) {
    case 0:
      return "Enero";
    case 1:
      return "Febrero";
    case 2:
      return "Marzo";
    case 3:
      return "Abril";
    case 4:
      return "Mayo";
    case 5:
      return "Junio";
    case 6:
      return "Julio";
    case 7:
      return "Agosto";
    case 8:
      return "Septiembre";
    case 9:
      return "Octubre";
    case 10:
      return "Noviembre";
    case 11:
      return "Diciembre";
  }
}

btnTheme.addEventListener("click", () => {
  const root = document.documentElement;
  const currentTheme = root.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  btnTheme.innerHTML =
    newTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';

  root.setAttribute("data-bs-theme", newTheme);

  localStorage.setItem("theme", newTheme);
});

function calcularResumenDiario() {
  const hoy = new Date().toISOString().split("T")[0];

  const ventasHoy = ventas.filter((v) => v.fecha.split("T")[0] === hoy);

  const totalVentas = ventasHoy.reduce((sum, v) => sum + v.total, 0);
  const numVentas = ventasHoy.length;

  let costoTotalHoy = 0;

  ventasHoy.forEach((venta) => {
    venta.items.forEach((item) => {
      const producto = productosMap[item.productoId];
      if (!producto) return;

      const costoUnitario = calcularCostoProducto(producto);
      costoTotalHoy += costoUnitario * item.cantidad;
    });
  });

  const ganancia = totalVentas - costoTotalHoy;
  const margen =
    totalVentas > 0 ? ((ganancia / totalVentas) * 100).toFixed(1) : 0;

  const contadorProductos = {};
  ventasHoy.forEach((v) => {
    v.items.forEach((item) => {
      if (!contadorProductos[item.productoId]) {
        contadorProductos[item.productoId] = {
          nombre: item.nombre,
          cantidad: 0,
        };
      }
      contadorProductos[item.productoId].cantidad += item.cantidad;
    });
  });

  const top3 = Object.values(contadorProductos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);

  actualizarResumenDiarioDOM(totalVentas, numVentas, ganancia, margen, top3);

  console.table({
    totalVentas,
    costoTotalHoy,
    ganancia,
    margen,
  });
}

function actualizarResumenDiarioDOM(total, num, ganancia, margen, top3) {
  const cards = document.querySelectorAll(".card-daily");

  cards[0].querySelector("h3").textContent = `Total: $${total.toLocaleString(
    "es-CO",
  )}`;
  cards[0].querySelector("h4").textContent = `No. Ventas: ${num}`;

  cards[1].querySelector("h3").textContent =
    `Ganancia neta: $${ganancia.toLocaleString("es-CO")}`;
  cards[1].querySelector("h4").textContent = `Margen: ${margen}%`;

  const ul = cards[2].querySelector("ul");
  ul.innerHTML = "";

  if (top3.length === 0) {
    ul.innerHTML = "<li>No hay ventas hoy</li>";
  } else {
    top3.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = `${p.nombre}: ${p.cantidad} unidades`;
      ul.appendChild(li);
    });
  }
}

document.getElementById("btn-backup").addEventListener("click", guardarBackup);

async function guardarBackup() {
  const backup = {
    app: "El Garaje de Marthica",
    version: "1.0",
    fecha: new Date().toISOString(),
    data: {
      productos,
      insumos,
      ventas,
    },
  };

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: `backup-garaje-${new Date().toISOString().split("T")[0]}.json`,
      types: [
        {
          description: "Backup JSON",
          accept: { "application/json": [".json"] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(backup, null, 2));
    await writable.close();

    alert("✅ Backup guardado correctamente");
  } catch (err) {
    console.log("Guardado cancelado", err);
  }
}

document.getElementById("importFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const backup = JSON.parse(event.target.result);

      if (!backup.data || !backup.data.productos || !backup.data.insumos) {
        alert("❌ Archivo de backup inválido");
        return;
      }

      if (!confirm("⚠️ Esto reemplazará los datos actuales. ¿Continuar?")) {
        return;
      }

      localStorage.setItem(
        "productos_db",
        JSON.stringify(backup.data.productos),
      );
      localStorage.setItem("insumos_db", JSON.stringify(backup.data.insumos));
      localStorage.setItem(
        "ventas_db",
        JSON.stringify(backup.data.ventas || []),
      );

      alert("✅ Datos importados correctamente");
      location.reload();
    } catch (err) {
      alert("❌ Error al leer el archivo");
      console.error(err);
    }
  };

  reader.readAsText(file);
});

function calcularCostoProducto(producto) {
  if (!producto.receta || producto.receta.length === 0) return 0;

  let costoUnitarioProducto = 0;

  producto.receta.forEach((r) => {
    const insumo = insumosMap[r.insumoId];
    if (!insumo) return;

    // Validaciones
    if (
      typeof insumo.precio_unitario !== "number" ||
      insumo.precio_unitario <= 0
    ) {
      console.warn("Insumo sin precio unitario:", insumo);
      return;
    }

    if (typeof r.cantidad !== "number" || r.cantidad <= 0) {
      console.warn("Cantidad inválida en receta:", r);
      return;
    }

    if (
      typeof producto.cantidadProducida !== "number" ||
      producto.cantidadProducida <= 0
    ) {
      console.warn("Producto sin cantidadProducida:", producto.nombre);
      return;
    }

    // r.cantidad = cantidad TOTAL usada en la producción
    const consumoUnitario = r.cantidad / producto.cantidadProducida;

    // costo de ese insumo para UNA unidad del producto
    costoUnitarioProducto += consumoUnitario * insumo.precio_unitario;
  });

  return Number(costoUnitarioProducto.toFixed(2));
}