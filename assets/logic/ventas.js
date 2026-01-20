const btnTheme = document.getElementById("btn-theme");
let productos = JSON.parse(localStorage.getItem("productos_db")) || [];
let insumos = JSON.parse(localStorage.getItem("insumos_db")) || [];
let carrito = [];
let ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-factura").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  const savedTheme = localStorage.getItem("theme") || "light";
  btnTheme.innerHTML =
    savedTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';
  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  cargarVentasHoy();
  cargarHistorialVentas();
});

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

// BUSCADOR DE PRODUCTOS
const searchInput = document.getElementById("search-producto");
const resultadosDiv = document.getElementById("resultados-busqueda");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();

  if (query.length < 2) {
    resultadosDiv.innerHTML = "";
    return;
  }

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(query),
  );

  resultadosDiv.innerHTML = filtrados
    .map(
      (p) => `
    <div class="resultado-item" onclick="agregarAlCarrito(${p.id})">
      <span>${p.nombre}</span>
      <span>$${p.precioVenta.toLocaleString("es-CO")}</span>
    </div>
  `,
    )
    .join("");
});

// AGREGAR AL CARRITO
function agregarAlCarrito(productoId) {
  if (!hayStockDisponible(productoId)) {
    alert("❌ Stock insuficiente para este producto");
    return;
  }

  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return;

  const enCarrito = carrito.find((item) => item.productoId === productoId);

  if (enCarrito) {
    enCarrito.cantidad++;
  } else {
    carrito.push({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precioVenta,
      cantidad: 1,
    });
  }

  renderCarrito();
  searchInput.value = "";
  resultadosDiv.innerHTML = "";
}

// RENDERIZAR CARRITO
function renderCarrito() {
  const container = document.getElementById("items-carrito");

  if (carrito.length === 0) {
    container.innerHTML =
      '<p class="carrito-vacio">No hay productos agregados</p>';
    document.getElementById("count-items").textContent = "0";
    document.getElementById("total-venta").textContent = "$0";
    return;
  }

  container.innerHTML = carrito
    .map(
      (item, index) => `
    <div class="item-carrito">
      <span class="nombre">${item.nombre}</span>
      <div class="cantidad-control">
        <button onclick="cambiarCantidad(${index}, -1)">-</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)"${!hayStockParaCantidad(item.productoId, item.cantidad + 1) ? "disabled" : ""} ${!hayStockParaCantidad(item.productoId, item.cantidad + 1) ? 'class="disabled"' : ""}>+</button>
      </div>
      <span class="precio">$${(item.precio * item.cantidad).toLocaleString("es-CO")}</span>
      <button onclick="eliminarItem(${index})" class="btn-eliminar">🗑️</button>
    </div>
  `,
    )
    .join("");

  const total = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  const totalItems = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  document.getElementById("count-items").textContent = totalItems;
  document.getElementById("total-venta").textContent =
    `$${total.toLocaleString("es-CO")}`;
}

function cambiarCantidad(index, delta) {
  const item = carrito[index];
  if (!item) return;

  if (delta > 0) {
    const nuevaCantidad = item.cantidad + 1;

    if (!hayStockParaCantidad(item.productoId, nuevaCantidad)) {
      alert("❌ Stock insuficiente");
      return;
    }

    item.cantidad = nuevaCantidad;
  } else {
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      carrito.splice(index, 1);
    }
  }

  renderCarrito();
}

