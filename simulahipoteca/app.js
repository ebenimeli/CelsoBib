const DEFAULT_CONFIG = {
  purchaseAmount: 235000.00,
  loanAmount: 199750.00,
  durationMonths: 348,
  startYear: 2026,
  startMonth: 6,
  firstYearRate: 2.350,
  laterRateWithoutBonus: 3.350,
  bonusPayroll: 0.40,
  bonusHomeInsurance: 0.10,
  bonusLifeInsurance: 0.40,
  bonusPaymentProtection: 0.10,
  maxBonus: 1.00,
  usePayroll: true,
  useHomeInsurance: true,
  useLifeInsurance: true,
  usePaymentProtection: true,
  firstYearMonths: 12,
  annualLifeInsurance: 917.87,
  annualHomeInsurance: 344.27,
  annualPaymentProtection: 269.86,
  earlyRepaymentFirst10Years: 2.000,
  earlyRepaymentAfter10Years: 1.500,
extraRepayments: Array.from({ length: 0 }, (_, i) => ({
  date: `12.${2026 + i}`,
  amount: 3000,
  reduceTerm: true,
  description: "Amortización anual recurrente"
}))};

const ids = [
  "purchaseAmount", "loanAmount", "durationMonths", "startYear", "startMonth",
  "firstYearRate", "laterRateWithoutBonus", "bonusPayroll", "bonusHomeInsurance",
  "bonusLifeInsurance", "bonusPaymentProtection", "maxBonus", "firstYearMonths",
  "annualLifeInsurance", "annualHomeInsurance", "annualPaymentProtection",
  "earlyRepaymentFirst10Years", "earlyRepaymentAfter10Years"
];

const checkboxIds = [
  "usePayroll",
  "useHomeInsurance",
  "useLifeInsurance",
  "usePaymentProtection"
];

let currentRows = [];
let currentSummary = {};

function q2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function eur(value) {
  return value.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR"
  });
}

function eurNoSymbol(value) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function pct(value) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }) + " %";
}

function intValue(id) {
  return parseInt(document.getElementById(id).value || "0", 10);
}

function numValue(id) {
  return parseFloat(document.getElementById(id).value || "0");
}

function addMonth(year, month, offset) {
  const total = year * 12 + (month - 1) + offset;

  return {
    year: Math.floor(total / 12),
    month: total % 12 + 1
  };
}

function formatMonthYear(year, month) {
  return `${String(month).padStart(2, "0")}.${year}`;
}

function parseMonthYear(value) {
  const normalized = value.trim().replace("/", ".");
  const [month, year] = normalized.split(".").map(Number);

  if (!month || !year || month < 1 || month > 12) {
    throw new Error(`Fecha inválida: ${value}`);
  }

  return { year, month };
}

function monthNumberFromDate(startYear, startMonth, year, month) {
  return (year - startYear) * 12 + (month - startMonth) + 1;
}

function formatMonthsAsYearsMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} meses`;
  if (months === 0) return `${years} años`;

  return `${years} años y ${months} meses`;
}

function monthlyPayment(capital, annualRatePercent, months) {
  if (months <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;

  if (monthlyRate === 0) {
    return capital / months;
  }

  return capital * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

function loadConfigToForm(config = DEFAULT_CONFIG) {
  ids.forEach(id => {
    document.getElementById(id).value = config[id];
  });

  checkboxIds.forEach(id => {
    document.getElementById(id).checked = config[id];
  });

  renderRepaymentInputs(config.extraRepayments);
  runSimulation();
}

function readConfigFromForm() {
  const cfg = {};

  ids.forEach(id => {
    cfg[id] = numValue(id);
  });

  cfg.durationMonths = intValue("durationMonths");
  cfg.startYear = intValue("startYear");
  cfg.startMonth = intValue("startMonth");
  cfg.firstYearMonths = intValue("firstYearMonths");

  checkboxIds.forEach(id => {
    cfg[id] = document.getElementById(id).checked;
  });

  cfg.extraRepayments = Array.from(document.querySelectorAll(".repayment-row"))
    .map(row => ({
      date: row.querySelector(".repayment-date").value,
      amount: parseFloat(row.querySelector(".repayment-amount").value || "0"),
      reduceTerm: row.querySelector(".repayment-reduce-term").checked,
      description:
        row.querySelector(".repayment-description").value.trim() ||
        "Amortización anticipada"
    }))
    .filter(item => item.date && item.amount > 0);

  return cfg;
}

function calculateBonus(cfg) {
  let total = 0;

  if (cfg.usePayroll) total += cfg.bonusPayroll;
  if (cfg.useHomeInsurance) total += cfg.bonusHomeInsurance;
  if (cfg.useLifeInsurance) total += cfg.bonusLifeInsurance;
  if (cfg.usePaymentProtection) total += cfg.bonusPaymentProtection;

  return Math.min(total, cfg.maxBonus);
}

function effectiveLaterRate(cfg) {
  return cfg.laterRateWithoutBonus - calculateBonus(cfg);
}

function earlyRepaymentFee(cfg, monthNumber, amount) {
  if (amount <= 0) return 0;

  const rate =
    monthNumber <= 120
      ? cfg.earlyRepaymentFirst10Years
      : cfg.earlyRepaymentAfter10Years;

  return q2(amount * rate / 100);
}

function buildExtraByMonth(cfg) {
  const map = new Map();

  cfg.extraRepayments.forEach(item => {
    const { year, month } = parseMonthYear(item.date);

    const monthNumber = monthNumberFromDate(
      cfg.startYear,
      cfg.startMonth,
      year,
      month
    );

    if (monthNumber < 1 || monthNumber > cfg.durationMonths) {
      return;
    }

    const parsed = {
      ...item,
      dateLabel: formatMonthYear(year, month),
      monthNumber
    };

    if (!map.has(monthNumber)) {
      map.set(monthNumber, []);
    }

    map.get(monthNumber).push(parsed);
  });

  return map;
}

function generateSchedule(cfg, includeExtraRepayments = true) {
  const rows = [];

  let balance = cfg.loanAmount;
  let remainingMonths = cfg.durationMonths;

  const firstRate = cfg.firstYearRate;
  const laterRate = effectiveLaterRate(cfg);

  let payment = q2(monthlyPayment(balance, firstRate, remainingMonths));
  const firstYearPayment = payment;
  let laterPayment = 0;

  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalPaid = 0;
  let totalExtra = 0;
  let totalExtraFees = 0;

  let annualInterest = 0;
  let annualPrincipal = 0;
  let annualPaid = 0;

  const extraByMonth = includeExtraRepayments
    ? buildExtraByMonth(cfg)
    : new Map();

  const appliedRepayments = [];

  for (let i = 1; i <= cfg.durationMonths; i++) {
    if (balance <= 0.005) break;

    if (i === cfg.firstYearMonths + 1) {
      payment = q2(monthlyPayment(balance, laterRate, remainingMonths));
      laterPayment = payment;
    }

    const currentRate = i <= cfg.firstYearMonths ? firstRate : laterRate;
    const monthlyRate = currentRate / 100 / 12;

    const interest = q2(balance * monthlyRate);
    let principal = payment - interest;
    let paymentReal = payment;

    if (principal > balance || remainingMonths === 1) {
      principal = balance;
      paymentReal = interest + principal;
    }

    principal = q2(principal);
    paymentReal = q2(paymentReal);
    balance = q2(balance - principal);
    remainingMonths -= 1;

    const { year, month } = addMonth(cfg.startYear, cfg.startMonth, i - 1);
    const dateLabel = formatMonthYear(year, month);

    totalInterest += interest;
    totalPrincipal += principal;
    totalPaid += paymentReal;

    annualInterest += interest;
    annualPrincipal += principal;
    annualPaid += paymentReal;

    rows.push({
      type: "cuota",
      date: dateLabel,
      interest,
      principal,
      totalPayment: paymentReal,
      balance,
      rate: currentRate,
      description: ""
    });

    for (const repayment of extraByMonth.get(i) || []) {
      if (balance <= 0.005) break;

      const extra = Math.min(repayment.amount, balance);
      const fee = earlyRepaymentFee(cfg, i, extra);

      balance = q2(balance - extra);
      totalExtra += extra;
      totalExtraFees += fee;

      const mode = repayment.reduceTerm ? "reduce plazo" : "reduce cuota";

      rows.push({
        type: "amortización anticipada",
        date: dateLabel,
        interest: 0,
        principal: q2(extra),
        totalPayment: q2(extra + fee),
        balance,
        rate: currentRate,
        description: `${repayment.description} (${mode}; comisión ${eur(fee)})`
      });

      appliedRepayments.push({
        fecha: dateLabel,
        importe: q2(extra),
        comision: fee,
        modo: mode,
        descripcion: repayment.description
      });

      if (!repayment.reduceTerm) {
        payment = q2(monthlyPayment(balance, currentRate, remainingMonths));

        if (i > cfg.firstYearMonths) {
          laterPayment = payment;
        }
      }
    }

    if (month === 12 || balance <= 0.005) {
      rows.push({
        type: "total año",
        date: `Total año ${year - cfg.startYear + 1}`,
        interest: q2(annualInterest),
        principal: q2(annualPrincipal),
        totalPayment: q2(annualPaid),
        balance,
        rate: 0,
        description: ""
      });

      annualInterest = 0;
      annualPrincipal = 0;
      annualPaid = 0;
    }
  }

  if (laterPayment === 0) {
    laterPayment = payment;
  }

  const monthsPaid = rows.filter(row => row.type === "cuota").length;

  const finalWith = addMonth(cfg.startYear, cfg.startMonth, monthsPaid - 1);
  const finalWithout = addMonth(
    cfg.startYear,
    cfg.startMonth,
    cfg.durationMonths - 1
  );

  let interesesSinAmortizaciones = q2(totalInterest);
  let ahorroIntereses = 0;
  let desembolsoSinAmortizaciones = q2(totalPaid);
  let desembolsoConAmortizaciones = q2(totalPaid + totalExtra + totalExtraFees);
  let ahorroGeneral = 0;

  if (includeExtraRepayments && cfg.extraRepayments.length > 0) {
    const baseline = generateSchedule(cfg, false).summary;

    interesesSinAmortizaciones = baseline.interesesTotales;
    ahorroIntereses = q2(interesesSinAmortizaciones - q2(totalInterest));
    desembolsoSinAmortizaciones = baseline.desembolsoTotal;
    desembolsoConAmortizaciones = q2(totalPaid + totalExtra + totalExtraFees);
    ahorroGeneral = q2(desembolsoSinAmortizaciones - desembolsoConAmortizaciones);
  }

  const costeSeguroVidaAnual = q2(
    cfg.useLifeInsurance ? cfg.annualLifeInsurance : 0
  );

  const costeSeguroHogarAnual = q2(
    cfg.useHomeInsurance ? cfg.annualHomeInsurance : 0
  );

  const costeSeguroPagosAnual = q2(
    cfg.usePaymentProtection ? cfg.annualPaymentProtection : 0
  );

  const costeProductosAnual = q2(
    costeSeguroVidaAnual +
    costeSeguroHogarAnual +
    costeSeguroPagosAnual
  );

  const costeProductosMensual = q2(costeProductosAnual / 12);

  const todosProductosBonificados =
    cfg.usePayroll &&
    cfg.useHomeInsurance &&
    cfg.useLifeInsurance &&
    cfg.usePaymentProtection;

  const hayProductosBonificados =
    cfg.usePayroll ||
    cfg.useHomeInsurance ||
    cfg.useLifeInsurance ||
    cfg.usePaymentProtection;

  const costeProductosExternosAnual = hayProductosBonificados
    ? q2(
        (cfg.useLifeInsurance ? 0 : cfg.annualLifeInsurance) +
        (cfg.useHomeInsurance ? 0 : cfg.annualHomeInsurance) +
        (cfg.usePaymentProtection ? 0 : cfg.annualPaymentProtection)
      )
    : 0;

  const costeProductosExternosMensual = q2(costeProductosExternosAnual / 12);

  const cuotaTotalRestoPeriodosConProductos = q2(
    laterPayment + costeProductosMensual
  );

  const cuotaFinalConProductosExternos = q2(
    cuotaTotalRestoPeriodosConProductos + costeProductosExternosMensual
  );

  const summary = {
    todosProductosBonificados,
    importeCompraventa: cfg.purchaseAmount,
    importeSolicitado: cfg.loanAmount,
    duracionMeses: cfg.durationMonths,
    mesesPagados: monthsPaid,
    mesesAhorrados: cfg.durationMonths - monthsPaid,
    reduccionPlazoTexto: formatMonthsAsYearsMonths(
      cfg.durationMonths - monthsPaid
    ),
    fechaFinalSinAmortizaciones: formatMonthYear(
      finalWithout.year,
      finalWithout.month
    ),
    fechaFinalConAmortizaciones: formatMonthYear(
      finalWith.year,
      finalWith.month
    ),
    tipo1erAnio: firstRate,
    tipoBaseRestoPeriodos: cfg.laterRateWithoutBonus,
    tipoRestoPeriodos: laterRate,
    bonificacionTotal: calculateBonus(cfg),
    cuota1erAnio: firstYearPayment,
    cuotaRestoPeriodos: laterPayment,
    costeProductosMensual,
    cuotaTotal1erAnioConProductos: q2(
      firstYearPayment + costeProductosMensual
    ),
    cuotaTotalRestoPeriodosConProductos,
    costeProductosExternosAnual,
    costeProductosExternosMensual,
    cuotaFinalConProductosExternos,
    interesesTotales: q2(totalInterest),
    interesesSinAmortizaciones,
    ahorroInteresesPorAmortizacion: ahorroIntereses,
    desembolsoTotalSinAmortizaciones: desembolsoSinAmortizaciones,
    desembolsoTotalConAmortizaciones: desembolsoConAmortizaciones,
    ahorroGeneralPorAmortizacion: ahorroGeneral,
    capitalTotalAmortizado: q2(totalPrincipal + totalExtra),
    totalPagadoEnCuotas: q2(totalPaid),
    desembolsoTotal: q2(totalPaid + totalExtra + totalExtraFees),
    totalAmortizacionesAnticipadas: q2(totalExtra),
    totalComisionesAmortizacion: q2(totalExtraFees),
    capitalPendienteFinal: q2(balance),
    costeSeguroVidaAnual,
    costeSeguroHogarAnual,
    costeSeguroPagosAnual,
    costeProductosAnual,
    costeTotalProductosSimulacion: q2(costeProductosMensual * monthsPaid),
    amortizacionesAplicadas: appliedRepayments
  };

  return { rows, summary };
}

function renderRepaymentInputs(repayments) {
  const box = document.getElementById("repaymentsList");
  box.innerHTML = "";

  repayments.forEach(addRepaymentRow);
}

function addRepaymentRow(
  item = {
    date: "12.2028",
    amount: 5000,
    reduceTerm: true,
    description: "Amortización anticipada"
  }
) {
  const box = document.getElementById("repaymentsList");
  const row = document.createElement("div");

  row.className = "repayment-row";

  row.innerHTML = `
    <label>
      Fecha MM.AAAA
      <input class="repayment-date" value="${item.date}" />
    </label>

    <label>
      Importe (€)
      <input class="repayment-amount" type="number" step="0.01" value="${item.amount}" />
    </label>

    <label class="check">
      <input class="repayment-reduce-term" type="checkbox" ${item.reduceTerm ? "checked" : ""} />
      Reducir plazo
    </label>

    <button type="button" class="remove-btn">Eliminar</button>

    <label class="wide">
      Descripción
      <input class="repayment-description" value="${item.description}" />
    </label>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => {
    row.remove();
    runSimulation();
  });

  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", runSimulation);
  });

  box.appendChild(row);
}

