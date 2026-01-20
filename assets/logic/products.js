const btnTheme = document.getElementById("btn-theme");
const overlay = document.getElementById("overlay");
const modal_add = document.getElementById("modal-add");
let receta = [];
let editando = null;
let insumos = [];
let productos = [];
let ventas;

document.addEventListener("DOMContentLoaded", async () => {

  ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];
  productos = JSON.parse(localStorage.getItem("productos_db")) || [];
  insumos = JSON.parse(localStorage.getItem("insumos_db")) || [];

  const savedTheme = localStorage.getItem("theme") || "light";

  btnTheme.innerHTML =
    savedTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';

  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  renderTablaProductos(productos);
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

document.getElementById("add-prod").addEventListener("click", () => {
  document.querySelectorAll(".campo-requerido").forEach((e) => {
    e.classList.remove("error-input");
    e.value = "";
  });

  receta = [];
  editando = null;

  modal_add.style.display = "flex";
  overlay.style.display = "block";

  document.getElementById("tit-form").textContent = "Agregar Nuevo Producto";
  document.getElementById("btn_guardar").textContent = "💾 Guardar Producto";
  document.getElementById("insumos").innerHTML = "";
  document.getElementById("status-insumos").textContent =
    "No hay insumos agregados para este producto";
  document.getElementById("div-nuevo-insumo").style.display = "none";
  actualizarTotales();
});

document.getElementById("btn-add-insumo").addEventListener("click", (e) => {
  e.preventDefault();

  document.getElementById("btn-add-insumo").classList.add("deshabilitado");
  document.getElementById("btn-add-insumo").setAttribute("disabled", "");

  document.querySelectorAll(".campo-requerido-insumo").forEach((e) => {
    e.classList.remove("error-input");
    e.value = "";
  });

  valoresSelectInsumos();
  document.getElementById("div-nuevo-insumo").style.display = "flex";
});

function valoresSelectInsumos() {
  const select = document.getElementById("opciones-insumos");
  select.innerHTML =
    '<option value="" selected disabled>Seleccione un insumo...</option>';

  insumos.forEach((i) => {
    if (receta.length > 0) {
      let existe = receta.find((r) => r.insumoId == i.id);

      if (!existe) {
        let option = document.createElement("option");
        option.textContent = i.nombre;
        option.value = i.id;
        option.dataset.unidad = i.unidad_base;
        select.appendChild(option);
      }
    } else {
      let option = document.createElement("option");
      option.textContent = i.nombre;
      option.value = i.id;
      option.dataset.unidad = i.unidad_base;
      select.appendChild(option);
    }
  });
}

document.getElementById("opciones-insumos").addEventListener("change", (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const unidad = selectedOption.dataset.unidad;
  document.getElementById("span-unidad-base").textContent = unidad || "";
});

document.getElementById("cancel-add-insumo").addEventListener("click", (e) => {
  e.preventDefault();

  document.getElementById("btn-add-insumo").classList.remove("deshabilitado");
  document.getElementById("btn-add-insumo").removeAttribute("disabled");

  document.getElementById("div-nuevo-insumo").style.display = "none";
  document.getElementById("opciones-insumos").value = "";
  document.getElementById("input-cantidad-insumo").value = "";
  editando = null;
});

document.getElementById("confirm-add-insumo").addEventListener("click", (e) => {
  e.preventDefault();

  if (!validarCampos(".campo-requerido-insumo")) return;

  const idInsumoSeleccionado =
    document.getElementById("opciones-insumos").value;
  const cantidadIngresada = parseFloat(
    document.getElementById("input-cantidad-insumo").value,
  );

  if (editando) {
    const index = receta.findIndex((r) => r.id === editando);
    if (index === -1) return;

    receta[index].insumoId = idInsumoSeleccionado;
    receta[index].cantidad = cantidadIngresada;
    editando = null;
  } else {
    let nuevo_ingrediente = {
      id: Date.now(),
      insumoId: idInsumoSeleccionado,
      cantidad: cantidadIngresada,
    };
    receta.push(nuevo_ingrediente);
  }

  document.getElementById("btn-add-insumo").classList.remove("deshabilitado");
  document.getElementById("btn-add-insumo").removeAttribute("disabled");

  mostrarReceta(receta);
  actualizarTotales();
  document.getElementById("div-nuevo-insumo").style.display = "none";
  document.getElementById("opciones-insumos").value = "";
  document.getElementById("input-cantidad-insumo").value = "";
});

function mostrarReceta(array) {
  const container = document.getElementById("insumos");
  container.innerHTML = "";

  array.forEach((e) => {
    const insumo = insumos.find((i) => i.id == e.insumoId);
    if (!insumo) return;

    let card = document.createElement("div");
    card.classList.add("card-insumo");

    let nombre = document.createElement("p");
    nombre.textContent = insumo.nombre;

    let cant = document.createElement("p");
    cant.textContent = e.cantidad + insumo.unidad_base;

    let subtotal = document.createElement("p");
    subtotal.textContent =
      "$" + (e.cantidad * insumo.precio_unitario).toLocaleString("es-CO");

    let acciones = document.createElement("div");

    let btn_edit = document.createElement("button");
    btn_edit.classList.add("btn-primary");
    btn_edit.innerHTML = '<i class="bi bi-pencil-square"></i>';
    btn_edit.addEventListener("click", (event) => {
      event.preventDefault();
      editarInsumo(e.id);
    });

    let btn_delete = document.createElement("button");
    btn_delete.classList.add("btn-secondary");
    btn_delete.innerHTML = '<i class="bi bi-x-lg"></i>';
    btn_delete.addEventListener("click", (event) => {
      event.preventDefault();
      deleteInsumo(e.id);
    });

    acciones.appendChild(btn_edit);
    acciones.appendChild(btn_delete);

    card.appendChild(nombre);
    card.appendChild(cant);
    card.appendChild(subtotal);
    card.appendChild(acciones);

    container.appendChild(card);
  });
}

function validarCampos(tipocampo) {
  const campos = document.querySelectorAll(tipocampo);
  let esValido = true;

  campos.forEach((e) => {
    const valor = e.value.trim();
    if (
      valor === "" ||
      (e.type === "number" &&
        (isNaN(parseFloat(valor)) || parseFloat(valor) <= 0))
    ) {
      e.classList.add("error-input");
      esValido = false;
    } else {
      e.classList.remove("error-input");
    }
  });

  return esValido;
}

function editarInsumo(idreceta) {
  let prodreceta = receta.find((r) => r.id === idreceta);
  if (!prodreceta) return;

  const insumoEncontrado = insumos.find((i) => i.id == prodreceta.insumoId);
  if (!insumoEncontrado) return;

  const select = document.getElementById("opciones-insumos");
  select.innerHTML = `<option value="${prodreceta.insumoId}">${insumoEncontrado.nombre}</option>`;

  document.getElementById("div-nuevo-insumo").style.display = "flex";
  document.getElementById("opciones-insumos").value = prodreceta.insumoId;
  document.getElementById("input-cantidad-insumo").value = prodreceta.cantidad;
  document.getElementById("span-unidad-base").textContent =
    insumoEncontrado.unidad_base;

  editando = idreceta;
}

function actualizarTotales() {
  let total = 0;
  receta.forEach((r) => {
    let insumo = insumos.find((i) => i.id == r.insumoId);
    if (insumo) total += r.cantidad * insumo.precio_unitario;
  });

  document.getElementById("costo-prod").textContent =
    "$" + total.toLocaleString("es-CO");

  const status = document.getElementById("status-insumos");
  status.textContent =
    receta.length > 0
      ? `Este producto tiene ${receta.length} insumo${
          receta.length > 1 ? "s" : ""
        } agregado${receta.length > 1 ? "s" : ""}`
      : "No hay insumos agregados para este producto";

  const precioInput = document.getElementById("input-precio");
  const cantidadProducidaInput = document.getElementById(
    "input-cantidad-producida",
  );

  if (precioInput && cantidadProducidaInput) {
    const precioVenta = parseFloat(precioInput.value) || 0;
    const cantidadProducida = parseFloat(cantidadProducidaInput.value) || 1;

    const costoUnitario = total / cantidadProducida;
    const margen = calcularMargen(precioVenta, costoUnitario);

    document.getElementById("costo-unitario").textContent =
      "$" + costoUnitario.toFixed(2);
    document.getElementById("costo-calculado").textContent =
      margen.toFixed(2) + "%";
  }
}

function deleteInsumo(id) {
  receta = receta.filter((r) => r.id !== id);
  mostrarReceta(receta);
  actualizarTotales();
}

document.getElementById("form-prod").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validarCampos(".campo-requerido")) return;

  if (receta.length <= 0) {
    document.getElementById("insumos").innerHTML =
      `<p class="error-insumos">Seleccione al menos un (1) insumo para este producto</p>`;
    return;
  }

  const nombre = document.getElementById("input-nombre").value.trim();
  const precioVenta = parseFloat(document.getElementById("input-precio").value);
  const categoria = document.getElementById("input-categoria").value.trim();
  const cantidadProducida = parseFloat(
    document.getElementById("input-cantidad-producida").value,
  );

  const producto = {
    id: Date.now(),
    nombre,
    precioVenta,
    categoria: categoria || "Sin categoría",
    cantidadProducida: cantidadProducida,
    receta: JSON.parse(JSON.stringify(receta)),
    activo: true,
    createdAt: new Date().toISOString(),
  };

  productos.push(producto);
  localStorage.setItem("productos_db", JSON.stringify(productos));

  renderTablaProductos(productos);
  cerrarModalProducto();
  alert("✅ Producto guardado correctamente");
});

