let insumos;
const container_insumos = document.getElementById("tabla-insumos");
const overlay = document.getElementById("overlay");
const modal_add = document.getElementById("modal-add");
const modal_delete = document.getElementById("modal-delete");
let editandoID = null;
const btnTheme = document.getElementById("btn-theme");
let ventas;
let productos;

document.addEventListener("DOMContentLoaded", async () => {

  ventas = JSON.parse(localStorage.getItem("ventas_db")) || [];
  productos = JSON.parse(localStorage.getItem("productos_db")) || [];

  const savedTheme = localStorage.getItem("theme") || "light";

  btnTheme.innerHTML =
    savedTheme === "dark"
      ? '<i class="bi bi-moon-stars-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';

  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  const data = localStorage.getItem("insumos_db");

  if (data) {
    insumos = JSON.parse(data);
  } else {
    const response = await fetch("../data/insumos.json");
    insumos = await response.json();
    localStorage.setItem("insumos_db", JSON.stringify(insumos));
  }

  mostrarInsumos(insumos);
  ocultarModales();
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

function mostrarInsumos(array) {
  container_insumos.innerHTML = "";
  let insumos_criticos = 0;

  array.forEach((e) => {
    let producto = document.createElement("tr");

    let nombre = document.createElement("td");
    nombre.textContent = e.nombre;

    let marca = document.createElement("td");
    marca.textContent = e.marca || "Sin marca";

    let actual_stock = document.createElement("td");
    actual_stock.textContent = `${e.stock_actual.toLocaleString("es-CO")} ${
      e.unidad_base
    }`;

    let minimo_stock = document.createElement("td");
    minimo_stock.textContent = `${e.stock_minimo.toLocaleString("es-CO")} ${
      e.unidad_base
    }`;

    let status = document.createElement("td");
    let estado;

    if (e.stock_actual <= e.stock_minimo) {
      estado = "Crítico";
      producto.classList.add("status-alert");
      insumos_criticos++;
    } else if (e.stock_actual <= e.stock_minimo * 1.5) {
      estado = "Bajo";
      producto.classList.add("status-low");
    } else {
      estado = "Ok";
      producto.classList.add("status-ok");
    }

    status.textContent = estado;

    let precio_unit = document.createElement("td");
    precio_unit.textContent = `$${e.precio_presentacion.toLocaleString(
      "es-CO",
    )}`;

    let precio_porunidad = document.createElement("td");
    precio_porunidad.textContent = `$${e.precio_unitario.toLocaleString(
      "es-CO",
    )}/${e.unidad_base}`;

    let tdbuttons = document.createElement("td");

    let divacciones = document.createElement("div");

    let button_edit = document.createElement("button");
    button_edit.innerHTML = '<i class="bi bi-pencil-square"></i>';
    button_edit.addEventListener("click", () => editarInsumo(e.id));
    button_edit.classList.add("btn-edit");

    let button_delete = document.createElement("button");
    button_delete.innerHTML = '<i class="bi bi-x-lg"></i>';
    button_delete.addEventListener("click", () => deleteInsumo(e.id));
    button_delete.classList.add("btn-delete");

    divacciones.classList.add("divacciones");
    divacciones.appendChild(button_edit);
    divacciones.appendChild(button_delete);

    tdbuttons.appendChild(divacciones);

    producto.appendChild(nombre);
    producto.appendChild(marca);
    producto.appendChild(actual_stock);
    producto.appendChild(minimo_stock);
    producto.appendChild(status);
    producto.appendChild(precio_unit);
    producto.appendChild(precio_porunidad);
    producto.appendChild(tdbuttons);

    container_insumos.appendChild(producto);
  });

  if (insumos_criticos > 0) {
    document.getElementById("alert-stock").textContent =
      `Tienes ${insumos_criticos} insumos con stock bajo, revisa el inventario`;
    document.getElementById("alert-stock").classList.add("error-stock");
  } else {
    document.getElementById("alert-stock").textContent =
      "Todos los insumos tienen un buen stock";
    document.getElementById("alert-stock").classList.add("good-stock");
  }
}

document.getElementById("add-insumo").addEventListener("click", () => {
  document.querySelectorAll(".campo-requerido").forEach((e) => {
    e.classList.remove("error-input");
    e.value = "";
  });

  modal_add.style.display = "flex";
  overlay.style.display = "block";

  document.getElementById("tit-form").textContent = "Agregar Nuevo Insumo";
  document.querySelector("#form-insumo .btn-primary").textContent =
    "💾 Guardar Insumo";
  editandoID = null;
});

document.getElementById("form-insumo").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validarCampos()) return;

  const cant = parseFloat(
    document.getElementById("input-cantidad-compra").value,
  );
  const precio = parseFloat(
    document.getElementById("input-precio-compra").value,
  );
  const precioUnitario = cant > 0 ? precio / cant : 0;

  const datosForm = {
    nombre: document.getElementById("input-nombre").value.trim(),
    marca: document.getElementById("input-marca").value.trim() || "Sin marca",
    unidad_base: document.getElementById("input-unidad").value,
    presentacion: {
      cantidad: cant,
      unidad: document.getElementById("input-unidad").value,
    },
    precio_presentacion: precio,
    precio_unitario: precioUnitario,
    stock_actual:
      parseFloat(document.getElementById("input-stock-actual").value) || 0,
    stock_minimo:
      parseFloat(document.getElementById("input-stock-minimo").value) || 0,
    activo: true,
  };

  if (editandoID !== null) {
    const index = insumos.findIndex((ins) => ins.id === editandoID);

    if (index !== -1) {
      insumos[index] = { ...datosForm, id: editandoID };
    }
  } else {
    const nuevoInsumo = { ...datosForm, id: Date.now() };
    insumos.push(nuevoInsumo);
  }

  localStorage.setItem("insumos_db", JSON.stringify(insumos));

  mostrarInsumos(insumos);

  ocultarModales();

  let inputsyselects = document.querySelectorAll(
    "#form-insumo input, #form-insumo select",
  );

  inputsyselects.forEach((e) => (e.value = ""));

  actualizarCalculo();
});

