package com.narensoft.chat_world.controller;

import com.narensoft.chat_world.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatController {

    @Autowired
    private SimpUserRegistry simpUserRegistry;


    @Autowired
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
@MessageMapping("/sendMessage")
@SendTo("/topic/messages")
public ChatMessage sendMessage(@Payload ChatMessage message) {
    if (message.getSender() == null || message.getSender().isEmpty()) {
        throw new IllegalArgumentException("Sender cannot be null or empty.");
    }

    System.out.println("Message received from sender: " + message.getSender());
    return message;
}


    @MessageMapping("/addUser")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        System.out.println("User added: " + chatMessage.getSender());
        return chatMessage;
    }

    @MessageMapping("/privateMessage")
    public void sendPrivateMessage(@Payload ChatMessage message, Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Principal is null. User is not authenticated.");
        }
        String sender = principal.getName();
        System.out.println("Message sent by: " + sender);
        System.out.println("Message sent: " + sender + " -----> " + message.getRecipient());

        // Log active users
        System.out.println("Active users:");
        for (SimpUser user : simpUserRegistry.getUsers()) {
            System.out.println("User: " + user.getName());
            for (SimpSession session : user.getSessions()) {
                System.out.println(" - Session ID: " + session.getId());
                for (SimpSubscription subscription : session.getSubscriptions()) {
                    System.out.println("   - Subscription ID: " + subscription.getId());
                    System.out.println("   - Destination: " + subscription.getDestination());
                }
            }
        }

        // Check if recipient is connected
        SimpUser recipientUser = simpUserRegistry.getUser(message.getRecipient());
        if (recipientUser != null) {
            System.out.println("Recipient " + message.getRecipient() + " is connected.");
        } else {
            System.out.println("Recipient " + message.getRecipient() + " is not connected.");
        }

        messagingTemplate.convertAndSendToUser(
                message.getRecipient(),
                "/queue/messages",
                message
        );
    }

}

