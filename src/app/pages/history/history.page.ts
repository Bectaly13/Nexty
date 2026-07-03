import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import dayjs from 'dayjs';

import { Habit, HabitService } from 'src/app/services/habit-service';
import { Log, LogService } from 'src/app/services/log-service';
import { NotificationService } from 'src/app/services/notification-service';
import { ThemeService } from 'src/app/services/theme-service';

import { ConfirmModalComponent } from 'src/app/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { HabitDropdownComponent } from 'src/app/components/habit-dropdown/habit-dropdown.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { ModalComponent } from 'src/app/components/modal/modal.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonIcon, FormsModule,
    ConfirmModalComponent, EmptyStateComponent, HabitDropdownComponent,
    HeaderComponent, ModalComponent, NavbarComponent
  ]
})
export class HistoryPage implements ViewWillEnter, AfterViewInit, OnDestroy {
  habits: Habit[] = [];
  currentId: string | null = null;
  logs: Log[] = [];
  loaded = false;

  // Chargement par batch : on n'affiche que `displayCount` logs, incrémenté quand
  // on approche du bas de la liste (infinite scroll).
  readonly pageSize = 30;
  displayCount = this.pageSize;

  // `baseOccurredAt` = horodatage ISO d'origine, conservé pour ne pas perdre les
  // secondes (le picker natif n'édite que jusqu'à la minute).
  editModal = { open: false, id: "", baseOccurredAt: "", occurredAt: "", comment: "" };
  deleteModal = { open: false, id: "" };

  @ViewChild('sentinel') private sentinel?: ElementRef<HTMLElement>;
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild(HabitDropdownComponent) private dropdown?: HabitDropdownComponent;
  private observer?: IntersectionObserver;

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
    this.closeDropdown();
  }

  constructor(
    private habitService: HabitService,
    private logService: LogService,
    private notifications: NotificationService,
    private theme: ThemeService,
    private router: Router
  ) {
    addIcons({ "create-outline": createOutline, "trash-outline": trashOutline });
  }

  ngAfterViewInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  // Logs réellement affichés (limités au batch courant).
  get displayedLogs(): Log[] {
    return this.logs.slice(0, this.displayCount);
  }

  async load() {
    this.habits = await this.habitService.getHabits();
    const current = await this.habitService.getCurrentHabit();
    this.currentId = current ? current.id : null;
    await this.loadLogs();
    this.loaded = true;
  }

  // Charge les logs de l'habitude courante, du plus récent au plus ancien, et
  // réinitialise le batch affiché.
  async loadLogs() {
    this.displayCount = this.pageSize;
    if (!this.currentId) {
      this.logs = [];
      return;
    }
    const logs = await this.logService.getLogs(this.currentId);
    this.logs = logs.sort((a, b) => dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf());
  }

  async onPickHabit(id: string) {
    this.currentId = id;
    await this.habitService.setCurrentHabitId(id);
    await this.loadLogs();
    await this.content?.scrollToTop(300);
  }

  // Formate un horodatage ISO pour l'affichage (locale française).
  formatDate(iso: string): string {
    return dayjs(iso).format("D MMMM YYYY [à] HH:mm");
  }

  openEdit(log: Log) {
    this.editModal = {
      open: true,
      id: log.id,
      baseOccurredAt: log.occurredAt,
      occurredAt: dayjs(log.occurredAt).format("YYYY-MM-DDTHH:mm"),
      comment: log.comment ?? ""
    };
  }

  closeEdit() {
    this.editModal.open = false;
  }

  async saveEdit() {
    // Le picker n'édite que jusqu'à la minute : on réinjecte les secondes/ms d'origine
    // pour ne pas les tronquer.
    const base = dayjs(this.editModal.baseOccurredAt);
    const iso = dayjs(this.editModal.occurredAt)
      .second(base.second())
      .millisecond(base.millisecond())
      .toISOString();
    await this.logService.editLog(this.editModal.id, {
      occurredAt: iso,
      comment: this.editModal.comment.trim() || null
    });
    this.editModal.open = false;
    await this.loadLogs();
    await this.rescheduleCurrent();
  }

  openDelete(log: Log) {
    this.deleteModal = { open: true, id: log.id };
  }

  closeDelete() {
    this.deleteModal.open = false;
  }

  async confirmDelete() {
    await this.logService.removeLog(this.deleteModal.id);
    this.deleteModal.open = false;
    await this.loadLogs();
    await this.rescheduleCurrent();
  }

  // Replanifie le rappel de l'habitude courante (son dernier log a pu changer).
  private async rescheduleCurrent() {
    if (this.currentId) {
      await this.notifications.rescheduleForHabit(this.currentId);
    }
  }

  // Referme le dropdown d'habitude à l'arrivée sur la page (undefined si empty state).
  private closeDropdown() {
    this.dropdown?.close();
  }

  goToHabits() {
    this.router.navigateByUrl("/habits");
  }

  // Observe une sentinelle en bas de liste : dès qu'elle approche du viewport, on
  // charge le batch suivant (marge de 300px pour précharger avant d'atteindre le bas).
  private setupObserver() {
    if (!this.sentinel) {
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.loadMore();
        }
      },
      { rootMargin: "300px" }
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  private loadMore() {
    if (this.displayCount < this.logs.length) {
      this.displayCount += this.pageSize;
    }
  }
}
