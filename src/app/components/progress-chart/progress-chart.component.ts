import { Component, computed, input } from '@angular/core';

import { DailyCount } from '../../services/stats-service';

@Component({
  selector: 'app-progress-chart',
  templateUrl: './progress-chart.component.html',
  styleUrls: ['./progress-chart.component.scss'],
  standalone: true,
  imports: []
})
export class ProgressChartComponent {
  // Courbe SVG maison : nombre de logs par jour sur une fenêtre donnée.
  data = input.required<DailyCount[]>();
  color = input<string>("var(--app-accent)");

  // Géométrie du dessin (coordonnées SVG).
  private readonly width = 300;
  private readonly height = 120;
  private readonly pad = 8;

  viewBox = `0 0 ${this.width} ${this.height}`;
  hasData = computed<boolean>(() => this.data().some((point) => point.count > 0));
  maxValue = computed<number>(() => Math.max(0, ...this.data().map((point) => point.count)));
  points = computed<string>(() => this.buildPoints());

  private buildPoints(): string {
    const data = this.data();
    if (data.length === 0) {
      return "";
    }
    const max = Math.max(1, ...data.map((point) => point.count));
    const innerW = this.width - this.pad * 2;
    const innerH = this.height - this.pad * 2;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    return data
      .map((point, i) => {
        const x = this.pad + i * step;
        const y = this.pad + innerH - (point.count / max) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }
}