function renderTablaProductos(lista) {
  const tbody = document.getElementById("tabla-insumos");
  tbody.innerHTML = "";

  lista.forEach((p) => {
    const costo = calcularCostoUnitario(p.receta, p.cantidadProducida);
    const margen = calcularMargen(p.precioVenta, costo);
    const rentable = margen > 0;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>$${p.precioVenta.toLocaleString("es-CO")}</td>
      <td>$${costo.toLocaleString("es-CO")}</td>
      <td>${margen.toFixed(2)}%</td>
      <td>${rentable ? "✅ Rentable" : "❌ No rentable"}</td>
      <td class="divacciones">
        <button class="btn-primary" onclick="editarProducto(${
          p.id
        })"><i class="bi bi-pencil-square"></i></button>
        <button class="btn-secondary" onclick="eliminarProducto(${
          p.id
        })"><i class="bi bi-x-lg"></i></button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function calcularCostoUnitario(recetaProducto, cantidadProducida) {
  let totalCosto = 0;
  recetaProducto.forEach((r) => {
    const insumo = insumos.find((i) => i.id == r.insumoId);
    if (insumo) totalCosto += r.cantidad * insumo.precio_unitario;
  });

  return totalCosto / (cantidadProducida || 1);
}

function calcularMargen(precio, costo) {
  if (precio <= 0) return 0;
  return ((precio - costo) / precio) * 100;
}

