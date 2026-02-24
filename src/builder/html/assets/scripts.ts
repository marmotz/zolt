export const TABS_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.zolt-tabs').forEach(function(tabsContainer) {
        var buttons = tabsContainer.querySelectorAll('.zolt-tab-button');
        var panels = tabsContainer.querySelectorAll('.zolt-tab-panel');
        
        buttons.forEach(function(button) {
          button.addEventListener('click', function() {
            var tabIndex = this.getAttribute('data-tab-index');
            
            buttons.forEach(function(btn) {
              btn.classList.remove('active');
              btn.setAttribute('aria-selected', 'false');
            });
            panels.forEach(function(panel) {
              panel.classList.remove('active');
            });
            
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            tabsContainer.querySelector('.zolt-tab-panel[data-tab-index="' + tabIndex + '"]').classList.add('active');
          });
        });
      });
    });
  </script>`;

export const ANCHOR_SCRIPT = `
  <script>
    window.addEventListener('hashchange', function() {
      var target = document.querySelector(':target');
      if (target) {
        target.style.animation = 'none';
        target.offsetHeight; // trigger reflow
        target.style.animation = '';
      }
    });
  </script>`;

export const CHART_SCRIPT = `
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var defaultColors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(40, 159, 64, 0.8)',
        'rgba(210, 199, 199, 0.8)'
      ];

      var schemes = {
        cool: ['rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(83, 102, 255, 0.8)'],
        warm: ['rgba(255, 99, 132, 0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 71, 0.8)'],
        pastel: ['rgba(255, 179, 186, 0.8)', 'rgba(186, 255, 201, 0.8)', 'rgba(186, 225, 255, 0.8)', 'rgba(255, 255, 186, 0.8)'],
        vibrant: ['rgba(255, 0, 0, 0.8)', 'rgba(0, 255, 0, 0.8)', 'rgba(0, 0, 255, 0.8)', 'rgba(255, 255, 0, 0.8)']
      };

      function getPalette(schemeName) {
        return schemes[schemeName] || defaultColors;
      }

      function parseValue(v) {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          var cleaned = v.replace(/[^\d.-]/g, '');
          var num = parseFloat(cleaned);
          return isNaN(num) ? v : num;
        }
        return v;
      }

      document.querySelectorAll('.zolt-chart').forEach(function(chartContainer) {
        var seriesElements = chartContainer.querySelectorAll('.zolt-chart-series');
        if (seriesElements.length === 0) return;

        var layout = chartContainer.getAttribute('data-layout');
        var containerScheme = chartContainer.getAttribute('data-scheme') || chartContainer.getAttribute('scheme');
        var containerStacked = chartContainer.getAttribute('data-stacked') === 'true' || chartContainer.getAttribute('stacked') === 'true';
        var containerLegend = chartContainer.getAttribute('data-legend') === 'true' || chartContainer.getAttribute('legend') === 'true';
        var containerGrid = chartContainer.getAttribute('data-grid') === 'true' || chartContainer.getAttribute('grid') === 'true';

        var chartTitle = chartContainer.getAttribute('data-title') || 
                         chartContainer.getAttribute('title') || 
                         (seriesElements.length === 1 ? seriesElements[0].getAttribute('data-title') : '') || 
                         '';
        
        if (layout === 'horizontal' || layout === 'vertical') {
          chartContainer.style.display = 'flex';
          chartContainer.style.flexDirection = layout === 'horizontal' ? 'row' : 'column';
          chartContainer.style.gap = '1rem';
          chartContainer.style.flexWrap = 'wrap';
          if (chartTitle) {
            var titleEl = document.createElement('div');
            titleEl.className = 'block-title';
            titleEl.textContent = chartTitle;
            titleEl.style.width = '100%';
            chartContainer.insertBefore(titleEl, chartContainer.firstChild);
          }
          
          seriesElements.forEach(function(seriesEl, idx) {
            var chartType = seriesEl.getAttribute('data-chart-type') || 'line';
            var dataAttr = seriesEl.getAttribute('data-data');
            if (!dataAttr) return;
            var data = JSON.parse(dataAttr);
            
            var wrapper = document.createElement('div');
            wrapper.style.flex = '1 1 300px';
            wrapper.style.minWidth = '0';
            var canvas = document.createElement('canvas');
            wrapper.appendChild(canvas);
            chartContainer.appendChild(wrapper);
            
            var label = seriesEl.getAttribute('data-label') || seriesEl.getAttribute('data-title') || 'Dataset';
            var scheme = seriesEl.getAttribute('data-scheme') || seriesEl.getAttribute('scheme') || containerScheme;
            var palette = getPalette(scheme);
            var color = seriesEl.getAttribute('data-color') || palette[idx % palette.length];
            var showLegend = seriesEl.getAttribute('data-legend') === 'true' || containerLegend;
            var showGrid = seriesEl.getAttribute('data-grid') === 'true' || containerGrid;
            var isStacked = seriesEl.getAttribute('data-stacked') === 'true' || seriesEl.getAttribute('stacked') === 'true' || containerStacked;

            var isPieOrDoughnut = chartType === 'pie' || chartType === 'doughnut';
            var chartData = data.map(function(d) { return parseValue(d.value); });
            var backgroundColors = isPieOrDoughnut ? palette.slice(0, data.length) : color;

            var options = {
              responsive: true,
              plugins: {
                title: {
                  display: !!seriesEl.getAttribute('data-title'),
                  text: seriesEl.getAttribute('data-title')
                },
                legend: { display: showLegend || isPieOrDoughnut }
              }
            };

            if (!isPieOrDoughnut) {
              options.scales = {
                x: { 
                  grid: { display: showGrid },
                  stacked: isStacked
                },
                y: { 
                  grid: { display: showGrid },
                  stacked: isStacked
                }
              };
            }

            new Chart(canvas, {
              type: chartType === 'area' ? 'line' : chartType,
              data: {
                labels: data.map(function(d) { return d.label; }),
                datasets: [{
                  label: label,
                  data: chartData,
                  backgroundColor: backgroundColors,
                  borderColor: isPieOrDoughnut ? '#fff' : color,
                  fill: chartType === 'area'
                }]
              },
              options: options
            });
          });
        } else {
          var mainChartType = seriesElements[0].getAttribute('data-chart-type') || 'line';
          var isPieOrDoughnut = mainChartType === 'pie' || mainChartType === 'doughnut';
          var datasets = [];
          var labels = null;
          
          var isStacked = containerStacked || Array.prototype.some.call(seriesElements, function(el) { 
            return el.getAttribute('data-stacked') === 'true' || el.getAttribute('stacked') === 'true'; 
          });

          seriesElements.forEach(function(seriesEl, idx) {
            var dataAttr = seriesEl.getAttribute('data-data');
            if (!dataAttr) return;
            var data = JSON.parse(dataAttr);
            
            if (!labels) {
              labels = data.map(function(d) { return d.label; });
            }
            
            var type = seriesEl.getAttribute('data-chart-type') || mainChartType;
            var label = seriesEl.getAttribute('data-label') || seriesEl.getAttribute('data-title') || 'Dataset ' + (datasets.length + 1);
            var scheme = seriesEl.getAttribute('data-scheme') || seriesEl.getAttribute('scheme') || containerScheme;
            var palette = getPalette(scheme);
            var color = seriesEl.getAttribute('data-color') || palette[idx % palette.length];
            
            datasets.push({
              type: type === 'area' ? 'line' : type,
              label: label,
              data: data.map(function(d) { return parseValue(d.value); }),
              backgroundColor: isPieOrDoughnut ? palette.slice(0, data.length) : color,
              borderColor: isPieOrDoughnut ? '#fff' : color,
              fill: type === 'area'
            });
          });

          var canvas = document.createElement('canvas');
          chartContainer.insertBefore(canvas, chartContainer.firstChild);
          
          var firstSeries = seriesElements[0];
          var showLegend = containerLegend || firstSeries.getAttribute('data-legend') === 'true' || datasets.length > 1 || isPieOrDoughnut;
          var showGrid = containerGrid || firstSeries.getAttribute('data-grid') === 'true';

          var options = {
            responsive: true,
            plugins: {
              title: {
                display: !!chartTitle,
                text: chartTitle
              },
              legend: { display: showLegend }
            }
          };

          if (!isPieOrDoughnut) {
            options.scales = {
              x: { 
                grid: { display: showGrid },
                stacked: isStacked
              },
              y: { 
                grid: { display: showGrid },
                stacked: isStacked
              }
            };
          }

          new Chart(canvas, {
            type: mainChartType === 'area' ? 'line' : mainChartType,
            data: {
              labels: labels,
              datasets: datasets
            },
            options: options
          });
        }
      });
    });
  </script>`;

export const MERMAID_SCRIPT = `
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      mermaid.initialize({ startOnLoad: true });
    });
  </script>`;