function getContractedProductsText() {
  const cfg = readConfigFromForm();
  const products = [];

  if (cfg.usePayroll) {
    products.push(`Nómina (${pct(cfg.bonusPayroll)})`);
  }

  if (cfg.useHomeInsurance) {
    products.push(`Seguro de hogar (${pct(cfg.bonusHomeInsurance)})`);
  }

  if (cfg.useLifeInsurance) {
    products.push(`Seguro de vida (${pct(cfg.bonusLifeInsurance)})`);
  }

  if (cfg.usePaymentProtection) {
    products.push(`Protección de pagos (${pct(cfg.bonusPaymentProtection)})`);
  }

  if (!products.length) {
    return "Ningún producto bonificado contratado";
  }

  return products.join(" · ");
}

function renderSummary(summary) {
  const items = [
    ["Productos contratados", getContractedProductsText()],
    ["Cuota 1er año", eur(summary.cuota1erAnio)],
    ["Cuota desde año 2", eur(summary.cuotaRestoPeriodos)],
    ["Tipo desde año 2", pct(summary.tipoRestoPeriodos)],
    ["Bonificación aplicada", pct(summary.bonificacionTotal)],
    ["Productos / mes contratados", eur(summary.costeProductosMensual)],
    ["Cuota total desde año 2 con productos contratados", eur(summary.cuotaTotalRestoPeriodosConProductos)],
    ["Productos externos / mes", eur(summary.costeProductosExternosMensual)],
    [
      "Cuota final con productos externos",
      summary.todosProductosBonificados
        ? "-"
        : eur(summary.cuotaFinalConProductosExternos)
    ],
    ["Intereses con amortizaciones", eur(summary.interesesTotales)],
    ["Ahorro en intereses", eur(summary.ahorroInteresesPorAmortizacion)],
    ["Meses pagados", `${summary.mesesPagados} meses`],
    ["Meses ahorrados", `${summary.mesesAhorrados} meses`],
    ["Reducción de plazo", summary.reduccionPlazoTexto],
    ["Final con amortizaciones", summary.fechaFinalConAmortizaciones],
    ["Final sin amortizaciones", summary.fechaFinalSinAmortizaciones],
    ["Desembolso total con amortizaciones", eur(summary.desembolsoTotalConAmortizaciones)],
    ["Coste anual productos contratados", eur(summary.costeProductosAnual)],
    ["Coste anual productos externos", eur(summary.costeProductosExternosAnual)],
    ["Capital pendiente final", eur(summary.capitalPendienteFinal)]
  ];

  document.getElementById("summaryCards").innerHTML = items
    .map(([label, value]) => {

      const isCuotaConProductos =
        label === "Cuota total desde año 2 con productos contratados";

      const isCuotaFinalExternos =
        label === "Cuota final con productos externos" &&
        value !== "-";

const redDarkCard =
  isCuotaConProductos;

const orangeDarkCard =
  isCuotaFinalExternos;

      let detail = "";

      if (isCuotaConProductos) {
        detail =
          `${eur(summary.cuotaTotalRestoPeriodosConProductos)} = ` +
          `${eur(summary.cuotaRestoPeriodos)} + ` +
          `${eur(summary.costeProductosMensual)}`;
      }

      if (isCuotaFinalExternos) {
        detail =
          `${eur(summary.cuotaFinalConProductosExternos)} = ` +
          `${eur(summary.cuotaTotalRestoPeriodosConProductos)} + ` +
          `${eur(summary.costeProductosExternosMensual)}`;
      }

      return `
        <div 
          class="card"
          style="
            ${
              label === "Cuota desde año 2"
                ? "background-color: #ffe5e5;"
                : ""
            }

${
  redDarkCard
    ? "background-color: #b71c1c; color: white;"
    : ""
}

${
  orangeDarkCard
    ? "background-color: #e65100; color: white;"
    : ""
}
          "
        >

<span style="${
  redDarkCard || orangeDarkCard
    ? "color: white;"
    : ""
}">
            ${label}
          </span>

          <strong
            style="
              ${
                label === "Productos contratados"
                  ? "font-size: 0.8rem; line-height: 1.2; font-weight: 500;"
                  : ""
              }

${
  redDarkCard || orangeDarkCard
    ? "color: white;"
    : ""
}
            "
          >
            ${value}
          </strong>

          ${
            detail
              ? `
                <small
                  style="
                    display: block;
                    margin-top: 0.35rem;
                    font-size: 0.75rem;
                    line-height: 1.2;
                    color: ${orangeDarkCard ? "#fff3e0" : "white"};                    opacity: 0.9;
                  "
                >
                  ${detail}
                </small>
              `
              : ""
          }

        </div>
      `;
    })
    .join("");
}

