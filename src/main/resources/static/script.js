let client = null;
    const userId = `User-${Math.floor(Math.random() * 10000)}`; // Generate a unique user ID

    // Connect to WebSocket
    function connect() {
        client = new StompJs.Client({ // Use StompJs.Client as requested
            webSocketFactory: () => new SockJS('http://localhost:8080/chat'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to the broker as', userId);
                // Subscribe to a topic
                client.subscribe('/topic/messages', (message) => {
                    const chatMessage = JSON.parse(message.body);
                    if (chatMessage.sender !== userId) {
                          showMessage(chatMessage);
                    }
                });

            },
            onStompError: (frame) => {
                console.error('Broker reported error:', frame.headers['message']);
                console.error('Additional details:', frame.body);
            },
        });

        client.activate();
    }

    // Send message
    function sendMessage() {
        const messageContent = document.getElementById('message').value;
        if (messageContent && client && client.connected) {
            const message = {
                sender: userId,
                content: messageContent,
                timestamp: new Date().toISOString()
            };
            client.publish({
                destination: '/app/sendMessage',
                body: JSON.stringify(message)
            });
            showMessage(message, true); // Show the message immediately on the sender's side
            document.getElementById('message').value = ''; // Clear the input field
        } else {
            console.error('Client is not connected or message is empty.');
        }
    }

    // Display message
    function showMessage(message, isSender = false) {
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isSender || message.sender === userId ? 'sent' : 'received');
        messageElement.innerHTML = `<b>${message.sender}:</b> ${message.content}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the bottom
    }

    connect(); // Connect when the page loads