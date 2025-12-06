

function lineChart(title, xaxisTitle, yaxisTitle) {
  return {
    title,
    xaxisTitle,
    yaxisTitle,
    xaxisLabels: [],
    series: [],
    id: "chart",
    setXAxis: function (labels) {
      this.xaxisLabels = labels;
      return this;
    },
    addSeries: function (name, dataPoints) {
      if (!this.series) this.series = [];
      this.series.push({ label: name, data: dataPoints });

      const needed = dataPoints.length;

      // 💡 Auto fill if no labels
      if (this.xaxisLabels.length === 0) {
        this.xaxisLabels = Array.from({ length: needed }, (_, i) => (i + 1).toString());
      }

      // 💡 If labels exist but are shorter → pad sequentially
      else if (this.xaxisLabels.length < needed) {
        const start = this.xaxisLabels.length + 1;
        for (let i = start; i <= needed; i++) {
          this.xaxisLabels.push(i.toString());
        }
      }
      else if (this.xaxisLabels.length > needed) {
        this.xaxisLabels = this.xaxisLabels.slice(0, needed);
      }

      return this;
    },
    setID: function (id) {
      this.id = id;
      return this;
    }
  }
}

function pieChart(title) {
  return {
    title,
    labels: [],
    values: [],
    id: "pieChart",
    setLabels(labels) {
      this.labels = labels;
      return this;
    },
    setValues(values) {
      this.values = values;
      return this;
    },
    setID(id) {
      this.id = id;
      return this;
    },
  };
}
function kpi(label, value) {
  return {
    label,
    value,
    prefix: "",
    suffix: "",
    delta: null,          // e.g. 12.3
    deltaDirection: null, // "up" | "down" | null
    helpText: "",

    setPrefix(p) { this.prefix = p; return this; },
    setSuffix(s) { this.suffix = s; return this; },
    setDelta(delta, direction) {
      this.delta = delta;
      this.deltaDirection = direction; // "up" or "down"
      return this;
    },
    setHelpText(text) { this.helpText = text; return this; },
  };
}
// src/lib/table.js
function table(title) {
  return {
    title,
    subtitle: "",
    modifierClass: "",      // e.g. "data-table--compact"
    columns: [],            // [{ key, label, align?, className? }]
    rows: [],               // [{ key: value, ... }]
    getRowClass: null,      // function(row) => "css-classes"
    getCellClass: null,     // function(column, row) => "css-classes"

    setSubtitle(subtitle) {
      this.subtitle = subtitle;
      return this;
    },

    setModifierClass(cls) {
      this.modifierClass = cls;
      return this;
    },

    addColumn(col) {
      // col: { key, label, align?, className? }
      this.columns.push({
        key: col.key,
        label: col.label,
        align: col.align || "left",
        className: col.className || "",
        rawHtml: col.rawHtml || false,
      });
      return this;
    },

    addRow(row) {
      this.rows.push(row);
      return this;
    },

    setRowClassGetter(fn) {
      this.getRowClass = fn;
      return this;
    },

    setCellClassGetter(fn) {
      this.getCellClass = fn;
      return this;
    },
  };
}

function funnelChart(title) {
  return {
    type: "funnel",
    title,
    labels: [],
    values: [],
    id: "funnelChart",

    setLabels(labels) {
      this.labels = labels;
      return this;
    },

    setValues(values) {
      this.values = values;
      return this;
    },

    setID(id) {
      this.id = id;
      return this;
    },
  };
}
function heatMap(title) {
  return {
    type: "us-heatmap",
    title,
    points: [],   // { state: 'WI', value: number } etc.
    id: "usHeatmap",

    addPoint(stateCodeOrName, value) {
      this.points.push({ state: stateCodeOrName, value });
      return this;
    },

    setPoints(points) {
      this.points = points;
      return this;
    },

    setID(id) {
      this.id = id;
      return this;
    },
  };
}

module.exports = {
  lineChart,
  pieChart,
  kpi,
  table,
  funnelChart,
  heatMap,
};




