import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { RequestClientService } from 'src/app/core/services/request-client.service';

@Component({
  selector: 'app-chat-agent',
  templateUrl: './chat-agent.component.html',
  styleUrls: ['./chat-agent.component.scss'],
  standalone: true,
  imports: [CommonModule],
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAgentComponent {
  public serviceTexts: any[] = [];
  @ViewChild('serviceUl') serviceUl!: ElementRef;
  constructor(
    private client: RequestClientService,
    private appConfig: AppConfigService
  ) {}
  private sendRequest(text: string): Observable<any> {
    let response = localStorage.getItem('userProfile');
    if (!response) {
      throw Error(`Failed to find user object`);
    }
    let res = this.appConfig.getLoginResponse();
    let payload = { userId: res.Usno, text: text };
    return this.client.performPostChat(`/chat`, payload);
  }
  openQuestionFileDialog() {
    let input = document.createElement('input') as HTMLInputElement;
    input.setAttribute('type', 'file');
    input.click();
    input.addEventListener('change', (e) => {
      let t = e.target as HTMLInputElement;
      if (t && t.files) {
        const fileName = t.files[0];
        this.sendServiceText(fileName.name);
      }
    });
  }
  getCurrentTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', { hour12: false });
  }
  sendServiceText(text: string) {
    if (text && text.trim().length !== 0) {
      let tempRes = {
        text: text.trim(),
        response: null,
      };
      this.serviceTexts.push(tempRes);
      this.sendRequest(text).subscribe({
        next: (res) => {
          this.serviceTexts[this.serviceTexts.indexOf(tempRes)].response = {
            text: res.text,
            time: new Date(),
          };
          let ul = this.serviceUl.nativeElement as HTMLUListElement;
          ul.scrollTo(0, ul.scrollHeight);
        },
        error: (err) => {},
      });
    }
  }
}
