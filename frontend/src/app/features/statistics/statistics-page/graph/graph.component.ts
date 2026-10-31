import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {Statistic} from '@core/models/Statistic';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-graph',
  template: `
    <div class="chart-container" style="position: relative; width: 100%; height: 100%; contain: strict;">
      <canvas #chartCanvas style="display: block; width: 100%; height: 100%;"></canvas>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; overflow: hidden; }
    .chart-container {
      border-radius: 8px;
    }
    canvas { image-rendering: -webkit-optimize-contrast; }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() results: Statistic[] = [];
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;

  constructor(private ngZone: NgZone, private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initChart();
      this.setupResizeObserver();
    });
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.ngZone.runOutsideAngular(() => {
        this.scheduleUpdate();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver?.disconnect();
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
      text: style.getPropertyValue('--text-secondary').trim() || '#a3a3a3',
      grid: style.getPropertyValue('--border-color').trim() || 'rgba(255, 255, 255, 0.1)',
      primary: style.getPropertyValue('--primary').trim() || '#8b5cf6'
    };
  }

  private initChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = this.getThemeColors();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.results.map(r => r.name),
        datasets: [{
          label: this.yAxisLabel,
          data: this.results.map(r => r.value),
          backgroundColor: colors.primary,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, maxRotation: 0, autoSkip: true },
            title: { display: true, text: this.xAxisLabel, color: colors.text }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              callback: (val) => Number(val) % 1 === 0 ? val : ''
            },
            title: { display: true, text: this.yAxisLabel, color: colors.text }
          }
        }
      }
    });
  }

  private scheduleUpdate(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() => {
      this.updateChart();
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    const colors = this.getThemeColors();

    this.chart.data.labels = this.results.map(r => r.name);
    this.chart.data.datasets[0].data = this.results.map(r => r.value);
    this.chart.data.datasets[0].backgroundColor = colors.primary;

    if (this.chart.options.scales?.['x']) {
      const xScale = this.chart.options.scales['x'] as any;
      xScale.ticks.color = colors.text;
      xScale.title.color = colors.text;
      xScale.title.text = this.xAxisLabel;
    }

    if (this.chart.options.scales?.['y']) {
      const yScale = this.chart.options.scales['y'] as any;
      yScale.ticks.color = colors.text;
      yScale.grid.color = colors.grid;
      yScale.title.color = colors.text;
      yScale.title.text = this.yAxisLabel;
    }

    this.chart.update();
  }

  private setupResizeObserver(): void {
    let timeout: any;
    this.resizeObserver = new ResizeObserver(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.ngZone.runOutsideAngular(() => {
          this.chart?.resize();
        });
      }, 100);
    });
    this.resizeObserver.observe(this.chartCanvas.nativeElement.parentElement!);
  }
}
