export const TABS_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.zolt-tabs').forEach(function(tabsContainer) {
        const buttons = tabsContainer.querySelectorAll('.zolt-tab-button');
        const panels = tabsContainer.querySelectorAll('.zolt-tab-panel');
        
        buttons.forEach(function(button) {
          button.addEventListener('click', function() {
            const tabIndex = this.getAttribute('data-tab-index');
            
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
      const target = document.querySelector(':target');
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
      const defaultColors = [
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

      const schemes = {
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
          const cleaned = v.replace(/[^\\d.-]/g, '');
          const num = parseFloat(cleaned);
          
          return isNaN(num) ? v : num;
        }
        return v;
      }

      document.querySelectorAll('.zolt-chart').forEach(function(chartContainer) {
        const seriesElements = chartContainer.querySelectorAll('.zolt-chart-series');
        if (seriesElements.length === 0) return;

        const layout = chartContainer.getAttribute('data-layout');
        const containerScheme = chartContainer.getAttribute('data-scheme') || chartContainer.getAttribute('scheme');
        const containerStacked = chartContainer.getAttribute('data-stacked') === 'true' || chartContainer.getAttribute('stacked') === 'true';
        const containerLegend = chartContainer.getAttribute('data-legend') === 'true' || chartContainer.getAttribute('legend') === 'true';
        const containerGrid = chartContainer.getAttribute('data-grid') === 'true' || chartContainer.getAttribute('grid') === 'true';

        const chartTitle = chartContainer.getAttribute('data-title') || 
                         chartContainer.getAttribute('title') || 
                         (seriesElements.length === 1 ? seriesElements[0].getAttribute('data-title') : '') || 
                         '';
        
        if (layout === 'horizontal' || layout === 'vertical') {
          chartContainer.style.display = 'flex';
          chartContainer.style.flexDirection = layout === 'horizontal' ? 'row' : 'column';
          chartContainer.style.gap = '1rem';
          chartContainer.style.flexWrap = 'wrap';
          if (chartTitle) {
            const titleEl = document.createElement('div');
            titleEl.className = 'block-title';
            titleEl.textContent = chartTitle;
            titleEl.style.width = '100%';
            chartContainer.insertBefore(titleEl, chartContainer.firstChild);
          }
          
          seriesElements.forEach(function(seriesEl, idx) {
            const chartType = seriesEl.getAttribute('data-chart-type') || 'line';
            const dataAttr = seriesEl.getAttribute('data-data');
            if (!dataAttr) return;
            const data = JSON.parse(dataAttr);
            
            const wrapper = document.createElement('div');
            wrapper.style.flex = '1 1 300px';
            wrapper.style.minWidth = '0';
            const canvas = document.createElement('canvas');
            wrapper.appendChild(canvas);
            chartContainer.appendChild(wrapper);
            
            const label = seriesEl.getAttribute('data-label') || seriesEl.getAttribute('data-title') || 'Dataset';
            const scheme = seriesEl.getAttribute('data-scheme') || seriesEl.getAttribute('scheme') || containerScheme;
            const palette = getPalette(scheme);
            const color = seriesEl.getAttribute('data-color') || palette[idx % palette.length];
            const showLegend = seriesEl.getAttribute('data-legend') === 'true' || containerLegend;
            const showGrid = seriesEl.getAttribute('data-grid') === 'true' || containerGrid;
            const isStacked = seriesEl.getAttribute('data-stacked') === 'true' || seriesEl.getAttribute('stacked') === 'true' || containerStacked;

            const isPieOrDoughnut = chartType === 'pie' || chartType === 'doughnut';
            const chartData = data.map(function(d) { return parseValue(d.value); });
            const backgroundColors = isPieOrDoughnut ? palette.slice(0, data.length) : color;

            const options = {
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
          const mainChartType = seriesElements[0].getAttribute('data-chart-type') || 'line';
          const isPieOrDoughnut = mainChartType === 'pie' || mainChartType === 'doughnut';
          const datasets = [];
          let labels = null;
          
          const isStacked = containerStacked || Array.prototype.some.call(seriesElements, function(el) { 
            return el.getAttribute('data-stacked') === 'true' || el.getAttribute('stacked') === 'true'; 
          });

          seriesElements.forEach(function(seriesEl, idx) {
            const dataAttr = seriesEl.getAttribute('data-data');
            if (!dataAttr) return;
            const data = JSON.parse(dataAttr);
            
            if (!labels) {
              labels = data.map(function(d) { return d.label; });
            }
            
            const type = seriesEl.getAttribute('data-chart-type') || mainChartType;
            const label = seriesEl.getAttribute('data-label') || seriesEl.getAttribute('data-title') || 'Dataset ' + (datasets.length + 1);
            const scheme = seriesEl.getAttribute('data-scheme') || seriesEl.getAttribute('scheme') || containerScheme;
            const palette = getPalette(scheme);
            const color = seriesEl.getAttribute('data-color') || palette[idx % palette.length];
            
            datasets.push({
              type: type === 'area' ? 'line' : type,
              label: label,
              data: data.map(function(d) { return parseValue(d.value); }),
              backgroundColor: isPieOrDoughnut ? palette.slice(0, data.length) : color,
              borderColor: isPieOrDoughnut ? '#fff' : color,
              fill: type === 'area'
            });
          });

          const canvas = document.createElement('canvas');
          chartContainer.insertBefore(canvas, chartContainer.firstChild);
          
          const firstSeries = seriesElements[0];
          const showLegend = containerLegend || firstSeries.getAttribute('data-legend') === 'true' || datasets.length > 1 || isPieOrDoughnut;
          const showGrid = containerGrid || firstSeries.getAttribute('data-grid') === 'true';

          const options = {
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
      const isDark = document.body.classList.contains('color-scheme-dark') || 
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                    !document.body.classList.contains('color-scheme-light'));
      
      mermaid.initialize({ 
        startOnLoad: true,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      });
    });
  </script>`;

export const CODE_COPY_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.zolt-copy-button').forEach(function(button) {
        button.addEventListener('click', function() {
          const codeBlock = this.closest('.zolt-code-block');
          const code = codeBlock.querySelector('code').innerText;
          
          navigator.clipboard.writeText(code).then(function() {
            const originalText = button.innerText;
            button.innerText = 'Copié !';
            button.classList.add('copied');
            
            setTimeout(function() {
              button.innerText = originalText;
              button.classList.remove('copied');
            }, 2000);
          });
        });
      });
    });
  </script>`;

export const SIDEBAR_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const sidebar = document.querySelector('.zolt-sidebar');
      const toggle = document.querySelector('.zolt-sidebar-toggle');
      const close = document.querySelector('.zolt-sidebar-close');
      
      if (!sidebar) return;

      if (toggle) {
        toggle.addEventListener('click', function() {
          sidebar.classList.toggle('is-open');
          document.body.classList.toggle('sidebar-is-open');
        });
      }

      if (close) {
        close.addEventListener('click', function() {
          sidebar.classList.remove('is-open');
          document.body.classList.remove('sidebar-is-open');
        });
      }

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function(event) {
        const isClickInside = sidebar.contains(event.target) || (toggle && toggle.contains(event.target));
        if (!isClickInside && sidebar.classList.contains('is-open')) {
          sidebar.classList.remove('is-open');
          document.body.classList.remove('sidebar-is-open');
        }
      });
    });
  </script>`;

export const FILETREE_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        const activeLink = document.querySelector('.zolt-filetree li.active');
        if (activeLink) {
          activeLink.scrollIntoView({ 
            block: 'center', 
            behavior: 'smooth'
          });
        }
      }, 100);
    });
  </script>`;
