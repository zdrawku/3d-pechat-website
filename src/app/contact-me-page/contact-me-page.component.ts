import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective } from 'igniteui-angular';

@Component({
  selector: 'app-contact-me-page',
  imports: [IGX_INPUT_GROUP_DIRECTIVES, IgxButtonDirective, FormsModule],
  templateUrl: './contact-me-page.component.html',
  styleUrls: ['./contact-me-page.component.scss']
})

export class ContactMePageComponent implements OnInit {
  public value?: string;
  public value1?: string;
  public value2?: string;
  public message?: string;

  phoneNumber = '+359883310616';

  constructor(private router: Router) {
    // Check if navigation state contains prefilled message
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      if (state['prefilledMessage']) {
        this.message = state['prefilledMessage'];
      }
      if (state['productName']) {
        this.value2 = `Поръчка за ${state['productName']}`;
      }
    }
  }

  ngOnInit(): void {
    // Also check for state from history in case component is already initialized
    const state = history.state;
    if (state && state['prefilledMessage'] && !this.message) {
      this.message = state['prefilledMessage'];
    }
    if (state && state['productName'] && !this.value2) {
      this.value2 = `Поръчка за ${state['productName']}`;
    }
  }

  openViber(): void {
    const viberUrl = `viber://add?number=${this.phoneNumber}`;
    window.location.href = viberUrl;
  }

  sendEmail(): void {
    // Validate required fields
    if (!this.value || !this.value1 || !this.value2 || !this.message) {
      alert('Моля, попълнете всички полета');
      return;
    }

    // Construct the email
    const to = 'zdrawko.kolew@gmail.com';
    const subject = encodeURIComponent(this.value2);
    const body = encodeURIComponent(
      `Име: ${this.value}\n` +
      `Email: ${this.value1}\n\n` +
      `Съобщение:\n${this.message}`
    );

    // Open email client
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }
}
