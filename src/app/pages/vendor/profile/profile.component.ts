import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
// import { Tab, initTE } from 'tw-elements';
import { Tab, initTE } from 'tw-elements';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  ngOnInit(): void {
    //initTE({ Tab });
    initTE({ Tab }, { allowReinits: true });
  }
}