function editarProducto(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  receta = JSON.parse(JSON.stringify(producto.receta));

  document.getElementById("input-nombre").value = producto.nombre;
  document.getElementById("input-precio").value = producto.precioVenta;
  document.getElementById("input-categoria").value =
    producto.categoria === "Sin categoría" ? "" : producto.categoria;
  document.getElementById("input-cantidad-producida").value =
    producto.cantidadProducida || 1;

  productos = productos.filter((p) => p.id !== id);
  localStorage.setItem("productos_db", JSON.stringify(productos));

  mostrarReceta(receta);
  actualizarTotales();

  modal_add.style.display = "flex";
  overlay.style.display = "block";

  document.getElementById("tit-form").textContent = "Editar Producto";
  document.getElementById("btn_guardar").textContent = "💾 Actualizar Producto";
  document.getElementById("div-nuevo-insumo").style.display = "none";
}

function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  productos = productos.filter((p) => p.id !== id);
  localStorage.setItem("productos_db", JSON.stringify(productos));
  renderTablaProductos(productos);
  alert("✅ Producto eliminado");
}

function cerrarModalProducto() {
  modal_add.style.display = "none";
  overlay.style.display = "none";

  document.getElementById("form-prod").reset();
  document.getElementById("insumos").innerHTML = "";
  document.getElementById("status-insumos").textContent =
    "No hay insumos agregados para este producto";
  document.getElementById("div-nuevo-insumo").style.display = "none";

  receta = [];
  editando = null;
  actualizarTotales();
}

document
  .getElementById("btn-close-add")
  .addEventListener("click", cerrarModalProducto);
overlay.addEventListener("click", cerrarModalProducto);

document
  .getElementById("input-precio")
  .addEventListener("input", actualizarTotales);
document
  .getElementById("input-cantidad-producida")
  .addEventListener("input", actualizarTotales);

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