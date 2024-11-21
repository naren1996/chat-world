package com.narensoft.chat_world.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private final SimpUserRegistry simpUserRegistry;

    public WebSocketEventListener(SimpUserRegistry simpUserRegistry) {
        this.simpUserRegistry = simpUserRegistry;
    }

    @EventListener
    public void onUserConnectEvent(SessionConnectEvent event) {
        System.out.println("A new WebSocket session connected!");

        for (SimpUser user : simpUserRegistry.getUsers()) {
            System.out.println("Connected user: " + user.getName());
            user.getSessions().forEach(session ->
                    System.out.println("Session ID: " + session.getId())
            );
        }
    }
}
