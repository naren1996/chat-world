let client = null;

//function connect() {
//    client = new StompJs.Client({
//        //webSocketFactory: () => new SockJS('http://localhost:8080/chat'),
//        webSocketFactory: () => new SockJS('http://localhost:8080/chat?username=${encodeURIComponent(username)}'),
//        reconnectDelay: 5000,
//        heartbeatIncoming: 4000,
//        heartbeatOutgoing: 4000,
//        onConnect: () => {
//            console.log('Connected to the broker.');
//
//            // Subscribe to the public topic
//            client.subscribe('/topic/messages', (message) => {
//                const chatMessage = JSON.parse(message.body);
//                if (chatMessage.sender && chatMessage.content.includes('joined the chat')) {
//                    console.log(`${chatMessage.sender} has joined.`);
//                }
//                showMessage(chatMessage);
//            });
//
//            // Subscribe to the user's private queue
//            client.subscribe('/user/queue/messages', (message) => {
//                const chatMessage = JSON.parse(message.body);
//                console.log('Private message received:', chatMessage);
//                // Open a private chat box if it doesn't exist
//                const sender = chatMessage.sender;
//                if (!document.getElementById(`private-chat-${sender}`)) {
//                    createPrivateChatBox(sender);
//                }
//
//                // Display the message in the chat box
//                showPrivateMessage(chatMessage, sender);
//            });
//            console.log('Subscribed to private queue: /user/queue/messages');
//
//        },
//        onStompError: (frame) => {
//            console.error('Broker reported error:', frame.headers['message']);
//        },
//    });
function connect() {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Please register first.');
        return;
    }

    client = new StompJs.Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/chat'),
        connectHeaders: {
            username: username
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
            console.log('Connected to the broker.');

            // Subscribe to the public topic
            client.subscribe('/topic/messages', (message) => {
                const chatMessage = JSON.parse(message.body);
                if (chatMessage.sender && chatMessage.content.includes('joined the chat')) {
                    console.log(`${chatMessage.sender} has joined.`);
                }
                showMessage(chatMessage);
            });

            // Subscribe to the user's private queue
            client.subscribe('/user/queue/messages', (message) => {
                const chatMessage = JSON.parse(message.body);
                console.log('Private message received:', chatMessage);
                // Open a private chat box if it doesn't exist
                const sender = chatMessage.sender;
                if (!document.getElementById(`private-chat-${sender}`)) {
                    createPrivateChatBox(sender);
                }

                // Display the message in the chat box
                showPrivateMessage(chatMessage, sender);
            });
            console.log('Subscribed to private queue: /user/queue/messages');

            // Send the addUser message now that we're connected
            const message = {
                sender: username,
                content: `${username} joined the chat.`,
                timestamp: new Date().toISOString()
            };

            client.publish({
                destination: '/app/addUser',
                body: JSON.stringify(message)
            });
        },
        onStompError: (frame) => {
            console.error('Broker reported error:', frame.headers['message']);
        },
    });

    client.activate();
}

function registerUser() {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('Please enter a username to join the chat.');
        return;
    }

    // Save the username locally
    localStorage.setItem('username', username);

    // Toggle visibility of elements
    document.getElementById('user-registration').style.display = 'none';
    document.getElementById('public-chat').style.display = 'block';

    // Connect to the WebSocket with the username
    connect();
}




function sendPublicMessage() {
    const messageContent = document.getElementById('message').value;
    const username = localStorage.getItem('username');

    if (messageContent && client && client.connected) {
        const message = {
            sender: username,
            content: messageContent,
            timestamp: new Date().toISOString()
        };
        client.publish({
            destination: '/app/sendMessage',
            body: JSON.stringify(message)
        });
        showMessage(message, true);
        document.getElementById('message').value = ''; // Clear the input field
    } else {
        console.error('Client is not connected or message is empty.');
    }
}

function showMessage(message, isSender = false) {
    // Ensure the messagesDiv exists
    const username = localStorage.getItem('username');
    if (!isSender && message.sender === username) {
            return;
      }
    const messagesDiv = document.getElementById('messages');
        if (!messagesDiv) {
            console.error('Messages div not found. Message:', message);
            return;
        }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isSender ? 'sent' : 'received');
    messageElement.innerHTML = `<b>${message.sender}:</b> ${message.content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the bottom
}



function sendPrivateMessage(recipient) {
    const messageContent = document.getElementById(`message-${recipient}`).value;
    const username = localStorage.getItem('username');

    // Construct the message
    const message = {
        sender: username,
        recipient: recipient,
        content: messageContent,
        timestamp: new Date().toISOString()
    };
    //TO-DO add queue to store messages if offline

    // Send the message to the backend
    client.publish({
        destination: '/app/privateMessage',
        body: JSON.stringify(message)
    });

    // Display the message in the sender's chat box
    showPrivateMessage(message, recipient, true);

    // Clear the input field
    document.getElementById(`message-${recipient}`).value = '';
}

function createPrivateChatBox(recipient) {
    const chatContainer = document.getElementById('chat-container');
    // Check if a chat box for this recipient already exists
    if (!document.getElementById(`private-chat-${recipient}`)) {
        // Create a new private chat box
        const chatBox = document.createElement('div');
        chatBox.id = `private-chat-${recipient}`;
        chatBox.className = 'chat-window';
        chatBox.innerHTML = `
            <h2>Chat with ${recipient}</h2>
            <div class="messages" id="private-messages-${recipient}" style="height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; margin-bottom: 10px; background-color: #fff;"></div>
            <input type="text" id="message-${recipient}" placeholder="Enter your message" style="width: 80%;" />
            <button onclick="sendPrivateMessage('${recipient}')">Send</button>
        `;
        chatContainer.appendChild(chatBox); // Add the new chat box to the container
    } else {
        alert(`Private chat with ${recipient} already exists.`);
    }
}

function openPrivateChat() {
    const recipient = document.getElementById('recipient').value;
    if (recipient) {
        createPrivateChatBox(recipient);
    } else {
        alert('Please enter a recipient ID.');
    }
}




function showPrivateMessage(message, recipient, isSender = false) {
    const username = localStorage.getItem('username');
    if (!isSender && message.sender === username) {
        return; // Skip showing the message
    }
    const messagesDiv = document.getElementById(`private-messages-${recipient}`);
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isSender ? 'sent' : 'received');
    messageElement.innerHTML = `<b>${message.sender}:</b> ${message.content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


