import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import dayjs from 'dayjs';

import { ColorService } from 'src/app/services/color-service';
import { Habit, HabitService } from 'src/app/services/habit-service';
import { DailyCount, StatsService } from 'src/app/services/stats-service';
import { ThemeService } from 'src/app/services/theme-service';

import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { HabitDropdownComponent } from 'src/app/components/habit-dropdown/habit-dropdown.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { MonthCalendarComponent } from 'src/app/components/month-calendar/month-calendar.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { ProgressChartComponent } from 'src/app/components/progress-chart/progress-chart.component';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader,
    EmptyStateComponent, HabitDropdownComponent, HeaderComponent,
    MonthCalendarComponent, NavbarComponent, ProgressChartComponent
  ]
})
export class StatsPage implements ViewWillEnter, ViewWillLeave {
  habits: Habit[] = [];
  currentId: string | null = null;
  loaded = false;
  markColor = "var(--app-accent)";

  since: { days: number; hours: number; minutes: number; seconds: number } | null = null;
  counts = { day: 0, week: 0, month: 0 };
  countsDisplay = { day: 0, week: 0, month: 0 };
  markedDays: number[] = [];
  chartData: DailyCount[] = [];
  chartDays = 7;

  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild(HabitDropdownComponent) private dropdown?: HabitDropdownComponent;
  private lastLogAt: string | null = null;
  private monthAnchor = "";
  private timer: any;
  private countUpTimer: any;

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
    this.startTicker();
    this.closeDropdown();
  }

  constructor(
    private colorService: ColorService,
    private habitService: HabitService,
    private statsService: StatsService,
    private theme: ThemeService,
    private router: Router
  ) { }

  ionViewWillLeave() {
    this.stopTicker();
    clearInterval(this.countUpTimer);
  }

  async load() {
    this.habits = await this.habitService.getHabits();
    const current = await this.habitService.getCurrentHabit();
    this.currentId = current ? current.id : null;
    this.monthAnchor = dayjs().toISOString();
    await this.resolveColor(current);
    await this.loadStats();
    this.loaded = true;
  }

  // Résout la couleur de l'habitude courante (pour le calendrier et la courbe).
  async resolveColor(habit: Habit | null) {
    if (!habit) {
      this.markColor = "var(--app-accent)";
      return;
    }
    const color = await this.colorService.getColor(habit.colorId);
    this.markColor = color ? color.value : "var(--app-accent)";
  }

  async loadStats() {
    if (!this.currentId) {
      this.resetStats();
      return;
    }
    const since = await this.statsService.sinceLastLog(this.currentId);
    this.lastLogAt = since ? since.log.occurredAt : null;
    this.updateSince();
    this.counts = {
      day: await this.statsService.count(this.currentId, "day"),
      week: await this.statsService.count(this.currentId, "week"),
      month: await this.statsService.count(this.currentId, "month")
    };
    this.startCountUp();
    await this.loadCalendar(this.monthAnchor);
    await this.loadChart();
  }

  resetStats() {
    this.lastLogAt = null;
    this.since = null;
    this.counts = { day: 0, week: 0, month: 0 };
    this.countsDisplay = { day: 0, week: 0, month: 0 };
    clearInterval(this.countUpTimer);
    this.markedDays = [];
    this.chartData = [];
  }

  // Anime les compteurs de 0 jusqu'à leur valeur cible : les trois atteignent leur
  // valeur en même temps (~0,5 s), donc le plus grand progresse plus vite (par plus
  // gros pas), chacun « cadencé » par sa propre cible.
  private startCountUp() {
    clearInterval(this.countUpTimer);
    this.countsDisplay = { day: 0, week: 0, month: 0 };
    const duration = 500;
    const start = performance.now();
    this.countUpTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      this.countsDisplay = {
        day: Math.round(this.counts.day * progress),
        week: Math.round(this.counts.week * progress),
        month: Math.round(this.counts.month * progress)
      };
      if (progress >= 1) {
        clearInterval(this.countUpTimer);
      }
    }, 16);
  }

  async loadCalendar(anchorISO: string) {
    this.monthAnchor = anchorISO;
    if (!this.currentId) {
      this.markedDays = [];
      return;
    }
    this.markedDays = await this.statsService.monthDays(this.currentId, anchorISO);
  }

  async loadChart() {
    if (!this.currentId) {
      this.chartData = [];
      return;
    }
    const to = dayjs().toISOString();
    const from = dayjs().subtract(this.chartDays - 1, "day").toISOString();
    this.chartData = await this.statsService.dailyCounts(this.currentId, from, to);
  }

  async onPickHabit(id: string) {
    this.currentId = id;
    await this.habitService.setCurrentHabitId(id);
    const habit = this.habits.find((h) => h.id === id) || null;
    await this.resolveColor(habit);
    await this.loadStats();
    await this.content?.scrollToTop(300);
  }

  onMonthChange(anchorISO: string) {
    this.loadCalendar(anchorISO);
  }

  async setChartDays(days: number) {
    this.chartDays = days;
    await this.loadChart();
  }

  // Referme le dropdown d'habitude à l'arrivée sur la page (undefined si empty state).
  private closeDropdown() {
    this.dropdown?.close();
  }

  goToHabits() {
    this.router.navigateByUrl("/habits");
  }

  // Ticker « live » : rafraîchit la durée depuis le dernier log chaque seconde.
  private startTicker() {
    this.stopTicker();
    this.timer = setInterval(() => this.updateSince(), 1000);
  }

  private stopTicker() {
    clearInterval(this.timer);
  }

  private updateSince() {
    if (!this.lastLogAt) {
      this.since = null;
      return;
    }
    const totalSeconds = dayjs().diff(dayjs(this.lastLogAt), "second");
    this.since = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }
}
