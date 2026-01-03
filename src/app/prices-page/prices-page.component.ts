import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IgxAvatarComponent, IgxIconComponent } from 'igniteui-angular';

@Component({
  selector: 'app-prices-page',
  imports: [IGX_INPUT_GROUP_DIRECTIVES, IGX_SELECT_DIRECTIVES, IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxIconComponent, FormsModule],
  templateUrl: './prices-page.component.html',
  styleUrls: ['./prices-page.component.scss']
})
export class PricesPageComponent {
  public value = 100;
  public value1 = '0.80';

  // Calculate the total price based on the formula: (grams / 10) * price
  get totalPrice(): string {
    const grams = this.value || 0;
    const pricePerTenGrams = parseFloat(this.value1) || 0;
    const total = (grams / 10) * pricePerTenGrams;
    return total.toFixed(2);
  }

  public stringToNumber(value: string): number {
    return parseFloat(value);
  }
}
