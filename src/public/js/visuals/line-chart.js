// public/js/admin-analytics.js

(function () {
  // ────────────────────────────────────────────────
  // Global Chart.js defaults
  // ────────────────────────────────────────────────
  function setupChartDefaults() {
    if (!window.Chart) {
      console.error("Chart.js not loaded. Did you include the CDN script?");
      return;
    }

    Chart.defaults.font.family =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // Assuming a dark-ish background; tweak if you're on light mode
    Chart.defaults.color = "#e5e7eb";

    Chart.defaults.plugins.legend.display = true;
    Chart.defaults.plugins.tooltip.mode = "index";
    Chart.defaults.plugins.tooltip.intersect = false;
    Chart.defaults.responsive = true;

    // Let the container control the height
    Chart.defaults.maintainAspectRatio = false;
  }

  /**
   * Render a line chart into a canvas (or element ID).
   *
   * @param {HTMLCanvasElement|string} canvasOrId
   * @param {Object} config
   * @param {string[]} config.labels
   * @param {Array<{label: string, data: number[]}>} config.series
   * @param {string} [config.title]
   * @param {string} [config.yLabel]
   * @returns {Chart|null}
   */
  function renderLineChart(canvasOrId, config) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return null;
    }

    const canvas =
      typeof canvasOrId === "string"
        ? document.getElementById(canvasOrId)
        : canvasOrId;

    if (!canvas) {
      console.error("Canvas not found:", canvasOrId);
      return null;
    }

    const ctx = canvas.getContext("2d");
    const { labels = [], series = [], title, yLabel } = config || {};

    // Simple color palette for multiple lines
    const palette = [
      "rgba(16, 185, 129, 0.8)", // green
      "rgba(59, 130, 246, 0.8)", // blue
      "rgba(239, 68, 68, 0.8)",  // red
      "rgba(234, 179, 8, 0.8)",  // yellow
      "rgba(168, 85, 247, 0.8)", // purple
    ];

    console.log(series);

    const datasets = (series || []).map((s, i) => ({
      label: s.label || `Series ${i + 1}`,
      data: s.data || [],
      fill: false,
      borderColor: palette[i % palette.length],
      backgroundColor: palette[i % palette.length],
      tension: 0.25,
      pointRadius: 3,
      pointHoverRadius: 4,
    }));
    console.log(datasets);

    return new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        plugins: {
          title: {
            display: !!title,
            text: title || "",
            color: "var(--foreground)",
          },
          legend: {
            display: series.length > 1,
            labels: {
              color: "var(--foreground)",
            },
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 8,
              color: "var(--foreground)",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: !!yLabel,
              text: yLabel || "",
              color: "var(--foreground)",
            },
          },
        },
      },
    });
  }

  // ────────────────────────────────────────────────
  // Auto-init: scan DOM for placeholders
  // ────────────────────────────────────────────────

  /**
   * Scan for elements with data-chart-type="line", parse their config,
   * swap them for <canvas>, and render line charts.
   *
   * Expected HTML:
   * <span
   *   id="revenueChart"
   *   data-chart-type="line"
   *   data-chart-config='{"labels":["Mon"],"series":[...]}'>
   * </span>
   */
  function initAutoCharts() {
    const nodes = document.querySelectorAll("[data-chart-type='line']");

    nodes.forEach((el) => {
      const rawConfig = el.getAttribute("data-chart-config");
      if (!rawConfig) {
        console.warn("No data-chart-config found on element:", el);
        return;
      }

      let config;
      try {
        config = JSON.parse(rawConfig);
      } catch (err) {
        console.error("Invalid JSON in data-chart-config:", err, rawConfig);
        return;
      }

      // Create a <canvas> to replace the placeholder
      const canvas = document.createElement("canvas");

      // Preserve ID and class for targeting/styling
      if (el.id) canvas.id = el.id;
      if (el.className) canvas.className = el.className;

      // Optional: preserve inline styles
      if (el.getAttribute("style")) {
        canvas.setAttribute("style", el.getAttribute("style"));
      }

      el.replaceWith(canvas);

      // Render the chart
      renderLineChart(canvas, config);
    });
  }



  // Add this next to renderLineChart
  function renderPieChart(canvasOrId, config) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return null;
    }

    const canvas =
      typeof canvasOrId === "string"
        ? document.getElementById(canvasOrId)
        : canvasOrId;

    if (!canvas) {
      console.error("Canvas not found:", canvasOrId);
      return null;
    }

    const ctx = canvas.getContext("2d");
    const { labels = [], data = [], title } = config || {};

    const palette = [
      "rgba(16, 185, 129, 0.9)", // green
      "rgba(59, 130, 246, 0.9)", // blue
      "rgba(239, 68, 68, 0.9)",  // red
      "rgba(234, 179, 8, 0.9)",  // yellow
      "rgba(168, 85, 247, 0.9)", // purple
      "rgba(244, 114, 182, 0.9)",// pink
    ];

    return new Chart(ctx, {
      type: "doughnut", // or "pie" if you prefer
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: data.map((_, i) => palette[i % palette.length]),
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: !!title,
            text: title || "",
            color: "var(--foreground)",
          },
          legend: {
            position: "right",
            labels: {
              color: "var(--foreground)",
            },
          },
        },
        cutout: "55%", // donut style; remove this if you want full pie
      },
    });
  }
  function initAutoPieCharts() {
    const nodes = document.querySelectorAll("[data-chart-type='pie']");

    nodes.forEach((el) => {
      const rawConfig = el.getAttribute("data-chart-config");
      if (!rawConfig) {
        console.warn("No data-chart-config found on pie chart element:", el);
        return;
      }

      let config;
      try {
        config = JSON.parse(rawConfig);
      } catch (err) {
        console.error("Invalid JSON in data-chart-config (pie):", err, rawConfig);
        return;
      }

      const canvas = document.createElement("canvas");

      if (el.id) canvas.id = el.id;
      if (el.className) canvas.className = el.className;

      if (el.getAttribute("style")) {
        canvas.setAttribute("style", el.getAttribute("style"));
      } else {
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      el.replaceWith(canvas);
      renderPieChart(canvas, config);
    });
  }
  // ────────────────────────────────────────────────
  // Funnel chart (checkout / conversion funnel)
  // Expected config: { labels: [], values: [], title? }
  // ────────────────────────────────────────────────
  function renderFunnelChart(canvasOrId, config) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return null;
    }

    const canvas =
      typeof canvasOrId === "string"
        ? document.getElementById(canvasOrId)
        : canvasOrId;

    if (!canvas) {
      console.error("Canvas not found:", canvasOrId);
      return null;
    }

    const ctx = canvas.getContext("2d");
    const { labels = [], values = [], title } = config || {};

    const palette = [
      "rgba(16, 185, 129, 0.9)", // green
      "rgba(59, 130, 246, 0.9)", // blue
      "rgba(234, 179, 8, 0.9)",  // yellow
      "rgba(239, 68, 68, 0.9)",  // red
      "rgba(168, 85, 247, 0.9)", // purple
    ];

    const backgroundColors = values.map((_, i) => palette[i % palette.length]);

    return new Chart(ctx, {
      type: "funnel",
      data: {
        labels,
        datasets: [
          {
            // optional, but you can give the whole funnel a label if you want
            label: "Funnel",
            data: values,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: !!title,
            text: title || "",
            color: "var(--foreground)",
          },
          legend: {
            display: true,
            position: "right",
            labels: {
              color: "var(--foreground)",
              usePointStyle: true,
              pointStyle: "rectRounded",
              // 🔑 Build one legend item per funnel step
              generateLabels(chart) {
                const dataset = chart.data.datasets[0] || { data: [] };
                const labels = chart.data.labels || [];
                const bg = dataset.backgroundColor || [];

                return labels.map((text, i) => ({
                  text,
                  fillStyle: bg[i],
                  strokeStyle: bg[i],
                  lineWidth: 0,
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
        },
        sort: "desc",
      },
    });
  }

  function initAutoFunnelCharts() {
    const nodes = document.querySelectorAll("[data-chart-type='funnel']");

    nodes.forEach((el) => {
      const rawConfig = el.getAttribute("data-chart-config");
      if (!rawConfig) {
        console.warn("No data-chart-config found on funnel chart element:", el);
        return;
      }

      let config;
      try {
        config = JSON.parse(rawConfig);
      } catch (err) {
        console.error("Invalid JSON in data-chart-config (funnel):", err, rawConfig);
        return;
      }

      const canvas = document.createElement("canvas");

      if (el.id) canvas.id = el.id;
      if (el.className) canvas.className = el.className;

      if (el.getAttribute("style")) {
        canvas.setAttribute("style", el.getAttribute("style"));
      } else {
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      el.replaceWith(canvas);
      renderFunnelChart(canvas, config);
    });
  }
  // Basic state-code to state-name map for matching your data to GeoJSON
  const US_STATE_NAME_BY_CODE = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming"
  };
  let usStatesFeaturesPromise = null;
  function loadUsStatesFeatures() {
    if (usStatesFeaturesPromise) return usStatesFeaturesPromise;

    if (!window.ChartGeo || !window.ChartGeo.topojson) {
      console.error("ChartGeo not loaded. Did you include chartjs-chart-geo CDN?");
      usStatesFeaturesPromise = Promise.resolve([]);
      return usStatesFeaturesPromise;
    }

    // 👇 Local file served from your own origin (no CSP issues)
    usStatesFeaturesPromise = fetch("/js/visuals/us-states-10m.json")
      .then((r) => r.json())
      .then((us) => {
        const states = window.ChartGeo.topojson.feature(us, us.objects.states).features;
        return states;
      })
      .catch((err) => {
        console.error("Failed to load US atlas", err);
        return [];
      });

    return usStatesFeaturesPromise;
  }

  async function renderUSHeatmap(canvasOrId, config) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return null;
    }

    const canvas =
      typeof canvasOrId === "string"
        ? document.getElementById(canvasOrId)
        : canvasOrId;

    if (!canvas) {
      console.error("Canvas not found:", canvasOrId);
      return null;
    }

    const ctx = canvas.getContext("2d");
    const { title, points = [] } = config || {};

    const states = await loadUsStatesFeatures();
    if (!states.length) return null;

    // normalize your data: [{ state: 'WI', value: 123 }, ...]
    const valueByStateName = new Map();
    points.forEach((p) => {
      if (!p || p.value == null) return;

      let name = p.state || p.code || p.name;
      if (!name) return;

      // allow 2-letter codes
      if (name.length === 2) {
        const full = US_STATE_NAME_BY_CODE[name.toUpperCase()];
        if (full) name = full;
      }

      valueByStateName.set(name, Number(p.value));
    });

    const data = states.map((feature) => {
      const name = feature.properties.name;
      const value = valueByStateName.get(name) ?? 0;
      return { feature, value };
    });

    return new Chart(ctx, {
      type: "choropleth",
      data: {
        labels: data.map((d) => d.feature.properties.name),
        datasets: [
          {
            label: "States",
            data,
            borderColor: "rgba(15, 23, 42, 0.7)",
            borderWidth: 0.6,
            // NOTE: no backgroundColor here – the color scale handles it
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: !!title,
            text: title || "",
            color: "var(--foreground)",
          },
          legend: {
            display: false, // dataset legend off; we just use the color bar
          },
          tooltip: {
            callbacks: {
              // show state name + value instead of "undefined"
              label(context) {
                const raw = context.raw || {};
                const feature = raw.feature || {};
                const name =
                  (feature.properties && feature.properties.name) ||
                  context.label ||
                  "Unknown";
                const value =
                  typeof raw.value === "number" ? raw.value : 0;
                return `${name}: ${value}`;
              },
            },
          },
        },
        scales: {
          // 👈 this is the map projection (must have axis: 'x')
          projection: {
            axis: "x",
            projection: "albersUsa",
          },
          // 👈 this controls both the state fill colors AND the vertical bar
          color: {
            axis: "x",
            quantize: 6,
            interpolate: (v) => {
              // v is 0..1 from min to max
              const alpha = 0.25 + 0.55 * v;
              return `rgba(16, 185, 129, ${alpha})`; // green shades
            },
            ticks: {
              color: "#111827",          // darker tick text
              font: { size: 12 },
            },
            legend: {
              position: "right",
            },
          },
        },
      },
    });
  }




  function initAutoUSHeatmaps() {
    const nodes = document.querySelectorAll("[data-chart-type='us-heatmap']");

    nodes.forEach((el) => {
      const rawConfig = el.getAttribute("data-chart-config");
      if (!rawConfig) {
        console.warn("No data-chart-config found on us-heatmap element:", el);
        return;
      }

      let config;
      try {
        config = JSON.parse(rawConfig);
      } catch (err) {
        console.error("Invalid JSON in data-chart-config (us-heatmap):", err, rawConfig);
        return;
      }

      const canvas = document.createElement("canvas");

      if (el.id) canvas.id = el.id;
      if (el.className) canvas.className = el.className;

      if (el.getAttribute("style")) {
        canvas.setAttribute("style", el.getAttribute("style"));
      } else {
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      const wrapper = el.parentElement;
      el.replaceWith(canvas);

      // fire and forget the async render
      renderUSHeatmap(canvas, config);
    });
  }




  window.AdminCharts = {
    setupChartDefaults,
    renderLineChart,
    renderPieChart,
    renderFunnelChart,
    initAutoCharts,
    initAutoPieCharts,
    initAutoFunnelCharts,
    initAutoUSHeatmaps,
  };

  window.addEventListener("DOMContentLoaded", function () {
    setupChartDefaults();
    initAutoCharts();
    initAutoPieCharts();
    initAutoFunnelCharts();
    initAutoUSHeatmaps();
  });
})();
