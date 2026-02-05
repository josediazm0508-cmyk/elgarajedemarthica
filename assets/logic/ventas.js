const btnTheme = document.getElementById("btn-theme");
let productos = JSON.parse(localStorage.getItem("productos_db")) || [];
let insumos = JSON.parse(localStorage.getItem("insumos_db")) || [];
let carrito = [];
let ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];
let ventaActualId = null; // Para guardar el ID de la venta recién creada

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

// ==================== SISTEMA DE IMPRESIÓN HTML ====================

// Función para imprimir factura en HTML
function imprimirFactura(ventaId) {
  const venta = ventas.find(v => v.id === ventaId);
  if (!venta) {
    alert('❌ No se encontró la venta');
    return;
  }

  // Crear ventana de impresión
  const ventanaImpresion = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
  
  if (!ventanaImpresion) {
    alert('❌ Por favor, permite ventanas emergentes para imprimir');
    return;
  }

  // Generar contenido HTML de la factura
  ventanaImpresion.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura #${venta.id} - El Garaje de Marthica</title>
      <meta charset="UTF-8">
      <style>
        /* Reset */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          width: 80mm; /* Ancho estándar ticket */
          margin: 0 auto;
          padding: 10px 5px;
        }
        
        .ticket {
          width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
        }
        
        .logo {
          max-width: 150px;
          height: auto;
          margin: 0 auto 10px;
          display: block;
        }
        
        .empresa-nombre {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .empresa-info {
          font-size: 12px;
          margin-bottom: 3px;
        }
        
        .separator {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        
        .section-title {
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          font-size: 16px;
        }
        
        .factura-info {
          margin-bottom: 15px;
        }
        
        .factura-info div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .items-table {
          width: 100%;
          margin: 15px 0;
          border-collapse: collapse;
        }
        
        .items-table th {
          text-align: left;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          font-weight: bold;
        }
        
        .items-table td {
          padding: 4px 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .cantidad {
          text-align: center;
          width: 50px;
        }
        
        .precio {
          text-align: right;
          width: 80px;
        }
        
        .total {
          margin-top: 15px;
          border-top: 2px solid #000;
          padding-top: 10px;
        }
        
        .total-line {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 16px;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: 12px;
        }
        
        .mensaje {
          margin-top: 15px;
          text-align: center;
          font-style: italic;
        }
        
        /* Estilos específicos para impresión */
        @media print {
          body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 5px !important;
          }
          
          @page {
            margin: 0;
            size: auto;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        /* Botón de impresión (solo visible en pantalla) */
        .print-btn {
          display: block;
          width: 100%;
          margin: 20px auto;
          padding: 10px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          text-align: center;
        }
        
        .print-btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <!-- Encabezado -->
        <div class="header">
          <img class="logo" src="${window.location.origin}/images/mainlogo.png" alt="Logo El Garaje de Marthica" onerror="this.style.display='none'">
          <div class="empresa-nombre">EL GARAJE DE MARTHICA</div>
          <div class="empresa-info">NIT: 123456789-0</div>
          <div class="empresa-info">Tel: 300 123 4567</div>
          <div class="empresa-info">Calle Principal #123</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Información de la factura -->
        <div class="factura-info">
          <div>
            <span><strong>Factura:</strong></span>
            <span>#${venta.id}</span>
          </div>
          <div>
            <span><strong>Fecha:</strong></span>
            <span>${new Date(venta.fecha).toLocaleString("es-CO", {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div>
            <span><strong>Cajero:</strong></span>
            <span>Sistema POS</span>
          </div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Items de la venta -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="cantidad">Cant</th>
              <th class="precio">Total</th>
            </tr>
          </thead>
          <tbody>
            ${venta.items.map(item => `
              <tr>
                <td>${item.nombre}</td>
                <td class="cantidad">${item.cantidad}</td>
                <td class="precio">$${(item.precio * item.cantidad).toLocaleString("es-CO")}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="separator"></div>
        
        <!-- Totales -->
        <div class="total">
          <div class="total-line">
            <span>TOTAL:</span>
            <span>$${venta.total.toLocaleString("es-CO")}</span>
          </div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Footer -->
        <div class="footer">
          <div>Gracias por su compra</div>
          <div>¡Vuelva pronto!</div>
          <div class="mensaje">Este ticket es su comprobante de pago</div>
        </div>
        
        <!-- Botón de impresión (solo visible en pantalla) -->
        <button class="print-btn no-print" onclick="window.print();">
          🖨️ Imprimir Factura
        </button>
        
        <button class="print-btn no-print" onclick="window.close();" style="background: #6c757d; margin-top: 10px;">
          ✖️ Cerrar Ventana
        </button>
      </div>
      
      <script>
        // Auto-imprimir después de cargar
        window.onload = function() {
          // Esperar a que cargue todo
          setTimeout(() => {
            // Intentar imprimir automáticamente
            try {
              window.print();
            } catch (e) {
              console.log("Auto-print falló:", e);
            }
            
            // Configurar para cerrar después de imprimir
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 1000);
            };
          }, 1000);
        };
        
        // Si el usuario cierra manualmente la impresión
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            setTimeout(() => {
              window.close();
            }, 500);
          }
        });
      </script>
    </body>
    </html>
  `);

  ventanaImpresion.document.close();
}

// ==================== FIN SISTEMA DE IMPRESIÓN ====================

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
    fecha: new Date().toISOString(),
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

  // Limpiar carrito
  carrito = [];
  renderCarrito();
  cargarVentasHoy();
  cargarHistorialVentas();

  // Preguntar si desea imprimir
  const deseaImprimir = confirm("✅ Venta registrada correctamente\n\n¿Desea imprimir la factura?");
  
  if (deseaImprimir) {
    imprimirFactura(venta.id);
  }
});

// VENTAS DEL DÍA
function cargarVentasHoy() {
  const hoy = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

  const ventasHoy = ventas.filter((v) => v.fecha.split("T")[0] === hoy);

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

  ventaActualId = ventaId; // Guardar ID para el botón de imprimir

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
  document.getElementById("overlay").style.display = "block";
}

// Botón imprimir desde modal
document.getElementById("btn-imprimir-factura").addEventListener("click", () => {
  if (!ventaActualId) return;
  imprimirFactura(ventaActualId);
});

document.getElementById("cerrar-modal").addEventListener("click", () => {
  document.getElementById("modal-factura").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  ventaActualId = null;
});

document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("modal-factura").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  ventaActualId = null;
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

// Función simple para "abrir caja" (solo simulación)
function abrirCajaSimulada() {
  alert("💰 Caja registradora abierta (simulación)\n\nPara una impresora real, configure la impresión automática desde el diálogo de impresión del navegador.");
}

// Si tienes botones para control de impresora, los reemplazamos
document.addEventListener("DOMContentLoaded", () => {
  // Reemplazar botones de impresión serial por versiones simuladas
  const btnProbarImpresora = document.getElementById("btn-probar-impresora");
  const btnAbrirCaja = document.getElementById("btn-abrir-caja");
  
  if (btnProbarImpresora) {
    btnProbarImpresora.addEventListener("click", function() {
      // Crear una ventana de prueba
      const ventanaPrueba = window.open('', '_blank', 'width=400,height=400');
      ventanaPrueba.document.write(`
        <html>
        <head><title>Prueba de Impresión</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h2>🎯 Prueba de Impresión HTML</h2>
          <p>Este es un documento de prueba.</p>
          <p>Haz clic en Imprimir para ver cómo se vería tu factura.</p>
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🖨️ Probar Impresión
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            ✖️ Cerrar
          </button>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            <strong>Configuración recomendada:</strong><br>
            1. Selecciona "Guardar como PDF"<br>
            2. Configura el tamaño a 80mm de ancho<br>
            3. Márgenes: Mínimos o Ninguno
          </p>
        </body>
        </html>
      `);
      ventanaPrueba.document.close();
    });
  }
  
  if (btnAbrirCaja) {
    btnAbrirCaja.addEventListener("click", abrirCajaSimulada);
  }
});