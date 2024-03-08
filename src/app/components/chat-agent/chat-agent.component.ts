import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat-agent',
  templateUrl: './chat-agent.component.html',
  styleUrls: ['./chat-agent.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ChatAgentComponent {
  public serviceTexts: any[] = [];
  @ViewChild('serviceUl') serviceUl!: ElementRef;
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
  sendServiceText(text: string) {
    if (text && text.trim().length !== 0) {
      let response = {
        text: text.trim(),
        response: { text: 'reply goes here' },
      };
      this.serviceTexts.push(response);
      let ul = this.serviceUl.nativeElement as HTMLUListElement;
      ul.scrollTo(0, ul.scrollHeight);
    }
  }
}
