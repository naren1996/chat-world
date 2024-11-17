package com.narensoft.chat_world.controller;

import com.narensoft.chat_world.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {
    @MessageMapping("/sendMessage") // Maps client message to this method
    @SendTo("/topic/messages") // Broadcasts to all clients subscribed to "/topic/messages"
    public ChatMessage sendMessage(ChatMessage message) {
        // Add logic like saving to DB if needed
        return message; // The returned object is sent to the subscribers
    }
}