function renderAppliedRepayments(summary) {
  const box = document.getElementById("appliedRepayments");

  if (!summary.amortizacionesAplicadas.length) {
    box.innerHTML = "<p>No se han aplicado amortizaciones anticipadas.</p>";
    return;
  }

  box.innerHTML = `
    <ul>
      ${summary.amortizacionesAplicadas.map(item => `
        <li>
          <strong>${item.fecha}</strong> ·
          ${eur(item.importe)} ·
          ${item.modo} ·
          comisión máxima ${eur(item.comision)} ·
          ${item.descripcion}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderTable(rows) {
  const showYearTotals =
    document.getElementById("showYearTotals")?.checked ?? true;

  const showOnlyYearTotals =
    document.getElementById("showOnlyYearTotals")?.checked ?? false;

  const body = document.querySelector("#scheduleTable tbody");

  const visibleRows = rows.filter(row => {
    if (showOnlyYearTotals) {
      return row.type === "total año";
    }

    if (!showYearTotals) {
      return row.type !== "total año";
    }

    return true;
  });

  body.innerHTML = visibleRows.map(row => {
    const cls =
      row.type === "total año"
        ? "year-total"
        : row.type === "amortización anticipada"
          ? "extra"
          : "";

    return `
      <tr class="${cls}">
        <td>${row.type}</td>
        <td>${row.date}</td>
        <td>${eurNoSymbol(row.interest)}</td>
        <td>${eurNoSymbol(row.principal)}</td>
        <td>${eurNoSymbol(row.totalPayment)}</td>
        <td>${eurNoSymbol(row.balance)}</td>
        <td>${row.type === "total año" ? "" : pct(row.rate)}</td>
        <td>${row.description}</td>
      </tr>
    `;
  }).join("");
}

function runSimulation() {
  try {
    const cfg = readConfigFromForm();
    const result = generateSchedule(cfg, true);

    currentRows = result.rows;
    currentSummary = result.summary;

    renderSummary(currentSummary);
    renderAppliedRepayments(currentSummary);
    renderTable(currentRows);
  } catch (error) {
    document.getElementById("summaryCards").innerHTML = `
      <div class="card">
        <span>Error</span>
        <strong>${error.message}</strong>
      </div>
    `;
  }
}

function downloadCsv() {
  const showOnlyYearTotals =
    document.getElementById("showOnlyYearTotals")?.checked ?? false;

  const showYearTotals =
    document.getElementById("showYearTotals")?.checked ?? true;

  const rowsToExport = currentRows.filter(row => {
    if (showOnlyYearTotals) {
      return row.type === "total año";
    }

    if (!showYearTotals) {
      return row.type !== "total año";
    }

    return true;
  });

  const headers = [
    "Tipo",
    "Fecha",
    "Intereses",
    "Capital amortizado",
    "Total cuota",
    "Capital pendiente",
    "Tipo de interés",
    "Descripción"
  ];

  const lines = [headers.join(";")];

  rowsToExport.forEach(row => {
    lines.push([
      row.type,
      row.date,
      eurNoSymbol(row.interest),
      eurNoSymbol(row.principal),
      eurNoSymbol(row.totalPayment),
      eurNoSymbol(row.balance),
      row.type === "total año" ? "" : String(row.rate).replace(".", ","),
      row.description
    ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(";"));
  });

  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = showOnlyYearTotals
    ? "tabla_amortizacion_anual.csv"
    : "tabla_amortizacion.csv";

  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  loadConfigToForm();

  document.getElementById("mortgageForm").addEventListener("input", runSimulation);

  document.getElementById("resetBtn").addEventListener("click", () => {
    loadConfigToForm();
  });

  document.getElementById("addRepaymentBtn").addEventListener("click", () => {
    addRepaymentRow();
    runSimulation();
  });

  document.getElementById("showYearTotals").addEventListener("change", () => {
    renderTable(currentRows);
  });

  document.getElementById("showOnlyYearTotals").addEventListener("change", () => {
    renderTable(currentRows);
  });

  document.getElementById("downloadCsvBtn").addEventListener("click", downloadCsv);
});