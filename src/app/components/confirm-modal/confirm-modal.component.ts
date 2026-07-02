import { Component, input, output } from '@angular/core';

import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: true,
  imports: [ModalComponent]
})
export class ConfirmModalComponent {
  // Modale de confirmation, bâtie sur app-modal.
  open = input<boolean>(false);
  title = input<string>("Confirmer");
  message = input<string>("");
  confirmLabel = input<string>("Confirmer");
  cancelLabel = input<string>("Annuler");
  danger = input<boolean>(false);
  confirm = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