function eliminarItem(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

// LIMPIAR CARRITO
document.getElementById("btn-limpiar").addEventListener("click", () => {
  if (carrito.length === 0) return;
  if (confirm("¿Limpiar todos los productos?")) {
    carrito = [];
    renderCarrito();
  }
});

// FACTURAR
document.getElementById("btn-facturar").addEventListener("click", async () => {
  for (const item of carrito) {
    if (!hayStockParaCantidad(item.productoId, item.cantidad)) {
      alert("❌ Stock insuficiente para completar la venta");
      return;
    }
  }

  if (carrito.length === 0) {
    alert("Agrega productos a la venta");
    return;
  }

  const venta = {
    id: Date.now(),
    fecha: new Date().toLocaleString("sv-SE"),
    items: JSON.parse(JSON.stringify(carrito)),
    total: carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
  };

  // Descontar stock
  carrito.forEach((item) => {
    const producto = productos.find((p) => p.id === item.productoId);
    if (!producto) return;

    producto.receta.forEach((ingrediente) => {
      const insumo = insumos.find((i) => i.id == ingrediente.insumoId);
      if (insumo) {
        insumo.stock_actual -= ingrediente.cantidad * item.cantidad;
      }
    });
  });

  // Guardar
  ventas.unshift(venta);
  localStorage.setItem("ventas_db", JSON.stringify(ventas));
  localStorage.setItem("insumos_db", JSON.stringify(insumos));

  // Limpiar
  carrito = [];
  renderCarrito();
  cargarVentasHoy();
});

// VENTAS DEL DÍA
function cargarVentasHoy() {
  const hoy = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

  const ventasHoy = ventas.filter((v) => v.fecha.split(" ")[0] === hoy);

  const container = document.getElementById("ventas-hoy");

  if (ventasHoy.length === 0) {
    container.innerHTML = "<p>No hay ventas registradas hoy</p>";
    return;
  }

  container.innerHTML = ventasHoy
    .map(
      (v) => `
      <div class="venta-card" onclick="verDetalleFactura(${v.id})">
        <p><strong>Factura #${v.id}</strong></p>
        <p>${new Date(v.fecha).toLocaleTimeString("es-CO")}</p>
        <p>Total: $${v.total.toLocaleString("es-CO")}</p>
      </div>
    `,
    )
    .join("");
}

function hayStockDisponible(productoId) {
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return false;

  // Cantidad que ya hay en el carrito
  const enCarrito = carrito.find((i) => i.productoId === productoId);
  const cantidadActual = enCarrito ? enCarrito.cantidad : 0;

  // Validar cada ingrediente
  for (const ing of producto.receta) {
    const insumo = insumos.find((i) => i.id == ing.insumoId);
    if (!insumo) return false;

    const requerido = ing.cantidad * (cantidadActual + 1);

    if (insumo.stock_actual < requerido) {
      return false;
    }
  }

  return true;
}

function hayStockParaCantidad(productoId, cantidadDeseada) {
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return false;

  for (const ing of producto.receta) {
    const insumo = insumos.find((i) => i.id == ing.insumoId);
    if (!insumo) return false;

    const requerido = ing.cantidad * cantidadDeseada;

    if (insumo.stock_actual < requerido) {
      return false;
    }
  }

  return true;
}

function verDetalleFactura(ventaId) {
  const venta = ventas.find((v) => v.id === ventaId);
  if (!venta) return;

  const container = document.getElementById("detalle-factura");

  container.innerHTML = `
    <p><strong>Factura:</strong> #${venta.id}</p>
    <p><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString("es-CO")}</p>
    <hr>

    ${venta.items
      .map(
        (item) => `
      <div class="detalle-item">
        <span>${item.nombre} x${item.cantidad}</span>
        <span>$${(item.precio * item.cantidad).toLocaleString("es-CO")}</span>
      </div>
    `,
      )
      .join("")}

    <hr>

    <div class="detalle-total">
      <span>TOTAL</span>
      <span>$${venta.total.toLocaleString("es-CO")}</span>
    </div>
  `;

  document.getElementById("modal-factura").style.display = "flex";
}

document.getElementById("cerrar-modal").addEventListener("click", () => {
  document.getElementById("modal-factura").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

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

function cargarHistorialVentas(fecha = null) {
  const container = document.getElementById("ventas-historial");

  let lista = ventas;

  if (fecha) {
    lista = ventas.filter((v) => v.fecha.split("T")[0] === fecha);
  }

  if (lista.length === 0) {
    container.innerHTML = "<p>No hay ventas registradas</p>";
    return;
  }

  container.innerHTML = lista
    .map(
      (v) => `
      <div class="venta-card" onclick="verDetalleFactura(${v.id})">
        <p><strong>Factura #${v.id}</strong></p>
        <p>${new Date(v.fecha).toLocaleString("es-CO")}</p>
        <p>Total: $${v.total.toLocaleString("es-CO")}</p>
      </div>
    `,
    )
    .join("");
}

document.getElementById("filtro-fecha").addEventListener("change", (e) => {
  cargarHistorialVentas(e.target.value);
});

document.getElementById("btn-ver-todas").addEventListener("click", () => {
  cargarHistorialVentas();
});