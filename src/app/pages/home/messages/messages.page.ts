import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { lastSeen } from 'src/app/extras/utils';
import { AuthService } from 'src/app/services/auth/auth.service';
import { RoomService } from 'src/app/services/chat/room.service';
import { FcmService } from 'src/app/services/fcm/fcm.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit {
  rooms: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  isLoading: boolean = false;

  model = {
    icon: 'chatbubbles-outline',
    title: 'No Chat Rooms',
    color: 'warning',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private roomService: RoomService,
    private fcmService: FcmService
  ) {}

  async ngOnInit() {
    // Trigger FCM
    this.fcmService.registerPush();
    // Get all chat Rooms
    await this.listRooms();
  }

  async listRooms() {
    const cUserId = this.authService.getUserId();
    await this.roomService.listRooms(cUserId);
    this.rooms = this.roomService.rooms;
  }

  getChat(room) {
    this.router.navigate(['/', 'home', 'chat', room.$id]);
  }

  openArchiveMessages() {
    console.log('openArchiveMessages clicked');
  }

  handleRefresh(event) {
    this.listRooms();
    event.target.complete();
    console.log('Async operation refresh has ended');
  }

  archiveChat(room) {
    console.log('archiveChat clicked', room);
  }

  messageTime(d: any) {
    if (!d) return null;
    let time = lastSeen(d);
    if (time === 'online') time = 'just now';
    return time;
  }
}
