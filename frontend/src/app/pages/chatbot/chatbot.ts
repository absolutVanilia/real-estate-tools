
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatbotService } from '../../services/chatbot.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})
export class ChatbotComponent {
  userInput = '';
  messages: Message[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private chatbotService: ChatbotService) {}

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    const message = this.userInput;

    this.messages.push({
      role: 'user',
      content: message
    });

    this.userInput = '';
    this.isLoading = true;
    this.errorMessage = '';

    this.chatbotService.sendMessage(message).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: JSON.stringify(res) // for now (debug mode)
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error: ' + err.message;
        this.isLoading = false;
      }
    });
  }
}