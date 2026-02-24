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
      document.querySelectorAll('.zolt-chart').forEach(function(chartContainer) {
        var seriesElements = chartContainer.querySelectorAll('.zolt-chart-series');
        if (seriesElements.length === 0) return;

        var chartType = seriesElements[0].getAttribute('data-chart-type') || 'line';
        var chartTitle = seriesElements[0].getAttribute('data-title') || '';
        var datasets = [];
        var labels = null;

        seriesElements.forEach(function(seriesEl) {
          var dataAttr = seriesEl.getAttribute('data-data');
          if (!dataAttr) return;
          var data = JSON.parse(dataAttr);
          
          if (!labels) {
            labels = data.map(function(d) { return d.label; });
          }
          
          var label = seriesEl.getAttribute('data-label') || 'Dataset ' + (datasets.length + 1);
          var color = seriesEl.getAttribute('data-color') || 'rgba(54, 162, 235, 1)';
          
          datasets.push({
            label: label,
            data: data.map(function(d) { return d.value; }),
            backgroundColor: color,
            borderColor: color,
            fill: chartType === 'area'
          });
        });

        var canvas = document.createElement('canvas');
        chartContainer.insertBefore(canvas, chartContainer.firstChild);
        
        new Chart(canvas, {
          type: chartType,
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: !!chartTitle,
                text: chartTitle
              },
              legend: {
                display: datasets.length > 1
              }
            }
          }
        });
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
