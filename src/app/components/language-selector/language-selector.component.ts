import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Dropdown, Ripple, initTE } from 'tw-elements';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LanguageSelectorComponent implements OnInit {
  languages = [
    {
      imgUrl: '/assets/img/gb.png',
      code: 'en',
      name: 'English',
      shorthand: 'ENG',
    },
    {
      imgUrl: '/assets/img/tz.png',
      code: 'sw',
      name: 'Swahili',
      shorthand: 'SWA',
    },
  ];
  @Input() dropdownDirection: string = 'dropdown-end';
  constructor(private translocoService: TranslocoService) {}
  ngOnInit(): void {
    //initTE({ Dropdown, Ripple });
  }
  getActiveLang() {
    let lang = this.languages.find((elem) => {
      return (
        elem.code.toLocaleLowerCase() ==
        this.translocoService.getActiveLang().toLocaleLowerCase()
      );
    });
    if (lang) {
      return lang.imgUrl;
    }
    throw Error('Failed to allocate language.');
  }

  public changeLanguage(languageCode: string): void {
    let activeLang = this.translocoService.getActiveLang().toLocaleLowerCase();
    if (activeLang !== languageCode.toLocaleLowerCase()) {
      this.translocoService.setActiveLang(languageCode);
      localStorage.setItem('activeLang', languageCode);
      location.reload();
    }
  }
}