function validarCampos() {
  const campos = document.querySelectorAll(".campo-requerido");
  let esValido = true;

  campos.forEach((e) => {
    const valor = e.value.trim();
    if (valor === "" || (e.type === "number" && isNaN(valor))) {
      e.classList.add("error-input");
      esValido = false;
    } else {
      e.classList.remove("error-input");
    }
  });

  return esValido;
}

document.getElementById("btn-close-add").addEventListener("click", () => {
  modal_add.style.display = "none";
  overlay.style.display = "none";
});

const inputPrecio = document.getElementById("input-precio-compra");
const inputCantidad = document.getElementById("input-cantidad-compra");
const inputUnidad = document.getElementById("input-unidad");
const displayCosto = document.getElementById("costo-calculado");
const displayUnidad = document.getElementById("texto-unidad");

function actualizarCalculo() {
  const precio = parseFloat(inputPrecio.value) || 0;
  const cantidad = parseFloat(inputCantidad.value) || 0;
  const unidad = inputUnidad.value || "unidad";

  displayUnidad.textContent = unidad;

  if (precio > 0 && cantidad > 0) {
    const costo = precio / cantidad;
    displayCosto.textContent = `$${costo.toLocaleString("es-CO")}`;
  } else {
    displayCosto.textContent = "$0.00";
  }
}

inputPrecio.addEventListener("input", actualizarCalculo);
inputCantidad.addEventListener("input", actualizarCalculo);
inputUnidad.addEventListener("change", actualizarCalculo);

function editarInsumo(idinsumo) {
  const insumo = insumos.find((e) => e.id === idinsumo);
  if (!insumo) return;

  editandoID = idinsumo;

  modal_add.style.display = "flex";
  overlay.style.display = "block";

  document.getElementById("input-nombre").value = insumo.nombre;
  document.getElementById("input-marca").value = insumo.marca;

  document.getElementById("input-unidad").value = insumo.unidad_base;

  document.getElementById("input-precio-compra").value =
    insumo.precio_presentacion;
  document.getElementById("input-cantidad-compra").value =
    insumo.presentacion.cantidad;
  document.getElementById("input-stock-minimo").value = insumo.stock_minimo;
  document.getElementById("input-stock-actual").value = insumo.stock_actual;

  actualizarCalculo();

  document.querySelector("#form-insumo .btn-primary").textContent =
    "Guardar Cambios";
  document.getElementById("tit-form").textContent = "Editar Insumo";
}

let idAEliminar = null;

function deleteInsumo(idinsumo) {
  const insumo = insumos.find((e) => e.id === idinsumo);
  if (!insumo) return;

  idAEliminar = idinsumo;

  document.getElementById("insumo-a-eliminar").textContent =
    `${insumo.nombre} (${insumo.marca})`;

  modal_delete.style.display = "flex";
  overlay.style.display = "block";
}

document.getElementById("btn-confirm-delete").addEventListener("click", () => {
  if (idAEliminar !== null) {
    insumos = insumos.filter((ins) => ins.id !== idAEliminar);

    localStorage.setItem("insumos_db", JSON.stringify(insumos));

    mostrarInsumos(insumos);
    ocultarModales();
  }
});

document
  .getElementById("btn-cancel-delete")
  .addEventListener("click", ocultarModales);
overlay.addEventListener("click", ocultarModales);

function ocultarModales() {
  modal_add.style.display = "none";
  modal_delete.style.display = "none";
  overlay.style.display = "none";
  editandoID = null;
  idAEliminar = null;
}

const filtros_input = document.querySelectorAll(
  ".filter input, .filter select",
);

const filtros = {
  nombre: "",
  marca: "",
  estado: "",
};

filtros_input.forEach((f) => {
  const tipo = f.dataset.filter;

  const evento = f.tagName === "SELECT" ? "change" : "input";

  f.addEventListener(evento, (e) => {
    filtros[tipo] = e.target.value.toLowerCase().trim();
    aplicarFiltros();
  });
});

function aplicarFiltros() {
  const filtrados = insumos.filter((i) => {
    const coincideNombre =
      !filtros.nombre || i.nombre.toLowerCase().includes(filtros.nombre);

    const coincideMarca =
      !filtros.marca || i.marca.toLowerCase().includes(filtros.marca);

    const estado = obtenerEstado(i);

    const coincideEstado = !filtros.estado || estado === filtros.estado;

    return coincideNombre && coincideMarca && coincideEstado;
  });

  mostrarInsumos(filtrados);
}

function obtenerEstado(i) {
  if (i.stock_actual <= i.stock_minimo) return "critico";
  if (i.stock_actual <= i.stock_minimo * 1.5) return "bajo";
  return "ok";
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